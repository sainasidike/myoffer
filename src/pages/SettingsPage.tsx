import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield } from "lucide-react";

export default function SettingsPage() {
  const { profile, signOut } = useAuth();

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
            <Input value={profile?.username ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>用户 ID</Label>
            <Input value={profile?.user_display_id ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">账号安全</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            如需修改密码或其他安全设置，请联系客服。
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              signOut();
              toast.success("已退出登录");
            }}
          >
            退出登录
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
