import { useState, useCallback, useRef } from "react";
import { callEdgeFunction, callParseDocument, extractProfileUpdates } from "@/lib/ai";
import { useProfile } from "./useProfile";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const FIELD_MAP: Record<string, string> = {
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
  targetCountry: "target_country",
  targetYear: "target_year",
  budget: "budget",
  rankingReq: "ranking_req",
  specialNeeds: "special_needs",
};

function mapToDbFields(updates: Record<string, unknown>): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    const dbKey = FIELD_MAP[key] || key;
    mapped[dbKey] = value;
  }
  return mapped;
}

export function useOnboardingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const { profile, updateProfileAsync } = useProfile();
  const abortRef = useRef(false);

  const applyProfileUpdates = useCallback(
    async (text: string) => {
      const { cleanText, updates } = extractProfileUpdates(text);
      if (Object.keys(updates).length > 0) {
        try {
          await updateProfileAsync(mapToDbFields(updates));
        } catch (err) {
          console.error("Failed to save profile updates:", err);
        }
      }
      return cleanText;
    },
    [updateProfileAsync]
  );

  const sendMessage = useCallback(
    async (userText: string) => {
      if (isStreaming || isParsing) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
      };

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "",
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);
      abortRef.current = false;

      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const body: Record<string, unknown> = {
        messages: apiMessages,
        profileData: profile || {},
      };

      await callEdgeFunction("onboarding-chat", body, {
        onToken: (token) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content += token;
            }
            return updated;
          });
        },
        onDone: async (fullText) => {
          const cleanText = await applyProfileUpdates(fullText);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = cleanText;
            }
            return updated;
          });
          setIsStreaming(false);
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = `抱歉，出现了错误：${error}`;
            }
            return updated;
          });
          setIsStreaming(false);
        },
      });
    },
    [isStreaming, isParsing, messages, profile, applyProfileUpdates]
  );

  /**
   * Upload and parse multiple files via AI.
   * Each file is sent to parse-document Edge Function.
   * Results are shown as AI messages in the chat.
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (isStreaming || isParsing || files.length === 0) return;

      setIsParsing(true);

      const fileNames = files.map((f) => f.name).join("、");
      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: `我上传了${files.length > 1 ? `${files.length}个` : ""}文件：${fileNames}`,
      };
      setMessages((prev) => [...prev, userMsg]);

      for (const file of files) {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: "",
        };
        setMessages((prev) => [...prev, aiMsg]);

        try {
          const prefix = files.length > 1 ? `**${file.name}** 解析结果：\n\n` : "";
          const content = await callParseDocument(file);
          const cleanText = await applyProfileUpdates(content);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = prefix + cleanText;
            }
            return updated;
          });
        } catch (err) {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = `解析 ${file.name} 失败：${err instanceof Error ? err.message : "未知错误"}。你可以直接在对话中告诉我文档中的信息。`;
            }
            return updated;
          });
        }
      }

      // After all files parsed, add a confirmation prompt
      const confirmMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content:
          "以上是我从文档中提取的信息。请确认这些信息是否准确？如果有任何不对的地方，直接告诉我，我来帮你修改。\n\n如果信息正确，我们可以继续补充其他申请信息。",
      };
      setMessages((prev) => [...prev, confirmMsg]);

      setIsParsing(false);
    },
    [isStreaming, isParsing, applyProfileUpdates]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    setIsParsing(false);
    abortRef.current = true;
  }, []);

  return {
    messages,
    isStreaming,
    isParsing,
    sendMessage,
    uploadFiles,
    resetChat,
  };
}
