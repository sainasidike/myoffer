import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("请填写用户名和密码");
      return;
    }
    setLoading(true);

    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        toast.success("登录成功！");
      } else {
        toast.success("注册成功！");
      }
      navigate("/onboarding");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary font-bold text-primary-foreground text-2xl mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold">MyOffer</h1>
          <p className="text-muted-foreground text-sm mt-1">AI智能留学申请平台</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-lg">
              {isLogin ? "登录" : "注册"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "处理中..." : isLogin ? "登录" : "注册"}
              </Button>
            </form>
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "没有账号？立即注册" : "已有账号？立即登录"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
