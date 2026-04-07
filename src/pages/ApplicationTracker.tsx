import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  FileText,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { useToast } from "@/hooks/use-toast";

const statusMap: Record<string, { label: string; color: string }> = {
  in_progress: { label: "进行中", color: "bg-primary/10 text-primary" },
  submitted: { label: "已提交", color: "bg-orange-500/10 text-orange-500" },
  accepted: { label: "已录取", color: "bg-green-500/10 text-green-500" },
  rejected: { label: "已拒绝", color: "bg-destructive/10 text-destructive" },
};

const materialStatusMap: Record<string, string> = {
  pending: "待完成",
  in_progress: "进行中",
  submitted: "已提交",
};

export default function ApplicationTracker() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    applications,
    isLoading,
    updateApplication,
    updateMaterial,
    deleteApplication,
    stats,
  } = useApplications();

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const isUrgent = (deadline: string | null) => {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">申请管家</h1>
          <p className="text-sm text-muted-foreground mt-1">
            共 {stats.total} 个申请 · 进行中 {stats.inProgress} · 已提交{" "}
            {stats.submitted} · 已录取 {stats.accepted}
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
          <TabsTrigger value="in_progress">
            进行中 ({stats.inProgress})
          </TabsTrigger>
          <TabsTrigger value="submitted">已提交 ({stats.submitted})</TabsTrigger>
          <TabsTrigger value="accepted">已录取 ({stats.accepted})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">暂无申请</h3>
            <p className="text-sm text-muted-foreground mb-6">
              前往选校页面，将心仪的项目加入申请列表
            </p>
            <Button onClick={() => navigate("/schools")}>去选校</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((app) => {
            const doneCt = app.materials.filter(
              (m) => m.status === "submitted"
            ).length;
            const totalCt = app.materials.length;
            const pct = totalCt > 0 ? Math.round((doneCt / totalCt) * 100) : 0;
            const statusInfo = statusMap[app.status || "in_progress"];
            const prog = app.programs;

            return (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {prog?.university_name_cn || prog?.university_name || "未知学校"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {prog?.program_name_cn || prog?.program_name || ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge
                        className={`${statusInfo.color} border-0 text-xs shrink-0`}
                      >
                        {statusInfo.label}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          deleteApplication(app.id);
                          toast({ title: "已删除申请" });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {app.deadline && (
                    <div className="flex items-center gap-2 text-xs">
                      <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                      <span
                        className={
                          isUrgent(app.deadline)
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        截止：{app.deadline}
                        {isUrgent(app.deadline) && " ⚠️ 即将截止"}
                      </span>
                    </div>
                  )}

                  {/* Materials checklist */}
                  <div className="space-y-2">
                    {app.materials.map((mat) => {
                      const isDone = mat.status === "submitted";
                      const isEssayType = ["sop", "ps", "cv", "recommendation"].includes(
                        mat.material_type
                      );

                      return (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isDone}
                              onCheckedChange={(checked) => {
                                updateMaterial({
                                  id: mat.id,
                                  updates: {
                                    status: checked ? "submitted" : "pending",
                                  },
                                });
                              }}
                            />
                            <span
                              className={`text-sm ${
                                isDone
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {mat.material_name}
                            </span>
                            {mat.status === "in_progress" && (
                              <Badge
                                variant="secondary"
                                className="text-xs h-5"
                              >
                                撰写中
                              </Badge>
                            )}
                          </div>
                          {!isDone && isEssayType && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-primary h-7"
                              onClick={() =>
                                navigate(
                                  `/essays?app=${app.id}&type=${mat.material_type}`
                                )
                              }
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              {mat.status === "in_progress" ? "去修改" : "去撰写"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalCt > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>材料进度</span>
                        <span>
                          {doneCt}/{totalCt}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  )}

                  {/* Status update buttons */}
                  {app.status === "in_progress" && pct === 100 && (
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      onClick={() =>
                        updateApplication({
                          id: app.id,
                          updates: { status: "submitted" },
                        })
                      }
                    >
                      标记为已提交
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
