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
  ].filter((f) => f.value);

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">设置</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">个人信息</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>用户名</Label>
            <Input value={authProfile?.username ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>用户 ID</Label>
            <Input value={authProfile?.user_display_id ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      {profileFields.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">我的档案</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profileFields.map((f) => (
                <div key={f.label} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <div className="text-sm font-medium">{String(f.value)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">账号安全</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            密码修改功能即将推出。
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">退出登录</Button>
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

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">关于</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            MyOffer v1.0 — AI 驱动的留学申请平台，专为双非学生打造。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
