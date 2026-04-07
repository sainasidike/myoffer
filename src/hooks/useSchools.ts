import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/lib/ai";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"programs">;

export interface MatchedSchool {
  program_id: string;
  probability: number;
  tier: "reach" | "match" | "safety";
  reason: string;
  program: Program | null;
}

interface SchoolMatchingState {
  thinkingSteps: string[];
  results: MatchedSchool[];
  isMatching: boolean;
  error: string | null;
}

export function useSchools() {
  const [matchState, setMatchState] = useState<SchoolMatchingState>({
    thinkingSteps: [],
    results: [],
    isMatching: false,
    error: null,
  });

  // Fetch all programs for browsing
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async (): Promise<Program[]> => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("qs_ranking", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // AI matching
  const startMatching = useCallback(
    async (
      profile: Record<string, unknown>,
      filters?: { countries?: string[]; degree?: string }
    ) => {
      setMatchState({
        thinkingSteps: [],
        results: [],
        isMatching: true,
        error: null,
      });

      await callEdgeFunction(
        "school-matching",
        { profile, filters },
        {
          onToken: () => {
            // school-matching uses custom SSE format, not raw tokens
          },
          onDone: (fullText) => {
            // Parse the structured events from the full text
            try {
              const lines = fullText.split("\n");
              const thinkingSteps: string[] = [];
              let results: MatchedSchool[] = [];

              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;

                try {
                  const event = JSON.parse(jsonStr);
                  if (event.type === "thinking") {
                    thinkingSteps.push(event.content);
                  } else if (event.type === "result") {
                    results = event.schools || [];
                  } else if (event.type === "error") {
                    setMatchState((prev) => ({
                      ...prev,
                      error: event.content,
                      isMatching: false,
                    }));
                    return;
                  }
                } catch {
                  // skip unparseable
                }
              }

              setMatchState({
                thinkingSteps,
                results,
                isMatching: false,
                error: null,
              });
            } catch {
              // If custom parsing fails, try to handle the raw stream
              setMatchState((prev) => ({
                ...prev,
                isMatching: false,
                error: "解析匹配结果失败",
              }));
            }
          },
          onError: (error) => {
            setMatchState((prev) => ({
              ...prev,
              isMatching: false,
              error,
            }));
          },
        }
      );
    },
    []
  );

  // Add school to applications
  const addToApplications = useCallback(
    async (programId: string, targetRound?: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      // Create application
      const { data: app, error: appError } = await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          program_id: programId,
          status: "in_progress",
          target_round: targetRound,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Auto-initialize material checklist from program's required_materials
      const { data: program } = await supabase
        .from("programs")
        .select("required_materials")
        .eq("id", programId)
        .single();

      if (program?.required_materials) {
        const materialNames: Record<string, string> = {
          transcript: "成绩单",
          sop: "个人陈述 (SOP)",
          ps: "个人陈述 (PS)",
          cv: "简历 (CV)",
          recommendation_2: "推荐信 x2",
          recommendation_3: "推荐信 x3",
          toefl: "托福成绩",
          ielts: "雅思成绩",
          gre: "GRE 成绩",
          gmat: "GMAT 成绩",
        };

        const materials = program.required_materials.map((m: string) => ({
          application_id: app.id,
          material_type: m.includes("recommendation") ? "recommendation" : m,
          material_name: materialNames[m] || m,
          status: "pending",
        }));

        await supabase.from("application_materials").insert(materials);
      }

      return app;
    },
    []
  );

  // Stats
  const stats = {
    total: matchState.results.length,
    reach: matchState.results.filter((s) => s.tier === "reach").length,
    match: matchState.results.filter((s) => s.tier === "match").length,
    safety: matchState.results.filter((s) => s.tier === "safety").length,
  };

  return {
    programs,
    programsLoading,
    matchState,
    startMatching,
    addToApplications,
    stats,
  };
}
