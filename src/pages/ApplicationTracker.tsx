import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CalendarDays,
  FileText,
  Download,
  Trash2,
  Loader2,
  FolderOpen,
  ChevronLeft,
  Upload,
  Eye,
  Pencil,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  useApplications,
  type ApplicationWithDetails,
} from "@/hooks/useApplications";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

const statusMap: Record<string, { label: string; color: string }> = {
  in_progress: { label: "进行中", color: "bg-blue-500/10 text-blue-600" },
  submitted: { label: "已申请", color: "bg-orange-500/10 text-orange-600" },
  accepted: { label: "已录取", color: "bg-green-500/10 text-green-600" },
  rejected: { label: "已拒绝", color: "bg-destructive/10 text-destructive" },
};

const ESSAY_TYPES = new Set(["sop", "ps", "cv", "recommendation"]);

function isUrgent(deadline: string | null) {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function getDeadlineDisplay(prog: Tables<"programs"> | null, appDeadline: string | null): { text: string; urgent: boolean } | null {
  // Try app-level deadline first
  if (appDeadline) {
    return { text: appDeadline, urgent: isUrgent(appDeadline) };
  }
  // Fall back to program deadline (JSON object)
  if (prog?.deadline && typeof prog.deadline === "object") {
    const entries = Object.entries(prog.deadline as Record<string, string>);
    const now = Date.now();
    // Find the next upcoming deadline
    const upcoming = entries
      .map(([k, v]) => ({ round: k, date: v, ts: new Date(v).getTime() }))
      .filter((e) => e.ts > now)
      .sort((a, b) => a.ts - b.ts);
    if (upcoming.length > 0) {
      const next = upcoming[0];
      const urgent = next.ts - now < 7 * 24 * 60 * 60 * 1000;
      return { text: `${next.round}: ${next.date}`, urgent };
    }
    // All deadlines passed
    if (entries.length > 0) {
      return { text: entries.map(([k, v]) => `${k}: ${v}`).join("、"), urgent: false };
    }
  }
  return null;
}

// ─── Application Card (list view) ──────────────────────────────────────────

function AppCard({
  app,
  onClick,
}: {
  app: ApplicationWithDetails;
  onClick: () => void;
}) {
  const prog = app.programs;
  const doneCt = app.materials.filter((m) => m.status === "submitted").length;
  const inProgressCt = app.materials.filter((m) => m.status === "in_progress").length;
  const totalCt = app.materials.length;
  const pct = totalCt > 0 ? Math.round((doneCt / totalCt) * 100) : 0;
  const statusInfo = statusMap[app.status || "in_progress"];
  const dl = getDeadlineDisplay(prog, app.deadline);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {prog?.university_name_cn || prog?.university_name || "未知学校"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {prog?.program_name_cn || prog?.program_name || ""}
            </p>
          </div>
          <Badge className={`${statusInfo.color} border-0 text-xs shrink-0`}>
            {statusInfo.label}
          </Badge>
        </div>

        {dl && (
          <div className="flex items-center gap-2 text-xs">
            {dl.urgent ? (
              <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            ) : (
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className={dl.urgent ? "text-destructive font-medium" : "text-muted-foreground"}>
              截止：{dl.text}
              {dl.urgent && " — 即将截止"}
            </span>
          </div>
        )}

        {totalCt > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>材料进度</span>
              <span>
                {doneCt}/{totalCt}
                {inProgressCt > 0 && (
                  <span className="text-blue-500 ml-1">({inProgressCt}进行中)</span>
                )}
              </span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Application Detail (material checklist) ───────────────────────────────

function AppDetail({
  app,
  onBack,
}: {
  app: ApplicationWithDetails;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    updateApplication,
    updateMaterial,
    deleteApplication,
    uploadMaterialFile,
    isUploading,
    getFileUrl,
    downloadAllMaterials,
  } = useApplications();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const prog = app.programs;
  const statusInfo = statusMap[app.status || "in_progress"];
  const doneCt = app.materials.filter((m) => m.status === "submitted").length;
  const inProgressCt = app.materials.filter((m) => m.status === "in_progress").length;
  const totalCt = app.materials.length;
  const pct = totalCt > 0 ? Math.round((doneCt / totalCt) * 100) : 0;
  const dl = getDeadlineDisplay(prog, app.deadline);

  const handleUpload = async (materialId: string, file: File) => {
    try {
      setUploadingId(materialId);
      await uploadMaterialFile({ materialId, file });
      toast({ title: "文件上传成功" });
    } catch (err) {
      toast({
        title: "上传失败",
        description: err instanceof Error ? err.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      const url = await getFileUrl(fileUrl);
      window.open(url, "_blank");
    } catch {
      toast({ title: "获取文件链接失败", variant: "destructive" });
    }
  };

  const handleEssayAction = (mat: Tables<"application_materials">) => {
    const schoolName = prog?.university_name_cn || prog?.university_name || "";
    const matName = mat.material_name;

    if (mat.essay_id) {
      // Already has essay → go to modify (load existing conversation)
      navigate(`/essays?essayId=${mat.essay_id}`);
    } else {
      // Create new → pass app context
      navigate(
        `/essays?app=${app.id}&type=${mat.material_type}&materialId=${mat.id}&title=${encodeURIComponent(schoolName + " — " + matName)}`
      );
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateApplication({ id: app.id, updates: { status: newStatus } });
    toast({ title: `状态已更新为「${statusMap[newStatus]?.label}」` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">
            {prog?.university_name_cn || prog?.university_name || "未知学校"}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {prog?.program_name_cn || prog?.program_name || ""}
          </p>
        </div>
        <Badge className={`${statusInfo.color} border-0 text-sm`}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        {dl && (
          <span className={`flex items-center gap-1.5 ${dl.urgent ? "text-destructive font-medium" : ""}`}>
            {dl.urgent ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            截止：{dl.text}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" />
          材料进度：{doneCt}/{totalCt} ({pct}%)
          {inProgressCt > 0 && <span className="text-blue-500">· {inProgressCt}项进行中</span>}
        </span>
      </div>

      {/* Progress */}
      <Progress value={pct} className="h-2" />

      {/* Material Checklist */}
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {app.materials.map((mat) => {
            const isDone = mat.status === "submitted";
            const isEssay = ESSAY_TYPES.has(mat.material_type);
            const hasEssay = !!mat.essay_id;
            const hasFile = !!mat.file_url;
            const isUploadingThis = uploadingId === mat.id && isUploading;

            return (
              <div key={mat.id} className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                <Checkbox
                  checked={isDone}
                  onCheckedChange={(checked) => {
                    updateMaterial({
                      id: mat.id,
                      updates: { status: checked ? "submitted" : "pending" },
                    });
                  }}
                />

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${isDone ? "text-muted-foreground line-through" : ""}`}>
                    {mat.material_name}
                  </span>
                  {mat.status === "in_progress" && (
                    <Badge variant="secondary" className="text-[10px] ml-2 h-5">
                      撰写中
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Essay types: 去撰写 / 去修改 */}
                  {isEssay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-7"
                      onClick={() => handleEssayAction(mat)}
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      {hasEssay ? "去修改" : "去撰写"}
                    </Button>
                  )}

                  {/* Non-essay: upload */}
                  {!isEssay && !hasFile && !isDone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      disabled={isUploadingThis}
                      onClick={() => {
                        setUploadingId(mat.id);
                        fileInputRef.current?.click();
                      }}
                    >
                      {isUploadingThis ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Upload className="w-3 h-3 mr-1" />
                      )}
                      上传
                    </Button>
                  )}

                  {/* View file */}
                  {hasFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleViewFile(mat.file_url!)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      查看
                    </Button>
                  )}

                  {/* View essay content */}
                  {hasEssay && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => navigate(`/essays?essayId=${mat.essay_id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      查看
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingId) {
            handleUpload(uploadingId, file);
          }
          e.target.value = "";
        }}
      />

      {/* Bottom actions */}
      <div className="flex flex-wrap gap-3">
        {/* Status change buttons */}
        {app.status === "in_progress" && pct === 100 && (
          <Button size="sm" onClick={() => handleStatusChange("submitted")}>
            <CheckCircle2 className="w-4 h-4 mr-1" />
            标记为已申请
          </Button>
        )}
        {app.status === "submitted" && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleStatusChange("accepted")}
            >
              标记为已录取
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusChange("rejected")}
            >
              标记为已拒绝
            </Button>
          </>
        )}

        {/* Download all */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            downloadAllMaterials(app);
            toast({ title: "正在导出材料..." });
          }}
        >
          <Download className="w-4 h-4 mr-1" />
          一键导出材料
        </Button>

        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              删除申请
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除申请？</AlertDialogTitle>
              <AlertDialogDescription>
                删除「{prog?.university_name_cn || prog?.university_name || "该申请"}」将同时移除所有相关材料记录。此操作不可恢复。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  deleteApplication(app.id);
                  toast({ title: "已删除申请" });
                  onBack();
                }}
              >
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ApplicationTracker() {
  const [filter, setFilter] = useState("all");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    applications,
    isLoading,
    stats,
  } = useApplications();

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const selectedApp = selectedAppId
    ? applications.find((a) => a.id === selectedAppId) || null
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {selectedApp ? (
        <AppDetail
          app={selectedApp}
          onBack={() => setSelectedAppId(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">申请管家</h1>
              <p className="text-sm text-muted-foreground mt-1">
                共 {stats.total} 个申请 · 进行中 {stats.inProgress} · 已申请{" "}
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
              <TabsTrigger value="submitted">已申请 ({stats.submitted})</TabsTrigger>
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
              {filtered.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onClick={() => setSelectedAppId(app.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
