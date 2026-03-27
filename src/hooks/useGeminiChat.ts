import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/onboarding-chat`;

// Map from camelCase profile keys to snake_case DB columns
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: "你好！我是你的专属留学申请助手，很高兴能为你服务 😊 为了更好的帮你规划，请你告诉我你想申请的阶段：本科/硕士/博士？",
  },
];

const UPLOAD_HINT_MESSAGE: ChatMessage = {
  id: "upload-hint",
  role: "ai",
  content: "对了，你也可以随时把手头的材料上传给我——比如成绩单、简历、获奖证书等，支持 PDF 和图片格式，可以直接拖拽或点击附件按钮上传，我来帮你自动识别信息 📎",
};

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const profileDataRef = useRef<Record<string, string>>({});

  // Persist profile data to database
  const syncProfileToDb = useCallback(async (data: Record<string, string>) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) return;

      // Convert camelCase keys to snake_case columns
      const dbData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        const col = FIELD_TO_COLUMN[key];
        if (col && value) dbData[col] = value;
      }
      if (Object.keys(dbData).length === 0) return;

      const { error } = await supabase
        .from("user_onboarding_profiles")
        .upsert(
          { user_id: userId, ...dbData, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) console.error("Profile sync error:", error);
    } catch (err) {
      console.error("Profile sync error:", err);
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    const isFirstUserMessage = messages.filter((m) => m.role === "user").length === 0;

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build message history for the API (convert ai->assistant)
      const apiMessages = [...messages, userMsg]
        .filter((m) => m.id !== "1" && m.id !== "upload-hint") // skip static messages
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

      // If this is the first user message, include initial context
      if (isFirstUserMessage) {
        apiMessages.unshift(
          { role: "assistant", content: INITIAL_MESSAGES[0].content },
        );
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      // Stream SSE response
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
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

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

      // Extract profile updates from the response
      const profileMatch = fullText.match(/<<<PROFILE_UPDATE:(.*?)>>>/g);
      if (profileMatch) {
        for (const match of profileMatch) {
          try {
            const json = match.replace("<<<PROFILE_UPDATE:", "").replace(">>>", "");
            const data = JSON.parse(json);
            profileDataRef.current = { ...profileDataRef.current, ...data };
          } catch { /* ignore parse errors */ }
        }
        // Sync to database
        syncProfileToDb(profileDataRef.current);
        // Remove profile update markers from displayed text
        const cleanText = fullText.replace(/<<<PROFILE_UPDATE:.*?>>>/g, "").trim();
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: cleanText } : m))
        );
      }

      // After first AI response, append the upload hint message
      if (isFirstUserMessage) {
        setMessages((prev) => [...prev, UPLOAD_HINT_MESSAGE]);
      }
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
  }, [isLoading, messages, syncProfileToDb]);

  return { messages, isLoading, sendMessage, profileData: profileDataRef.current };
}
