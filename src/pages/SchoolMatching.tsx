import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Cpu,
  RefreshCw,
  ArrowLeft,
  Rocket,
  Shield,
  Target,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSchoolMatching } from "@/hooks/useSchoolMatching";
import { ProgramCard } from "@/components/school/ProgramCard";
import { StatsBar } from "@/components/school/StatsBar";
import { ThinkingVisualizer } from "@/components/school/ThinkingVisualizer";
import type { MatchedProgram } from "@/hooks/useSchoolMatching";

const categories = [
  {
    key: "reach" as const,
    title: "冲刺校",
    range: "15-40%",
    icon: Rocket,
    headerClass: "bg-warning/10 text-warning border-warning/20",
    emptyText: "暂无冲刺校推荐",
  },
  {
    key: "match" as const,
    title: "匹配校",
    range: "40-70%",
    icon: Target,
    headerClass: "bg-primary/10 text-primary border-primary/20",
    emptyText: "暂无匹配校推荐",
  },
  {
    key: "safety" as const,
    title: "保底校",
    range: "70%+",
    icon: Shield,
    headerClass: "bg-success/10 text-success border-success/20",
    emptyText: "暂无保底校推荐",
  },
];

export default function SchoolMatching() {
  const { result, isLoading, error, thinkingSteps, runMatching } = useSchoolMatching();
  const navigate = useNavigate();

  useEffect(() => {
    if (!result && !isLoading && !error) {
      runMatching();
    }
  }, []);

  const handleAddToApplications = (program: MatchedProgram) => {
    toast.success(`已将「${program.school} - ${program.program}」加入申请列表`);
    // TODO: Actually save to applications table
  };

  // Not started or loading state
  if (!result && !error) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground font-mono">AI 智能选校</h1>
            <p className="text-xs text-muted-foreground">正在为你匹配最优院校方案</p>
          </div>
        </div>

        <ThinkingVisualizer steps={thinkingSteps} isLoading={isLoading} />

        {!isLoading && thinkingSteps.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center space-y-4">
            <Cpu className="w-12 h-12 text-primary mx-auto opacity-50" />
            <p className="text-muted-foreground text-sm">
              点击开始，AI 将根据你的档案数据智能匹配院校
            </p>
            <Button
              onClick={runMatching}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
            >
              <Rocket className="w-4 h-4 mr-2" />
              开始智能选校
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error && !result) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="glass-card rounded-xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-warning mx-auto" />
          <p className="text-foreground font-semibold font-mono">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              className="border-border"
              onClick={() => navigate("/onboarding")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回完善信息
            </Button>
            <Button
              onClick={runMatching}
              className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新匹配
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground font-mono">AI 智能选校</h1>
            <p className="text-xs text-muted-foreground">
              基于你的档案数据，AI 为你推荐了 {result.totalMatched} 个项目
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border text-xs"
            onClick={() => navigate("/onboarding")}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            修改信息
          </Button>
          <Button
            size="sm"
            onClick={runMatching}
            disabled={isLoading}
            className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 text-xs"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            重新生成
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar
        compositeScore={result.compositeScore}
        totalMatched={result.totalMatched}
        avgProbability={result.avgProbability}
      />

      {/* Thinking (collapsed when done) */}
      {isLoading && <ThinkingVisualizer steps={thinkingSteps} isLoading={isLoading} />}

      {/* Completeness warning */}
      {result.completeness < 60 && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 border-warning/30">
          <AlertCircle className="w-5 h-5 text-warning shrink-0" />
          <div className="text-xs text-muted-foreground">
            <span className="text-warning font-semibold">档案完整度不足 60%</span>
            ，当前概率仅供参考。完善更多信息后可获得更精准的匹配结果。
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 text-xs border-warning/30 text-warning"
            onClick={() => navigate("/onboarding")}
          >
            去完善
          </Button>
        </div>
      )}

      {/* School columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const programs = result[cat.key] || [];

          return (
            <div key={cat.key} className="space-y-3">
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border glass ${cat.headerClass}`}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  <span className="font-semibold text-sm font-mono">{cat.title}</span>
                </div>
                <Badge variant="outline" className="text-[10px] border-current/30">
                  {cat.range} · {programs.length}个
                </Badge>
              </div>
              <div className="space-y-3">
                {programs.length > 0 ? (
                  programs.map((p) => (
                    <ProgramCard
                      key={p.id}
                      program={p}
                      onAddToApplications={handleAddToApplications}
                    />
                  ))
                ) : (
                  <div className="glass-card rounded-xl p-8 text-center">
                    <p className="text-xs text-muted-foreground">{cat.emptyText}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      尝试放宽条件或增加目标国家
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
