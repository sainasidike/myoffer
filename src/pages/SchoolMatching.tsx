import { useState } from "react";
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
} from "lucide-react";
import { useSchools, type MatchedSchool } from "@/hooks/useSchools";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { title: "冲刺校", range: "<40%", color: "warning", filter: (p: number) => p < 40 },
  { title: "匹配校", range: "40-70%", color: "info", filter: (p: number) => p >= 40 && p < 70 },
  { title: "保底校", range: "70%+", color: "purple", filter: (p: number) => p >= 70 },
] as const;

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

  const tags = (prog.tags || []) as string[];

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {prog.university_name_cn || prog.university_name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {prog.program_name_cn || prog.program_name}
            </p>
          </div>
          <span className={`text-lg font-bold ${probColor} ml-2 shrink-0`}>
            {school.probability}%
          </span>
        </div>

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
          {prog.tuition && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {prog.tuition}
            </span>
          )}
        </div>

        {school.reason && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {school.reason}
          </p>
        )}

        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="text-xs"
            >
              {t}
            </Badge>
          ))}
        </div>

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

        {expanded && (
          <div className="space-y-3 pt-2 border-t border-border animate-in fade-in">
            <div className="text-xs space-y-1">
              {prog.duration && (
                <p>
                  <span className="text-muted-foreground">学制：</span>
                  {prog.duration}
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
              {prog.gpa_requirement && (
                <p>
                  <span className="text-muted-foreground">GPA 要求：</span>
                  {prog.gpa_requirement}
                </p>
              )}
              {prog.required_materials && (
                <p>
                  <span className="text-muted-foreground">所需材料：</span>
                  {(prog.required_materials as string[]).join("、")}
                </p>
              )}
              {prog.description && (
                <p>
                  <span className="text-muted-foreground">简介：</span>
                  {prog.description}
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
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hasResults = matchState.results.length > 0;
  const avgProb = hasResults
    ? Math.round(
        matchState.results.reduce((s, c) => s + c.probability, 0) /
          matchState.results.length
      )
    : 0;

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
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">匹配项目数</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-green-500/10 flex items-center justify-center">
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
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">平均录取概率</p>
              <p className="text-2xl font-bold">{avgProb}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action buttons */}
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
          <CardContent className="p-4 text-sm text-destructive">
            {matchState.error}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasResults && !matchState.isMatching && !matchState.error && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">准备好开始选校了吗？</h3>
            <p className="text-sm text-muted-foreground mb-6">
              AI 将根据你的背景，从 50+ 项目中匹配最适合你的学校
            </p>
            <Button onClick={handleStartMatching}>
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
              cat.filter(s.probability)
            );
            const headerColor =
              cat.color === "warning"
                ? "bg-orange-500/10 text-orange-500"
                : cat.color === "info"
                ? "bg-blue-500/10 text-blue-500"
                : "bg-purple-500/10 text-purple-500";

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
