import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import OnboardingChat from "@/pages/OnboardingChat";
import SchoolMatching from "@/pages/SchoolMatching";
import ApplicationTracker from "@/pages/ApplicationTracker";
import EssayWriting from "@/pages/EssayWriting";
import SettingsPage from "@/pages/SettingsPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/onboarding" replace />} />
              <Route path="/onboarding" element={<OnboardingChat />} />
              <Route path="/schools" element={<SchoolMatching />} />
              <Route path="/applications" element={<ApplicationTracker />} />
              <Route path="/essays" element={<EssayWriting />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
