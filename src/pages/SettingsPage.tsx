import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">设置</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">个人信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>用户名</Label>
            <Input defaultValue="访客用户" />
          </div>
          <div className="space-y-2">
            <Label>用户ID</Label>
            <Input defaultValue="GUEST-001" disabled />
          </div>
          <Button onClick={() => toast.success("设置已保存")}>保存</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">偏好设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>默认目标国家</Label>
            <Input placeholder="如：美国, 英国, 中国香港" />
          </div>
          <div className="space-y-2">
            <Label>预算范围</Label>
            <Input placeholder="如：30-50万 RMB/年" />
          </div>
          <Button variant="outline" onClick={() => toast.success("偏好已更新")}>
            更新偏好
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
