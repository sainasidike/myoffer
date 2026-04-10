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
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary font-bold text-primary-foreground text-lg">
          M
        </div>
        <div>
          <div className="text-foreground font-semibold text-base tracking-wide">MyOffer</div>
          <div className="text-muted-foreground text-xs">留学申请平台</div>
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
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.title}</span>
              {item.status === "active" && !active && (
                <div className="ml-auto">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-accent border border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-foreground text-sm font-medium truncate">
              {profile?.username ?? "加载中..."}
            </div>
            <div className="text-muted-foreground text-xs truncate">
              {profile?.user_display_id ?? ""}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="text-muted-foreground hover:text-destructive transition-colors"
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
