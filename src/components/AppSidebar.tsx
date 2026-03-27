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
    <aside className="flex flex-col w-60 min-h-screen bg-gray-900 shrink-0 border-r border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500 font-bold text-white text-lg">
          M
        </div>
        <div>
          <div className="text-white font-semibold text-base tracking-wide">MyOffer</div>
          <div className="text-gray-400 text-xs">留学申请平台</div>
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
                  ? "bg-blue-500 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
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
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-800 border border-gray-700">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-gray-300">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-sm font-medium truncate">
              {profile?.username ?? "加载中..."}
            </div>
            <div className="text-gray-400 text-xs truncate">
              {profile?.user_display_id ?? ""}
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-gray-400 hover:text-red-400 transition-colors"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
