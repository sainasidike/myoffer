import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 min-h-screen overflow-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
