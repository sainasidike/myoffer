import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import {
  ClipboardList,
  GraduationCap,
  Briefcase,
  PenTool,
  Settings,
  User,
} from "lucide-react";

const navItems = [
  { title: "信息录入", path: "/onboarding", icon: ClipboardList },
  { title: "AI选校", path: "/schools", icon: GraduationCap },
  { title: "申请管家", path: "/applications", icon: Briefcase },
  { title: "文书创作", path: "/essays", icon: PenTool },
  { title: "设置", path: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-sidebar shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary font-bold text-primary-foreground text-lg">
          M
        </div>
        <div>
          <div className="text-sidebar-accent-foreground font-semibold text-base tracking-wide">MyOffer</div>
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              <span>{item.title}</span>
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </RouterNavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-sidebar-accent/30">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sidebar-accent-foreground text-sm font-medium truncate">
              访客用户
            </div>
            <div className="text-sidebar-foreground text-xs truncate">
              ID: GUEST
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
