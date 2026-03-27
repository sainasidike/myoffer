import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export function useClaudeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "ai",
      content: "你好！我是你的留学申请顾问 AI。让我们开始了解你的背景和目标吧。请告诉我，你目前的学历是什么？想申请什么学位？",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [profileVersion, setProfileVersion] = useState(0);

  const sendMessage = useCallback(
    async (userMessage: string, systemPrompt?: string) => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Not authenticated");
        }

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            systemPrompt: systemPrompt || "你是一个专业的留学申请顾问AI助手。",
            conversationHistory: messages.map((m) => ({
              role: m.role === "ai" ? "assistant" : "user",
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: data.response,
        };

        setMessages((prev) => [...prev, aiMsg]);

        return data.response;
      } catch (error) {
        console.error("Failed to send message:", error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          content: "抱歉，发生了错误。请稍后重试。",
        };
        setMessages((prev) => [...prev, errorMsg]);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const sendFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Not authenticated");
      }

      const fileContents = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return { name: file.name, content: text };
        })
      );

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deepseek-chat`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `我上传了以下文件，请帮我分析并提取相关信息：\n${fileContents.map((f) => f.name).join("\n")}`,
          systemPrompt: "你是一个专业的留学申请顾问AI助手。请分析用户上传的文件内容，提取有用的申请信息。",
          conversationHistory: messages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          files: fileContents,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: data.response,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Failed to process files:", error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "ai",
        content: "抱歉，文件处理失败。请稍后重试。",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    sendMessage,
    sendFiles,
    profileData,
    setProfileData,
    profileVersion,
    setProfileVersion,
  };
}
