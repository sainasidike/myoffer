import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/ai";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Essay = Tables<"essays">;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useEssays() {
  const queryClient = useQueryClient();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentEssayId, setCurrentEssayId] = useState<string | null>(null);

  // Fetch all essays
  const { data: essays, isLoading } = useQuery({
    queryKey: ["essays"],
    queryFn: async (): Promise<Essay[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("essays")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Create essay
  const createEssay = useMutation({
    mutationFn: async (input: {
      application_id?: string;
      essay_type: string;
      title: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { data, error } = await supabase
        .from("essays")
        .insert({
          user_id: user.id,
          application_id: input.application_id,
          essay_type: input.essay_type,
          title: input.title,
          status: "draft",
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setCurrentEssayId(data.id);
      setChatMessages([]);
      queryClient.invalidateQueries({ queryKey: ["essays"] });
    },
  });

  // Save essay content
  const saveEssay = useMutation({
    mutationFn: async ({
      id,
      content,
      bumpVersion,
    }: {
      id: string;
      content: string;
      bumpVersion?: boolean;
    }) => {
      const updates: Record<string, unknown> = {
        content,
        updated_at: new Date().toISOString(),
      };

      if (bumpVersion) {
        // Get current version
        const { data: current } = await supabase
          .from("essays")
          .select("version")
          .eq("id", id)
          .single();
        updates.version = (current?.version || 1) + 1;
      }

      const { error } = await supabase
        .from("essays")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Update linked material status
      const { data: essay } = await supabase
        .from("essays")
        .select("application_id")
        .eq("id", id)
        .single();

      if (essay?.application_id) {
        await supabase
          .from("application_materials")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("essay_id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["essays"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  // Load conversation history for an essay
  const loadConversation = useCallback(async (essayId: string) => {
    setCurrentEssayId(essayId);
    const { data } = await supabase
      .from("essay_conversations")
      .select("*")
      .eq("essay_id", essayId)
      .order("created_at", { ascending: true });

    setChatMessages(
      (data || []).map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );
  }, []);

  // Send message to AI
  const sendMessage = useCallback(
    async (
      userText: string,
      essayId: string,
      applicationId?: string,
      essayType?: string,
      currentContent?: string
    ) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText,
      };

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
      };

      setChatMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      // Save user message to DB
      await supabase.from("essay_conversations").insert({
        essay_id: essayId,
        role: "user",
        content: userText,
      });

      const apiMessages = [...chatMessages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await callEdgeFunction(
        "essay-generation",
        {
          essay_id: essayId,
          application_id: applicationId,
          messages: apiMessages,
          essay_type: essayType,
          current_content: currentContent,
        },
        {
          onToken: (token) => {
            setChatMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                last.content += token;
              }
              return updated;
            });
          },
          onDone: async (fullText) => {
            setChatMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                last.content = fullText;
              }
              return updated;
            });

            // Save AI response to DB
            await supabase.from("essay_conversations").insert({
              essay_id: essayId,
              role: "assistant",
              content: fullText,
            });

            setIsStreaming(false);
          },
          onError: (error) => {
            setChatMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === "assistant") {
                last.content = `抱歉，出现了错误：${error}`;
              }
              return updated;
            });
            setIsStreaming(false);
          },
        }
      );
    },
    [isStreaming, chatMessages]
  );

  return {
    essays: essays || [],
    isLoading,
    createEssay: createEssay.mutateAsync,
    saveEssay: saveEssay.mutate,
    isSaving: saveEssay.isPending,
    chatMessages,
    isStreaming,
    currentEssayId,
    loadConversation,
    sendMessage,
  };
}
