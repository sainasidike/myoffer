import { useState, useCallback, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const PARSE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`;
const CLOUD_REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const CLOUD_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "ai",
  content: "你好！我是你的专属留学申请助手，很高兴能为你服务。请先上传你的材料（成绩单、简历、获奖证书等），支持 PDF 和图片格式，我会自动识别信息并根据解析结果提问。",
};

const UPLOAD_HINT_MESSAGE: ChatMessage = {
  id: "upload-hint",
  role: "ai",
  content: "上传材料后，我会根据解析结果向你提问缺失的信息，每次只问一个问题，已收集的字段不会重复询问。",
};

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
    const filledFields = Object.entries(profileDataRef.current || {})
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const systemPrompt = `## 角色
你是一个专业的留学申请助手（MyOffer AI 顾问），服务于中国学生的留学申请。

## 重要：你已经完成了以下步骤，严禁重复
1. 你已经提示过用户可以上传材料（成绩单、简历等），严禁再次提示。

## 任务
- 根据用户上传的材料和对话，收集以下申请信息
- **每次只问一个问题**，不要一次问多个问题
- 已收集的字段不要重复询问
- 使用友好、专业的语气

## 必收集字段（priority）
- targetDegree: 申请阶段（本科/硕士/博士）
- currentEducation: 当前学历
- school: 学校
- major: 专业
- gpa: GPA
- languageType: 语言考试类型（托福/雅思/等）
- languageScore: 语言考试分数
- targetCountry: 目标国家

## 可选字段
- crossMajor: 是否跨专业
- greGmat: GRE/GMAT 分数
- internship: 实习经历
- research: 科研经历
- awards: 获奖情况
- entrepreneurship: 创业经历
- volunteer: 志愿者经历
- overseas: 海外交流经历
- otherActivities: 其他活动
- budget: 预算
- targetYear: 目标入学年份
- scholarship: 是否需要奖学金
- rankingReq: 排名要求
- specialNeeds: 特殊需求

## 已收集字段
${filledFields || "(暂无)"}

## 交互规则
1. **每次只问一个问题**
2. 根据优先级顺序询问必收集字段
3. 已收集的字段不要再问
4. 当你识别到新的信息时，使用以下格式输出：<<<PROFILE_UPDATE:{"字段名":"值"}>>>
5. 例如：<<<PROFILE_UPDATE:{"gpa":"3.8"}>>>
6. 信息提取标记会被前端自动处理，不会显示给用户

## 示例对话
用户：我的 GPA 是 3.8
你：好的，已记录您的 GPA 为 3.8。<<<PROFILE_UPDATE:{"gpa":"3.8"}>>>

请问您考的是托福还是雅思？分数是多少？`;

    const history = apiMessages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const aiMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);

    let fullText = "";
    const lastUserMessage = apiMessages[apiMessages.length - 1]?.content || "";
    const result = await chat.sendMessageStream(systemPrompt + "\n\n用户消息：" + lastUserMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullText } : m))
      );
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
      const staticIds = new Set(["welcome", "upload-hint"]);
      const apiMessages = messages
        .filter((m) => !staticIds.has(m.id))
        .concat(userMsg)
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

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
  }, [isLoading, messages, callAI]);

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

      for (const file of files) {
        const parsingMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          { id: parsingMsgId, role: "ai", content: `正在解析 "${file.name}"，请稍候...` },
        ]);

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
  }, [isLoading, extractProfileUpdates]);

  return { messages, isLoading, sendMessage, sendFiles, profileData: profileDataRef.current, profileVersion };
}
