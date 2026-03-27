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

const navItems = [
  { title: "AI助手", path: "/onboarding", icon: ClipboardList, status: "active" },
  { title: "AI选校", path: "/schools", icon: GraduationCap },
  { title: "申请管家", path: "/applications", icon: Briefcase },
  { title: "文书创作", path: "/essays", icon: PenTool },
  { title: "设置", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary font-bold text-primary-foreground text-lg font-mono">
          M
        </div>
        <div>
          <div className="text-sidebar-accent-foreground font-semibold text-base tracking-wide font-mono">MyOffer</div>
          <div className="text-sidebar-foreground text-xs">留学申请平台</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1 mt-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "glass text-primary font-medium shadow-[0_0_15px_rgba(102,252,241,0.1)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.title}</span>
              {active && (
                <div className="ml-auto relative">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary cyber-ping" />
                </div>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg glass-card">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sidebar-accent-foreground text-sm font-medium truncate">
              {profile?.username ?? "加载中..."}
            </div>
            <div className="text-sidebar-foreground text-xs truncate font-mono">
              {profile?.user_display_id ?? ""}
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-sidebar-foreground hover:text-destructive transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
