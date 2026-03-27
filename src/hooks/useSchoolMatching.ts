import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProgramAnalysis {
  text: string;
  advantages: string[];
  disadvantages: string[];
  tips: string[];
}

export interface MatchedProgram {
  id: string;
  school: string;
  country: string;
  program: string;
  degree: string;
  field: string;
  duration: string;
  type: string;
  avg_score: number;
  require_gpa: string;
  require_lang: string;
  tuition: string;
  living_cost: string;
  link: string;
  scholarship: string;
  deadline: string;
  rolling_admission: boolean;
  application_materials: string;
  prestige: number;
  qs_ranking: number;
  accept_list: string;
  notes: string;
  probability: number;
  totalScore: number;
  riskFlags: string[];
  deadlineWarning: boolean;
  analysis: ProgramAnalysis;
}

export interface MatchingResult {
  compositeScore: number;
  totalMatched: number;
  avgProbability: number;
  completeness: number;
  reach: MatchedProgram[];
  match: MatchedProgram[];
  safety: MatchedProgram[];
}

export function useSchoolMatching() {
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);

  const runMatching = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setThinkingSteps([]);

    const steps = [
      "正在读取用户档案数据...",
      "正在检索院校数据库...",
      "AI 正在生成匹配项目...",
      "正在计算综合竞争力得分...",
      "正在执行硬性过滤...",
      "正在执行弹性匹配...",
      "正在计算录取概率...",
      "正在分层筛选结果...",
      "正在生成个性化分析...",
    ];

    // Simulate thinking steps
    for (let i = 0; i < steps.length; i++) {
      setThinkingSteps(prev => [...prev, steps[i]]);
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("请先登录");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/school-matching`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        if (data.code === "NO_PROFILE" || data.code === "INCOMPLETE_PROFILE") {
          setError(data.error);
          toast.error(data.error);
        } else {
          throw new Error(data.error || "选校匹配失败");
        }
        return;
      }

      if (data.code === "NO_PROGRAMS") {
        setError(data.error);
        return;
      }

      setResult(data);
      setThinkingSteps(prev => [...prev, "✅ 选校匹配完成！"]);
    } catch (err: any) {
      console.error("School matching error:", err);
      setError(err.message || "选校匹配失败");
      toast.error(err.message || "选校匹配失败");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, thinkingSteps, runMatching };
}
