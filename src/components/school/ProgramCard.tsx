import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  DollarSign,
  Award,
  Clock,
  Star,
  AlertTriangle,
  Plus,
  Zap,
} from "lucide-react";
import type { MatchedProgram } from "@/hooks/useSchoolMatching";

interface ProgramCardProps {
  program: MatchedProgram;
  onAddToApplications?: (program: MatchedProgram) => void;
}

export function ProgramCard({ program, onAddToApplications }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);

  const probColor =
    program.probability < 40
      ? "text-warning"
      : program.probability < 70
      ? "text-primary"
      : "text-success";

  const probLabel =
    program.probability < 40
      ? "冲刺"
      : program.probability < 70
      ? "匹配"
      : "保底";

  const probBadgeClass =
    program.probability < 40
      ? "bg-warning/20 text-warning border-warning/30"
      : program.probability < 70
      ? "bg-primary/20 text-primary border-primary/30"
      : "bg-success/20 text-success border-success/30";

  const stars = Array.from({ length: 5 }, (_, i) => i < program.prestige);

  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/40">
      <div className="p-4 space-y-3">
        {/* Level 1: School + Probability */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-foreground font-mono truncate">
                {program.school}
              </h3>
              <span className="text-xs text-muted-foreground">{program.country}</span>
              <div className="flex gap-0.5">
                {stars.map((filled, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${filled ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">{program.program}</p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className={`text-xl font-bold font-mono ${probColor}`}>
              {program.probability}%
            </span>
            <Badge className={`text-[10px] border ${probBadgeClass} mt-0.5`}>
              {probLabel}
            </Badge>
          </div>
        </div>

        {/* Level 2: Key info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {program.duration || "—"}
          </span>
          <span className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            QS #{program.qs_ranking || "—"}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {program.tuition || "—"}
          </span>
          {program.type && (
            <Badge variant="outline" className="text-[10px] border-border">
              {program.type}
            </Badge>
          )}
          {program.require_lang && (
            <span className="text-[10px]">🌐 {program.require_lang}</span>
          )}
        </div>

        {/* Level 3: AI analysis */}
        {program.analysis?.text && (
          <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
            {program.analysis.text}
          </p>
        )}

        {/* Level 4: Tags */}
        <div className="flex flex-wrap gap-1">
          {program.analysis?.advantages?.map((a) => (
            <Badge key={a} className="text-[10px] bg-success/10 text-success border-success/20 border">
              {a}
            </Badge>
          ))}
          {program.analysis?.disadvantages?.map((d) => (
            <Badge key={d} className="text-[10px] bg-warning/10 text-warning border-warning/20 border">
              {d}
            </Badge>
          ))}
          {program.analysis?.tips?.map((t) => (
            <Badge key={t} className="text-[10px] bg-primary/10 text-primary border-primary/20 border">
              <Zap className="w-2.5 h-2.5 mr-0.5" />
              {t}
            </Badge>
          ))}
          {program.riskFlags?.map((r) => (
            <Badge key={r} className="text-[10px] bg-warning/10 text-warning border-warning/20 border">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              {r}
            </Badge>
          ))}
          {program.deadlineWarning && (
            <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 border">
              <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
              时间紧张
            </Badge>
          )}
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
          {expanded ? "收起详情" : "展开详情"}
        </Button>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-message-in">
            <div className="text-xs space-y-1.5">
              {program.deadline && (
                <p>
                  <span className="text-muted-foreground">截止日期：</span>
                  <span className={program.deadlineWarning ? "text-destructive font-semibold" : ""}>
                    {program.deadline}
                  </span>
                  {program.rolling_admission && (
                    <Badge variant="outline" className="ml-1 text-[10px]">滚动录取</Badge>
                  )}
                </p>
              )}
              {program.application_materials && (
                <p><span className="text-muted-foreground">申请材料：</span>{program.application_materials}</p>
              )}
              {program.require_gpa && (
                <p><span className="text-muted-foreground">GPA要求：</span>{program.require_gpa}</p>
              )}
              {program.scholarship && (
                <p><span className="text-muted-foreground">奖学金：</span>{program.scholarship}</p>
              )}
              {program.living_cost && (
                <p><span className="text-muted-foreground">生活费：</span>{program.living_cost}</p>
              )}
              {program.notes && (
                <p><span className="text-muted-foreground">项目特点：</span>{program.notes}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 text-xs bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                onClick={() => onAddToApplications?.(program)}
              >
                <Plus className="w-3 h-3 mr-1" />
                加入申请列表
              </Button>
              {program.link && (
                <Button size="sm" variant="outline" className="text-xs border-border" asChild>
                  <a href={program.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    官网
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
