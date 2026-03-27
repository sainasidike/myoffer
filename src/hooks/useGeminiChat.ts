import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-chat`;
const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`;

// Use Lovable Cloud URL for direct DB operations (profile sync)
const CLOUD_REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const CLOUD_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const FIELD_TO_COLUMN: Record<string, string> = {
  targetDegree: "target_degree",
  currentEducation: "current_education",
  school: "school",
  major: "major",
  crossMajor: "cross_major",
  gpa: "gpa",
  languageType: "language_type",
  languageScore: "language_score",
  greGmat: "gre_gmat",
  internship: "internship",
  research: "research",
  awards: "awards",
  entrepreneurship: "entrepreneurship",
  volunteer: "volunteer",
  overseas: "overseas",
  otherActivities: "other_activities",
  targetCountry: "target_country",
  budget: "budget",
  targetYear: "target_year",
  scholarship: "scholarship",
  rankingReq: "ranking_req",
  specialNeeds: "special_needs",
};

const STAGE_KEYWORDS = ["本科", "硕士", "博士", "master", "phd", "bachelor", "研究生", "undergraduate", "graduate"];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content: "你好！我是你的专属留学申请助手，很高兴能为你服务 😊 为了更好的帮你规划，请你告诉我你想申请的阶段：本科/硕士/博士？",
};

const UPLOAD_HINT_MESSAGE: ChatMessage = {
  id: "upload-hint",
  role: "ai",
  content: "对了，你也可以随时把手头的材料上传给我——比如成绩单、简历、获奖证书等，支持 PDF 和图片格式，可以直接拖拽或点击附件按钮上传，我来帮你自动识别信息 📎",
};

type ChatState = "ask_stage" | "free_chat";

/** Get a valid access token — tries the Supabase client session first */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function getUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("ask_stage");
  const profileDataRef = useRef<Record<string, string>>({});
  const [profileVersion, setProfileVersion] = useState(0);

  /** Sync profile data to Lovable Cloud DB via REST API directly */
  const syncProfileToDb = useCallback(async (data: Record<string, string>) => {
    try {
      const userId = await getUserId();
      const token = await getAccessToken();
      if (!userId || !token) return;

      const dbData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        const col = FIELD_TO_COLUMN[key];
        if (col && value) dbData[col] = value;
      }
      if (Object.keys(dbData).length === 0) return;

      const body = { user_id: userId, ...dbData, updated_at: new Date().toISOString() };

      await fetch(`${CLOUD_REST_URL}/user_onboarding_profiles?on_conflict=user_id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CLOUD_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: "resolution=merge-duplicates",
          "Content-Profile": "public",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  }, []);

  const extractProfileUpdates = useCallback((text: string) => {
    const profileMatch = text.match(/<<<PROFILE_UPDATE:(.*?)>>>/g);
    if (profileMatch) {
      for (const match of profileMatch) {
        try {
          const json = match.replace("<<<PROFILE_UPDATE:", "").replace(">>>", "");
          const data = JSON.parse(json);
          profileDataRef.current = { ...profileDataRef.current, ...data };
        } catch { /* ignore */ }
      }
      syncProfileToDb(profileDataRef.current);
      setProfileVersion((v) => v + 1);
      return text.replace(/<<<PROFILE_UPDATE:.*?>>>/g, "").trim();
    }
    return text;
  }, [syncProfileToDb]);

  const callAI = useCallback(async (apiMessages: Array<{ role: string; content: string }>) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CLOUD_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: apiMessages,
        profileData: profileDataRef.current,
      }),
    });

    if (!resp.ok || !resp.body) {
      const errorData = await resp.json().catch(() => ({ error: "AI 服务暂时不可用" }));
      throw new Error(errorData.error || `HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let fullText = "";
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    let streamDone = false;
    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { streamDone = true; break; }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullText += content;
            const captured = fullText;
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: captured } : m))
            );
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    const cleanText = extractProfileUpdates(fullText);
    if (cleanText !== fullText) {
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, content: cleanText } : m))
      );
    }
  }, [extractProfileUpdates]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (chatState === "ask_stage") {
        const lowerText = text.toLowerCase();
        const matched = STAGE_KEYWORDS.some((kw) => lowerText.includes(kw));

        if (matched) {
          let degree = text.trim();
          if (lowerText.includes("博士") || lowerText.includes("phd")) degree = "博士";
          else if (lowerText.includes("硕士") || lowerText.includes("master") || lowerText.includes("研究生") || lowerText.includes("graduate")) degree = "硕士";
          else if (lowerText.includes("本科") || lowerText.includes("bachelor") || lowerText.includes("undergraduate")) degree = "本科";

          profileDataRef.current = { ...profileDataRef.current, targetDegree: degree };
          setProfileVersion((v) => v + 1);
          syncProfileToDb(profileDataRef.current);

          setTimeout(() => {
            setMessages((prev) => [...prev, UPLOAD_HINT_MESSAGE]);
            setChatState("free_chat");
            setIsLoading(false);
          }, 600);
          return;
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: "ai",
              content: "请告诉我你想申请的阶段哦～是本科、硕士还是博士呢？😊",
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      const staticIds = new Set(["welcome", "upload-hint"]);
      const apiMessages = messages
        .filter((m) => !staticIds.has(m.id))
        .concat(userMsg)
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

      apiMessages.unshift(
        { role: "assistant", content: WELCOME_MESSAGE.content },
        { role: "assistant", content: UPLOAD_HINT_MESSAGE.content },
      );

      await callAI(apiMessages);
    } catch (err: any) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "ai",
          content: `抱歉，AI 服务暂时不可用：${err.message || "未知错误"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, chatState, callAI, syncProfileToDb]);

  const sendFiles = useCallback(async (files: File[]) => {
    if (isLoading || files.length === 0) return;

    setIsLoading(true);
    const fileNames = files.map((f) => f.name);

    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: `📎 上传了文件：${fileNames.join(", ")}` },
    ]);

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("请先登录");

      if (chatState === "ask_stage") {
        setMessages((prev) => [...prev, UPLOAD_HINT_MESSAGE]);
        setChatState("free_chat");
      }

      for (const file of files) {
        const parsingMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: parsingMsgId, role: "ai", content: `正在解析 "${file.name}"，请稍候... 🔍` },
        ]);

        // Send file directly to edge function as FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("profileData", JSON.stringify(profileDataRef.current));

        const resp = await fetch(PARSE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: CLOUD_ANON_KEY,
          },
          body: formData,
        });

        const result = await resp.json();

        if (!resp.ok) {
          if (result.content) {
            const cleanContent = extractProfileUpdates(result.content);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === parsingMsgId ? { ...m, content: cleanContent } : m
              )
            );
            continue;
          }
          throw new Error(result.error || "解析失败");
        }

        const cleanContent = extractProfileUpdates(result.content);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === parsingMsgId ? { ...m, content: cleanContent } : m
          )
        );
      }
    } catch (err: any) {
      console.error("File upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "ai",
          content: `抱歉，文件处理出现问题：${err.message || "未知错误"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatState, extractProfileUpdates, syncProfileToDb]);

  return { messages, isLoading, sendMessage, sendFiles, profileData: profileDataRef.current, profileVersion };
}
