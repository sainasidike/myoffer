import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { callEdgeFunction, callParseDocument, extractProfileUpdates } from "@/lib/ai";
import { useProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  type?: "parse-result";
  fileName?: string;
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

// Sanitize values before DB write — convert numeric fields, parse "3.5/4.0" patterns
const NUMERIC_FIELDS = new Set(["gpa", "gpa_scale", "target_year"]);
function sanitizeForDb(mapped: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mapped)) {
    if (NUMERIC_FIELDS.has(key) && typeof value === "string") {
      // Handle "3.5/4.0" → gpa=3.5, gpa_scale=4.0
      if (key === "gpa") {
        const parts = value.match(/^(\d+\.?\d*)\s*[/／]\s*(\d+\.?\d*)$/);
        if (parts) {
          result.gpa = parseFloat(parts[1]);
          if (!mapped.gpa_scale) result.gpa_scale = parseFloat(parts[2]);
        } else {
          const num = parseFloat(value);
          if (!isNaN(num)) result.gpa = num;
        }
      } else {
        const num = parseFloat(value);
        if (!isNaN(num)) result[key] = num;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ---- Fallback: extract profile fields directly from user message ----

function extractFromUserMessage(text: string): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  const lower = text.toLowerCase();

  // GPA: "GPA 3.5", "gpa是3.5", "均分85", "GPA3.5/4.0", "GPA改为3.8", "GPA更新为3.8"
  const gpaMatch = text.match(/(?:GPA|gpa|均分)[：:\s是为改成变更到调]*(\d+\.?\d*)/i);
  if (gpaMatch) updates.gpa = parseFloat(gpaMatch[1]);

  // GPA scale: "满分4.0", "/4.0", "4分制", "3.8/4.0"
  const scaleMatch = text.match(/(?:满分|\/|总分)(\d+\.?\d*)/);
  if (scaleMatch && gpaMatch) updates.gpa_scale = parseFloat(scaleMatch[1]);

  // Target degree: 硕士/博士
  if (/申请.*硕士|目标.*硕士|读硕|硕士/.test(text) && !/博士/.test(text)) {
    updates.target_degree = "硕士";
  } else if (/申请.*博士|目标.*博士|读博|博士/.test(text)) {
    updates.target_degree = "博士";
  }

  // Current education: 本科/硕士在读
  if (/(?:本科|大[一二三四]在|大四)/.test(text)) {
    updates.current_education = "本科";
  } else if (/硕士在读|研[一二三]|研究生在读/.test(text)) {
    updates.current_education = "硕士";
  }

  // School: "XX大学", "就读于XX大学", "是XX大学"
  const schoolMatch = text.match(/(?:就读于|来自|在|是)\s*([\u4e00-\u9fa5]{2,10}(?:大学|学院))/i)
    || text.match(/([\u4e00-\u9fa5]{2,8}(?:大学|学院))/i);
  if (schoolMatch) updates.school = schoolMatch[1];

  // Major: "专业是XX", "XX大学YY专业", "学的是XX"
  const majorMatch = text.match(/(?:专业是|专业为|学的是|主修)\s*([\u4e00-\u9fa5a-zA-Z]{2,15})/)
    || text.match(/(?:大学|学院)([\u4e00-\u9fa5a-zA-Z]{2,10})专业/)
    || text.match(/专业[：:\s]*([\u4e00-\u9fa5a-zA-Z]{2,10})/);
  if (majorMatch && !/跨|转|申请|什么|方向|意向|相关/.test(majorMatch[1])) updates.major = majorMatch[1];

  // Cross-major
  if (/不跨专业|不打算跨|同专业/.test(text)) updates.cross_major = false;
  else if (/跨专业|转专业/.test(text)) updates.cross_major = true;

  // IELTS: "雅思7.0", "雅思 7"
  const ieltsMatch = text.match(/雅思[：:\s]*(\d+\.?\d*)/);
  if (ieltsMatch) {
    updates.language_type = "IELTS";
    const total = parseFloat(ieltsMatch[1]);
    updates.language_score = { total };
  }

  // TOEFL: "托福105", "TOEFL 100"
  const toeflMatch = text.match(/(?:托福|TOEFL)[：:\s]*(\d+)/i);
  if (toeflMatch) {
    updates.language_type = "TOEFL";
    const total = parseInt(toeflMatch[1]);
    updates.language_score = { total };
  }

  // Target year: "2027秋", "2026fall", "2027年入学"
  const yearMatch = text.match(/(20\d{2})\s*(?:年|fall|春|秋|入学)/i);
  if (yearMatch) updates.target_year = parseInt(yearMatch[1]);

  // Budget: "预算30万", "30-50万"
  const budgetMatch = text.match(/预算[：:\s]*([^\s,，。]+万[^\s,，。]*)/);
  if (budgetMatch) updates.budget = budgetMatch[1];
  else {
    const budgetMatch2 = text.match(/(\d+[-~到]?\d*万)/);
    if (budgetMatch2 && /预算|费用|花费/.test(text)) updates.budget = budgetMatch2[1];
  }

  // Target countries
  const countries: string[] = [];
  const countryMap: Record<string, string> = {
    "英国": "英国", "美国": "美国", "澳洲": "澳洲", "澳大利亚": "澳洲",
    "加拿大": "加拿大", "新加坡": "新加坡", "香港": "香港", "日本": "日本",
    "德国": "德国", "荷兰": "荷兰", "新西兰": "新西兰", "欧洲": "欧洲",
  };
  for (const [keyword, country] of Object.entries(countryMap)) {
    if (text.includes(keyword) && !countries.includes(country)) {
      countries.push(country);
    }
  }
  if (countries.length > 0) updates.target_country = countries;

  return updates;
}

// ---- DB persistence helpers ----

async function loadMessagesFromDB(): Promise<ChatMessage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load chat messages:", error);
    return [];
  }

  return (data || []).map((row) => {
    const content = row.content as string;
    const parseMatch = content.match(/^\[PARSE:(.+?)\]/);
    if (parseMatch) {
      return {
        id: row.id,
        role: row.role as "ai" | "user",
        content: content.slice(parseMatch[0].length),
        type: "parse-result" as const,
        fileName: parseMatch[1],
      };
    }
    return {
      id: row.id,
      role: row.role as "ai" | "user",
      content,
    };
  });
}

async function saveMessageToDB(role: "ai" | "user", content: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, role, content })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to save chat message:", error);
    return null;
  }
  return data?.id || null;
}

// ---- Hook ----

export function useOnboardingChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldTriggerOpening, setShouldTriggerOpening] = useState(false);
  const { profile, updateProfileAsync } = useProfile();
  const queryClient = useQueryClient();
  const abortRef = useRef(false);
  const openingInProgressRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);

  const applyProfileUpdates = useCallback(
    async (text: string) => {
      const { cleanText, updates } = extractProfileUpdates(text);
      if (Object.keys(updates).length > 0) {
        try {
          const mapped = sanitizeForDb(mapToDbFields(updates));
          // Apply all updates — AI is instructed to only output genuinely new/modified fields
          if (Object.keys(mapped).length > 0) {
            await updateProfileAsync(mapped);
            // Invalidate profile cache so sidebar updates immediately
            queryClient.invalidateQueries({ queryKey: ["profile"] });
          }
        } catch (err) {
          console.error("Failed to save profile updates:", err);
        }
      }
      return cleanText;
    },
    [updateProfileAsync, profile, queryClient]
  );

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Load chat history from DB on mount
  useEffect(() => {
    (async () => {
      const saved = await loadMessagesFromDB();
      setMessages(saved);
      setIsLoaded(true);
    })();
  }, []);

  // Trigger AI opening message when loaded with no history, or after reset
  useEffect(() => {
    if ((!isLoaded && !shouldTriggerOpening) || messages.length > 0 || isStreaming) return;
    if (openingInProgressRef.current) return;
    if (shouldTriggerOpening) setShouldTriggerOpening(false);

    // Send an empty trigger to get AI's opening message
    const triggerOpening = async () => {
      openingInProgressRef.current = true;
      setIsStreaming(true);
      abortRef.current = false;

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "",
      };
      setMessages([aiMsg]);

      // Send with empty user message to trigger system prompt opening
      const body: Record<string, unknown> = {
        messages: [{ role: "user", content: "你好" }],
        profileData: profile || {},
      };

      await callEdgeFunction("onboarding-chat", body, {
        onToken: (token) => {
          if (abortRef.current) return;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content += token;
            return updated;
          });
        },
        onDone: async (fullText) => {
          const cleanText = await applyProfileUpdates(fullText);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content = cleanText;
            return updated;
          });
          // Save AI opening message to DB
          await saveMessageToDB("ai", cleanText);
          setIsStreaming(false);
          openingInProgressRef.current = false;
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content = `抱歉，出现了错误：${error}`;
            return updated;
          });
          setIsStreaming(false);
          openingInProgressRef.current = false;
        },
      });
    };

    triggerOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, shouldTriggerOpening]);

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

      // Save user message to DB
      await saveMessageToDB("user", userText);

      // Build messages for API (include full history)
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
            if (last.role === "ai") last.content += token;
            return updated;
          });
        },
        onDone: async (fullText) => {
          const cleanText = await applyProfileUpdates(fullText);
          // Always run regex extraction to supplement AI markers (which may miss fields like gpa_scale)
          const userUpdates = extractFromUserMessage(userText);
          const aiTextUpdates = extractFromUserMessage(cleanText);
          // Merge: user message > AI response text (for supplementary fields AI markers don't cover)
          const supplementUpdates = { ...aiTextUpdates, ...userUpdates };
          // Filter out fields where profile already has non-empty values to prevent overwriting
          const filtered: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(supplementUpdates)) {
            const existing = profile?.[key as keyof typeof profile];
            const isEmpty = existing === null || existing === undefined || existing === "" ||
              (Array.isArray(existing) && existing.length === 0);
            if (isEmpty) {
              filtered[key] = value;
            }
          }
          if (Object.keys(filtered).length > 0) {
            try {
              await updateProfileAsync(sanitizeForDb(filtered));
              queryClient.invalidateQueries({ queryKey: ["profile"] });
            } catch (err) {
              console.error("Failed to apply supplement updates:", err);
            }
          }
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content = cleanText;
            return updated;
          });
          // Save AI response to DB
          await saveMessageToDB("ai", cleanText);
          setIsStreaming(false);
        },
        onError: (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content = `抱歉，出现了错误：${error}`;
            return updated;
          });
          setIsStreaming(false);
        },
      });
    },
    [isStreaming, isParsing, messages, profile, applyProfileUpdates, updateProfileAsync, queryClient]
  );

  /**
   * Upload and parse multiple files via AI.
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
      await saveMessageToDB("user", userMsg.content);

      for (const file of files) {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: "",
          type: "parse-result",
          fileName: file.name,
        };
        setMessages((prev) => [...prev, aiMsg]);

        try {
          const content = await callParseDocument(file);
          const cleanText = await applyProfileUpdates(content);

          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = cleanText;
              last.type = "parse-result";
              last.fileName = file.name;
            }
            return updated;
          });
          // Save with a marker prefix so we can restore type on load
          await saveMessageToDB("ai", `[PARSE:${file.name}]${cleanText}`);
        } catch (err) {
          const errContent = `解析 ${file.name} 失败：${err instanceof Error ? err.message : "未知错误"}。\n\n请尝试重新上传，或直接在对话中告诉我文档中的信息。`;
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") {
              last.content = errContent;
              last.type = "parse-result";
              last.fileName = file.name;
            }
            return updated;
          });
          await saveMessageToDB("ai", `[PARSE:${file.name}]${errContent}`);
        }
      }

      // After all files parsed, send a follow-up message via AI to continue the conversation
      const followUpMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "",
      };
      setMessages((prev) => [...prev, followUpMsg]);

      // Build context for AI follow-up using ref to get latest messages (including parse results)
      const currentMessages = messagesRef.current;
      const apiMessages = currentMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));
      // Add a summary instruction
      apiMessages.push({
        role: "user",
        content: "我刚上传了文件，AI已经解析了内容并提取了信息。请根据当前已收集和缺失的信息，确认提取结果并继续追问下一个缺失的信息。",
      });

      const body: Record<string, unknown> = {
        messages: apiMessages,
        profileData: profile || {},
      };

      await callEdgeFunction("onboarding-chat", body, {
        onToken: (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content += token;
            return updated;
          });
        },
        onDone: async (fullText) => {
          const cleanText = await applyProfileUpdates(fullText);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "ai") last.content = cleanText;
            return updated;
          });
          await saveMessageToDB("ai", cleanText);
          setIsParsing(false);
        },
        onError: () => {
          setIsParsing(false);
        },
      });
    },
    [isStreaming, isParsing, messages, profile, applyProfileUpdates]
  );

  const resetChat = useCallback(async () => {
    // Clear messages from DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("chat_messages").delete().eq("user_id", user.id);
      // Clear profile data so completeness resets to 0
      await supabase.from("profiles").update({
        target_degree: null,
        current_education: null,
        school: null,
        major: null,
        gpa: null,
        gpa_scale: null,
        cross_major: null,
        language_type: null,
        language_score: null,
        gre_gmat: null,
        internship: null,
        research: null,
        awards: null,
        target_country: null,
        target_year: null,
        budget: null,
        ranking_req: null,
        special_needs: null,
        profile_summary: null,
      }).eq("id", user.id);
    }
    abortRef.current = true;
    openingInProgressRef.current = false;
    setMessages([]);
    setIsStreaming(false);
    setIsParsing(false);
    // Invalidate profile cache so UI shows 0%
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    // Trigger opening message via state flag (no setTimeout hack)
    setShouldTriggerOpening(true);
  }, [queryClient]);

  // Derive parsed file names from messages for session persistence
  const parsedFileNames = useMemo(() => {
    return messages
      .filter((m) => m.type === "parse-result" && m.fileName && m.content)
      .map((m) => m.fileName!);
  }, [messages]);

  return {
    messages,
    isStreaming,
    isParsing,
    isLoaded,
    parsedFileNames,
    sendMessage,
    uploadFiles,
    resetChat,
  };
}
