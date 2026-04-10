import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunctionSSE } from "@/lib/ai";
import type { Tables } from "@/integrations/supabase/types";

type Program = Tables<"programs">;

export interface MatchedSchool {
  program_id: string;
  probability: number;
  tier: "reach" | "match" | "safety";
  reason: string;
  risk_flags: string[];
  advantage_tags: string[];
  weakness_tags: string[];
  improvement_tips: string[];
  program: Program | null;
}

interface SchoolMatchingState {
  thinkingSteps: string[];
  results: MatchedSchool[];
  competitiveness: number;
  isMatching: boolean;
  error: string | null;
}

const CACHE_KEY = "myoffer_match_results";

function loadCachedResults(): { results: MatchedSchool[]; competitiveness: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.results?.length > 0) return parsed;
  } catch { /* ignore */ }
  return null;
}

function saveCachedResults(results: MatchedSchool[], competitiveness: number) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ results, competitiveness }));
  } catch { /* ignore */ }
}

export function useSchools() {
  const cached = loadCachedResults();
  const [matchState, setMatchState] = useState<SchoolMatchingState>({
    thinkingSteps: [],
    results: cached?.results || [],
    competitiveness: cached?.competitiveness || 0,
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

      await callEdgeFunctionSSE(
        "school-matching",
        { profile, filters },
        (event) => {
          if (event.type === "thinking") {
            setMatchState((prev) => ({
              ...prev,
              thinkingSteps: [...prev.thinkingSteps, event.content as string],
            }));
          } else if (event.type === "result") {
            const results = (event.schools as MatchedSchool[]) || [];
            const competitiveness = (event.competitiveness as number) || 0;
            saveCachedResults(results, competitiveness);
            setMatchState((prev) => ({
              ...prev,
              results,
              competitiveness,
            }));
          } else if (event.type === "error") {
            setMatchState((prev) => ({
              ...prev,
              error: event.content as string,
              isMatching: false,
            }));
          }
        },
        (error) => {
          setMatchState((prev) => ({
            ...prev,
            isMatching: false,
            error,
          }));
        },
        () => {
          setMatchState((prev) => ({
            ...prev,
            isMatching: false,
          }));
        },
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
