import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

// Use your own Supabase project URL
const SUPABASE_URL = "https://aljmasuwwsipaurhqtiv.supabase.co";
const CHAT_URL = `${SUPABASE_URL}/functions/v1/onboarding-chat`;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "ai",
    content: "你好！我是你的留学申请顾问，很高兴认识你 😊 我会一步步帮你整理申请材料。先从基本情况开始——请问你想申请本科、硕士还是博士项目呢？",
  },
  {
    id: "2",
    role: "ai",
    content: "在开始之前，你也可以先把手头的材料上传给我——比如成绩单、简历、获奖证书或其他任何文件，我来帮你自动识别信息 📎",
  },
];

export function useGeminiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const profileDataRef = useRef<Record<string, string>>({});

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
      // Build message history for the API (convert ai->assistant)
      const apiMessages = [...messages, userMsg]
        .filter((m) => m.id !== "1" && m.id !== "2") // skip initial static messages
        .map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        }));

      // If this is the first user message, include initial context
      if (apiMessages.filter((m) => m.role === "user").length === 1) {
        apiMessages.unshift(
          { role: "assistant", content: INITIAL_MESSAGES[0].content },
          { role: "assistant", content: INITIAL_MESSAGES[1].content }
        );
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer sb_publishable_ihJHlvgroZJpbI45Zuhcyw_IswOcypQ`,
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
        // Remove profile update markers from displayed text
        const cleanText = fullText.replace(/<<<PROFILE_UPDATE:.*?>>>/g, "").trim();
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: cleanText } : m))
        );
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
  }, [isLoading, messages]);

  return { messages, isLoading, sendMessage, profileData: profileDataRef.current };
}
