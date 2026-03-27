import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Essay {
  id: string;
  user_id: string;
  title: string;
  essay_type: string;
  content: string;
  word_count: number;
  target_school: string | null;
  target_program: string | null;
  version: number;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

export interface EssayChatMessage {
  id: string;
  essay_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function useEssays() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [currentEssay, setCurrentEssay] = useState<Essay | null>(null);
  const [chatHistory, setChatHistory] = useState<EssayChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEssays = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("用户未登录");
      }

      const { data, error } = await supabase
        .from("essays")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      setEssays(data || []);
    } catch (err: any) {
      console.error("加载文书失败:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadEssay = async (essayId: string) => {
    try {
      const { data: essayData, error: essayError } = await supabase
        .from("essays")
        .select("*")
        .eq("id", essayId)
        .maybeSingle();

      if (essayError) throw essayError;

      setCurrentEssay(essayData);

      const { data: chatData, error: chatError } = await supabase
        .from("essay_chat_history")
        .select("*")
        .eq("essay_id", essayId)
        .order("created_at", { ascending: true });

      if (chatError) throw chatError;

      setChatHistory(chatData || []);
    } catch (err: any) {
      console.error("加载文书失败:", err);
      throw err;
    }
  };

  const createEssay = async (data: {
    title: string;
    essay_type: string;
    target_school?: string;
    target_program?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("用户未登录");
      }

      const { data: newEssay, error } = await supabase
        .from("essays")
        .insert({
          user_id: user.id,
          title: data.title,
          essay_type: data.essay_type,
          content: "",
          word_count: 0,
          target_school: data.target_school || null,
          target_program: data.target_program || null,
          version: 1,
          is_final: false,
        })
        .select()
        .single();

      if (error) throw error;

      await loadEssays();
      return newEssay;
    } catch (err: any) {
      console.error("创建文书失败:", err);
      throw err;
    }
  };

  const updateEssay = async (
    essayId: string,
    updates: {
      content?: string;
      word_count?: number;
      title?: string;
      is_final?: boolean;
    }
  ) => {
    try {
      const { error } = await supabase
        .from("essays")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", essayId);

      if (error) throw error;

      if (currentEssay?.id === essayId) {
        await loadEssay(essayId);
      }
      await loadEssays();
    } catch (err: any) {
      console.error("更新文书失败:", err);
      throw err;
    }
  };

  const addChatMessage = async (
    essayId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    try {
      const { error } = await supabase.from("essay_chat_history").insert({
        essay_id: essayId,
        role,
        content,
      });

      if (error) throw error;
    } catch (err: any) {
      console.error("添加对话失败:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadEssays();
  }, []);

  return {
    essays,
    currentEssay,
    chatHistory,
    isLoading,
    createEssay,
    updateEssay,
    loadEssay,
    addChatMessage,
    refreshEssays: loadEssays,
  };
}
