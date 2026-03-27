import { TrendingUp, Target, BarChart3, Cpu } from "lucide-react";

interface StatsBarProps {
  compositeScore: number;
  totalMatched: number;
  avgProbability: number;
}

export function StatsBar({ compositeScore, totalMatched, avgProbability }: StatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-card rounded-xl p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono">综合竞争力得分</p>
          <p className="text-2xl font-bold text-foreground font-mono">
            {compositeScore}
            <span className="text-sm text-muted-foreground font-normal">/100</span>
          </p>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-success/20 border border-success/30 flex items-center justify-center">
          <Target className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono">匹配项目数</p>
          <p className="text-2xl font-bold text-foreground font-mono">{totalMatched}</p>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-warning/20 border border-warning/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono">平均录取概率</p>
          <p className="text-2xl font-bold text-foreground font-mono">{avgProbability}%</p>
        </div>
      </div>
    </div>
  );
}
