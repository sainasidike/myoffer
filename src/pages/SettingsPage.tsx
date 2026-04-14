import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { User, Shield, GraduationCap, Info } from "lucide-react";
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

export default function SettingsPage() {
  const { profile: authProfile, signOut } = useAuth();
  const { profile } = useProfile();

  const profileFields = [
    { label: "学校", value: profile?.school },
    { label: "专业", value: profile?.major },
    { label: "当前学历", value: profile?.current_education },
    { label: "目标学历", value: profile?.target_degree },
    { label: "GPA", value: profile?.gpa },
    { label: "语言类型", value: profile?.language_type },
    { label: "目标国家", value: Array.isArray(profile?.target_country) ? (profile.target_country as string[]).join("、") : profile?.target_country },
    { label: "目标入学年份", value: profile?.target_year },
    { label: "预算", value: profile?.budget },
  ].filter((f) => f.value !== null && f.value !== undefined && f.value !== "");

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto page-enter">
      <h1 className="text-xl font-bold tracking-tight">设置</h1>

      <Card className="border-border/60 shadow-soft-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-bold">个人信息</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">用户名</Label>
            <Input value={authProfile?.username ?? ""} disabled className="bg-muted/40 border-border/60" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">用户 ID</Label>
            <Input value={authProfile?.user_display_id ?? ""} disabled className="bg-muted/40 border-border/60" />
          </div>
        </CardContent>
      </Card>

      {profileFields.length > 0 && (
        <Card className="border-border/60 shadow-soft-sm">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/20 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-purple-500" />
              </div>
              <CardTitle className="text-base font-bold">我的档案</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profileFields.map((f) => (
                <div key={f.label} className="px-3 py-2.5 rounded-xl bg-muted/40 border border-border/40">
                  <Label className="text-[11px] text-muted-foreground">{f.label}</Label>
                  <div className="text-sm font-medium mt-0.5">{String(f.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60 shadow-soft-sm">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green-600" />
            </div>
            <CardTitle className="text-base font-bold">账号安全</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            密码修改功能即将推出。
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl">退出登录</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
                <AlertDialogDescription>
                  退出后需要重新登录才能使用。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    signOut();
                    toast.success("已退出登录");
                  }}
                >
                  确认退出
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-soft-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-orange-500" />
            </div>
            <CardTitle className="text-base font-bold">关于</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-soft-sm">
              M
            </div>
            <div>
              <div className="font-bold text-sm">MyOffer v1.0</div>
              <div className="text-xs text-muted-foreground">AI 留学申请平台</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI 驱动的留学申请平台，专为双非学生打造。从信息录入到文书创作，全流程 AI 辅助。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
