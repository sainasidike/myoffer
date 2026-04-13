import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  DollarSign,
  Award,
  Loader2,
  RefreshCw,
  Plus,
  Check,
  Star,
  Clock,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Lightbulb,
} from "lucide-react";
import { useSchools, type MatchedSchool } from "@/hooks/useSchools";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { title: "冲刺校", range: "录取概率较低", color: "warning", tier: "reach" as const },
  { title: "匹配校", range: "录取概率适中", color: "info", tier: "match" as const },
  { title: "保底校", range: "录取概率较高", color: "purple", tier: "safety" as const },
];

function PrestigeStars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      ))}
    </span>
  );
}

function isDeadlineSoon(deadline: unknown): boolean {
  if (!deadline || typeof deadline !== "object") return false;
  const dates = Object.values(deadline as Record<string, string>);
  const fourWeeks = Date.now() + 28 * 24 * 60 * 60 * 1000;
  return dates.some((d) => {
    const t = new Date(d).getTime();
    return t > Date.now() && t < fourWeeks;
  });
}

function SchoolCard({
  school,
  onAdd,
}: {
  school: MatchedSchool;
  onAdd: (programId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const prog = school.program;

  if (!prog) return null;

  const probColor =
    school.probability < 40
      ? "text-orange-500"
      : school.probability < 70
      ? "text-blue-500"
      : "text-green-500";

  const tierLabel =
    school.tier === "reach" ? "冲刺" : school.tier === "match" ? "匹配" : "保底";
  const tierBg =
    school.tier === "reach"
      ? "bg-orange-100 text-orange-700"
      : school.tier === "match"
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";

  const deadlineSoon = isDeadlineSoon(prog.deadline);
  const prestige = (prog as Record<string, unknown>).prestige as number || 3;
  const programType = (prog as Record<string, unknown>).program_type as string || "授课型";
  const requireLang = (prog as Record<string, unknown>).require_lang as Record<string, number> | null;
  const scholarship = (prog as Record<string, unknown>).scholarship as string[] | null;
  const notes = (prog as Record<string, unknown>).notes as string | null;

  return (
    <Card className="card-hover border-border/60 shadow-soft-sm overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Level 1: School + Program + Probability */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">
                {prog.university_name_cn || prog.university_name}
              </h3>
              <PrestigeStars count={prestige} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {prog.program_name_cn || prog.program_name}
            </p>
          </div>
          <div className="ml-2 shrink-0 text-right">
            <span className={`text-lg font-bold ${probColor}`}>
              {school.probability}%
            </span>
            <div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tierBg}`}>
                {tierLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Level 2: Quick stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {prog.country}
          </span>
          {prog.qs_ranking && prog.qs_ranking > 0 && (
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              QS #{prog.qs_ranking}
            </span>
          )}
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {prog.duration} · {programType}
          </span>
          {requireLang && (
            <span className="flex items-center gap-1">
              {requireLang.ielts_min && `雅思${requireLang.ielts_min}`}
              {requireLang.ielts_min && requireLang.toefl_min && " / "}
              {requireLang.toefl_min && `托福${requireLang.toefl_min}`}
            </span>
          )}
        </div>

        {/* Deadline warning */}
        {deadlineSoon && (
          <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
            <Clock className="w-3 h-3" />
            时间紧张 — 截止日期不足4周
          </div>
        )}

        {/* Risk flags */}
        {school.risk_flags && school.risk_flags.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-amber-600">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{school.risk_flags.join("；")}</span>
          </div>
        )}

        {/* Level 3: AI personalized analysis */}
        {school.reason && (
          <p className="text-xs text-foreground/80 leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
            {school.reason}
          </p>
        )}

        {/* Level 4: Tags */}
        <div className="flex flex-wrap gap-1">
          {(school.advantage_tags || []).map((t) => (
            <Badge key={t} className="text-[10px] bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
              {t}
            </Badge>
          ))}
          {(school.weakness_tags || []).map((t) => (
            <Badge key={t} className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
              {t}
            </Badge>
          ))}
          {(school.improvement_tips || []).map((t) => (
            <Badge key={t} className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-50">
              <Lightbulb className="w-2.5 h-2.5 mr-0.5" />
              {t}
            </Badge>
          ))}
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 mr-1" />
          ) : (
            <ChevronDown className="w-4 h-4 mr-1" />
          )}
          {expanded ? "收起详情" : "展开详情"}
        </Button>

        {/* Expanded details */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-in fade-in">
            <div className="text-xs space-y-1.5">
              {prog.tuition && (
                <p>
                  <span className="text-muted-foreground">学费：</span>
                  {prog.tuition}
                </p>
              )}
              {(prog as Record<string, unknown>).living_cost && (
                <p>
                  <span className="text-muted-foreground">生活费：</span>
                  {(prog as Record<string, unknown>).living_cost as string}
                </p>
              )}
              {prog.gpa_requirement && (
                <p>
                  <span className="text-muted-foreground">GPA 要求：</span>
                  {prog.gpa_requirement}
                </p>
              )}
              {prog.deadline && (
                <p>
                  <span className="text-muted-foreground">截止日期：</span>
                  {Object.entries(prog.deadline as Record<string, string>)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("、")}
                </p>
              )}
              {prog.required_materials && (
                <p>
                  <span className="text-muted-foreground">所需材料：</span>
                  {(prog.required_materials as string[]).join("、")}
                </p>
              )}
              {scholarship && scholarship.length > 0 && (
                <p>
                  <span className="text-muted-foreground">奖学金：</span>
                  {scholarship.map((s: string | { name?: string; amount?: string }) =>
                    typeof s === "string" ? s : `${s.name || ""}${s.amount ? `(${s.amount})` : ""}`
                  ).join("、")}
                </p>
              )}
              {notes && (
                <p>
                  <span className="text-muted-foreground">备注：</span>
                  {notes}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 text-xs"
                disabled={added}
                onClick={() => {
                  onAdd(school.program_id);
                  setAdded(true);
                }}
              >
                {added ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    已加入
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    加入申请列表
                  </>
                )}
              </Button>
              {prog.application_link && (
                <Button size="sm" variant="outline" className="text-xs" asChild>
                  <a
                    href={prog.application_link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    官网
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchoolMatching() {
  const { matchState, startMatching, addToApplications, stats } = useSchools();
  const { profile, profileCompleteness } = useProfile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const completionPct = profileCompleteness();
  const hasResults = matchState.results.length > 0;
  const avgProb = hasResults
    ? Math.round(
        matchState.results.reduce((s, c) => s + c.probability, 0) /
          matchState.results.length
      )
    : 0;

  // Auto-trigger from onboarding
  useEffect(() => {
    if (searchParams.get("auto") === "1" && profile && !matchState.isMatching) {
      setSearchParams({}, { replace: true });
      startMatching(profile as unknown as Record<string, unknown>, {
        countries: (profile.target_country as string[]) || undefined,
        degree: profile.target_degree || undefined,
      });
    }
  }, [searchParams, profile, matchState.isMatching]);

  const handleStartMatching = () => {
    if (!profile) {
      toast({
        title: "请先完成信息录入",
        description: "前往信息录入页面完善你的档案",
        variant: "destructive",
      });
      return;
    }
    startMatching(profile as unknown as Record<string, unknown>, {
      countries: (profile.target_country as string[]) || undefined,
      degree: profile.target_degree || undefined,
    });
  };

  const handleAddToApplications = async (programId: string) => {
    try {
      await addToApplications(programId);
      toast({ title: "已加入申请列表" });
    } catch (err) {
      toast({
        title: "加入失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto page-enter">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60 shadow-soft-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">综合竞争力</p>
              <p className="text-2xl font-bold">
                {matchState.competitiveness > 0
                  ? `${matchState.competitiveness}分`
                  : "—"}
              </p>
              {matchState.competitiveness > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  共匹配 {stats.total} 个项目
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">冲刺 / 匹配 / 保底</p>
              <p className="text-2xl font-bold">
                {stats.reach} / {stats.match} / {stats.safety}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">平均录取概率</p>
              <p className="text-2xl font-bold">{avgProb}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low completeness warning */}
      {completionPct < 60 && hasResults && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-amber-700">档案完整度不足 60%</span>
              <span className="text-amber-600 ml-1">— 概率仅供参考，完善档案可获得更精准的匹配结果</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => navigate("/onboarding")}
            >
              去完善
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      {(hasResults || matchState.isMatching || matchState.error) && (
        <div className="flex gap-3">
          <Button onClick={handleStartMatching} disabled={matchState.isMatching}>
            {matchState.isMatching ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {hasResults ? "重新匹配" : "开始 AI 智能选校"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/onboarding")}
          >
            返回修改信息
          </Button>
        </div>
      )}

      {/* Thinking steps */}
      {matchState.isMatching && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="w-4 h-4 animate-spin" />
              AI 正在分析...
            </div>
            {matchState.thinkingSteps.map((step, i) => (
              <p key={i} className="text-xs text-muted-foreground pl-6">
                {step}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {matchState.error && (
        <Card className="border-destructive">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-destructive">{matchState.error}</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>建议尝试：</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>增加目标国家（如同时选择英国和澳洲）</li>
                <li>放宽 QS 排名要求</li>
                <li>确认档案中的 GPA 和语言成绩已填写</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasResults && !matchState.isMatching && !matchState.error && (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-6">
              <GraduationCap className="w-10 h-10 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold mb-2">准备好开始选校了吗？</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
              AI 将根据你的学术背景、语言成绩和申请偏好，从 50+ 项目中精准匹配最适合你的学校
            </p>
            <Button
              onClick={handleStartMatching}
              className="h-11 px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-soft-sm"
            >
              开始 AI 智能选校
            </Button>
          </CardContent>
        </Card>
      )}

      {/* School Columns */}
      {hasResults && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const schools = matchState.results.filter((s) =>
              s.tier === cat.tier
            );
            const headerColor =
              cat.color === "warning"
                ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600"
                : cat.color === "info"
                ? "bg-gradient-to-r from-blue-500/10 to-primary/10 text-blue-600"
                : "bg-gradient-to-r from-purple-500/10 to-violet-500/10 text-purple-600";

            return (
              <div key={cat.title} className="space-y-3">
                <div
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${headerColor}`}
                >
                  <span className="font-semibold text-sm">{cat.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {schools.length} 个 · {cat.range}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {schools.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      暂无此类院校
                    </p>
                  ) : (
                    schools.map((s) => (
                      <SchoolCard
                        key={s.program_id}
                        school={s}
                        onAdd={handleAddToApplications}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
