import { useState, useCallback, useRef } from "react";
import { callEdgeFunction, extractProfileUpdates } from "@/lib/ai";
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
  const { profile, updateProfileAsync } = useProfile();
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (userText: string, fileUrl?: string) => {
      if (isStreaming) return;

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

      // Build messages for the API (convert to assistant/user roles)
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      const body: Record<string, unknown> = {
        messages: apiMessages,
        profileData: profile || {},
      };
      if (fileUrl) body.file_url = fileUrl;

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
          const { cleanText, updates } = extractProfileUpdates(fullText);

          // Update the displayed message with clean text
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = cleanText;
            }
            return updated;
          });

          // Save extracted profile updates to database
          if (Object.keys(updates).length > 0) {
            try {
              await updateProfileAsync(mapToDbFields(updates));
            } catch (err) {
              console.error("Failed to save profile updates:", err);
            }
          }

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
    [isStreaming, messages, profile, updateProfileAsync]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    abortRef.current = true;
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    resetChat,
  };
}
