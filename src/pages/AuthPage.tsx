import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { session, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/onboarding" replace />;
  }

  const fakeEmail = (name: string) => `${name.toLowerCase()}@myoffer.app`;

  const SUPABASE_URL = "https://evumyskbzakiatiagmpq.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dW15c2tiemFraWF0aWFnbXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ3MDMsImV4cCI6MjA5MTEyMDcwM30.w8P3scSa3AtA0TqryqYHW42ONRXLKcSdIUgYT4TH1G8";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("请填写用户名和密码");
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast.error("两次输入的密码不一致");
        return;
      }
      if (password.length < 6) {
        toast.error("密码长度至少6位");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: fakeEmail(username),
          password,
        });
        if (error) {
          toast.error("用户名或密码错误");
          return;
        }
        toast.success("登录成功！");
        navigate("/onboarding");
      } else {
        const signupResp = await fetch(
          `${SUPABASE_URL}/functions/v1/signup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({ username, password }),
          }
        );
        const signupData = await signupResp.json();
        if (!signupResp.ok) {
          toast.error(signupData.error || "注册失败");
          return;
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: fakeEmail(username),
          password,
        });
        if (signInError) {
          toast.error("注册成功但登录失败，请手动登录");
          setIsLogin(true);
          return;
        }
        toast.success("注册成功！");
        navigate("/onboarding");
      }
    } catch {
      toast.error("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">MyOffer</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AI 智能留学申请平台，专为双非学生打造。从信息录入到文书创作，全流程 AI 辅助。
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { title: "AI 对话录入", desc: "智能采集申请信息" },
              { title: "AI 智能选校", desc: "精准匹配录取概率" },
              { title: "申请管家", desc: "全流程进度追踪" },
              { title: "AI 文书创作", desc: "多轮对话打磨文书" },
            ].map((f) => (
              <div key={f.title} className="p-3 rounded-lg bg-background border border-border">
                <div className="text-sm font-medium text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-4">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">MyOffer</h1>
            <p className="text-muted-foreground text-sm mt-1">AI 智能留学申请平台</p>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg">
                {isLogin ? "欢迎回来" : "创建账号"}
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "登录你的 MyOffer 账号" : "注册开始你的留学申请之旅"}
              </p>
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
                    placeholder="请输入密码（至少6位）"
                  />
                </div>
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {loading ? "处理中..." : isLogin ? "登录" : "注册"}
                </Button>
              </form>
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setConfirmPassword("");
                  }}
                >
                  {isLogin ? "没有账号？立即注册" : "已有账号？立即登录"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
