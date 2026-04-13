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
import { GraduationCap, Loader2, Sparkles, BookOpen, Target, PenTool } from "lucide-react";

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse-glow">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
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

  const features = [
    { icon: Sparkles, title: "AI 对话录入", desc: "自然语言智能采集申请信息", color: "text-blue-500" },
    { icon: Target, title: "AI 智能选校", desc: "算法精准匹配录取概率", color: "text-purple-500" },
    { icon: BookOpen, title: "申请管家", desc: "材料清单 + 进度全追踪", color: "text-emerald-500" },
    { icon: PenTool, title: "AI 文书创作", desc: "多轮打磨直到满意", color: "text-orange-500" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-center justify-center p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-lg space-y-8 animate-fade-in-up">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-soft-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
              MyOffer
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              AI 智能留学申请平台，专为<span className="text-foreground font-medium">双非学生</span>打造。
              从信息录入到文书创作，全流程 AI 辅助，让每一步都更高效。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-4 rounded-xl bg-white/80 border border-border/60 shadow-soft-sm card-hover"
              >
                <f.icon className={`w-5 h-5 ${f.color} mb-2`} />
                <div className="text-sm font-semibold text-foreground">{f.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border-2 border-white" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">100+</span> 双非学生正在使用
            </p>
          </div>
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-soft mb-4">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">MyOffer</h1>
            <p className="text-muted-foreground text-sm mt-1">AI 智能留学申请平台</p>
          </div>

          <Card className="shadow-soft-lg border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl font-bold">
                {isLogin ? "欢迎回来" : "创建账号"}
              </CardTitle>
              <p className="text-center text-sm text-muted-foreground">
                {isLogin ? "登录你的 MyOffer 账号" : "注册开始你的留学申请之旅"}
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="h-11 transition-shadow"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（至少6位）"
                    className="h-11 transition-shadow"
                  />
                </div>
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="请再次输入密码"
                      className="h-11 transition-shadow"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-soft-sm transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {loading ? "处理中..." : isLogin ? "登录" : "注册"}
                </Button>
              </form>
              <div className="text-center mt-5">
                <button
                  type="button"
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
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

          <p className="text-center text-xs text-muted-foreground mt-6">
            MVP 阶段全部功能免费使用
          </p>
        </div>
      </div>
    </div>
  );
}
