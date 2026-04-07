import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { ProtectedRoute } from "./ProtectedRoute";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AppSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        {/* Main content */}
        <main className="flex-1 min-h-screen overflow-auto">
          {/* Mobile header */}
          <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border bg-card lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                M
              </div>
              <span className="font-semibold text-sm">MyOffer</span>
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
