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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
        // Call signup Edge Function (uses admin API to auto-confirm email)
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
        // Auto sign-in after successful registration
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
  );
}
