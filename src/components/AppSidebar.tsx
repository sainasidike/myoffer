import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  ClipboardList,
  GraduationCap,
  Briefcase,
  PenTool,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

const navItems = [
  { title: "AI助手", path: "/onboarding", icon: ClipboardList, status: "active" },
  { title: "AI选校", path: "/schools", icon: GraduationCap },
  { title: "申请管家", path: "/applications", icon: Briefcase },
  { title: "文书创作", path: "/essays", icon: PenTool },
  { title: "设置", path: "/settings", icon: Settings },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white/80 backdrop-blur-sm shrink-0 border-r border-border/60">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 font-bold text-white text-lg shadow-soft-sm">
          M
        </div>
        <div>
          <div className="text-foreground font-bold text-base tracking-tight">MyOffer</div>
          <div className="text-muted-foreground text-[11px]">AI 留学申请平台</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                active
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white font-medium shadow-soft-sm"
                  : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] ${active ? "" : "group-hover:scale-110"} transition-transform`} />
              <span>{item.title}</span>
              {item.status === "active" && !active && (
                <div className="ml-auto">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_hsl(142_71%_45%/0.4)]" />
                </div>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-accent/80 to-accent/40 border border-border/50">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-foreground text-sm font-medium truncate">
              {profile?.username ?? "加载中..."}
            </div>
            <div className="text-muted-foreground text-[11px] truncate">
              {profile?.user_display_id ?? ""}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/10"
                title="退出登录"
                aria-label="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
                <AlertDialogAction onClick={signOut}>确认退出</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </aside>
  );
}
