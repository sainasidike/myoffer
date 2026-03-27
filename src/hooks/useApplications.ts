import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ApplicationMaterial {
  id: string;
  application_id: string;
  material_name: string;
  material_type: string | null;
  is_completed: boolean;
  completed_at: string | null;
  file_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  school: string;
  program: string;
  country: string | null;
  status: string;
  deadline: string | null;
  submission_date: string | null;
  decision_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  materials: ApplicationMaterial[];
}

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("用户未登录");
      }

      const { data: appsData, error: appsError } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (appsError) throw appsError;

      const applicationsWithMaterials = await Promise.all(
        (appsData || []).map(async (app) => {
          const { data: materialsData, error: materialsError } = await supabase
            .from("application_materials")
            .select("*")
            .eq("application_id", app.id)
            .order("created_at", { ascending: true });

          if (materialsError) throw materialsError;

          return {
            ...app,
            materials: materialsData || [],
          };
        })
      );

      setApplications(applicationsWithMaterials);
    } catch (err: any) {
      console.error("加载申请失败:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMaterial = async (materialId: string, newState: boolean) => {
    try {
      const { error } = await supabase
        .from("application_materials")
        .update({
          is_completed: newState,
          completed_at: newState ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", materialId);

      if (error) throw error;

      await loadApplications();
    } catch (err: any) {
      console.error("更新材料状态失败:", err);
      throw err;
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return {
    applications,
    isLoading,
    toggleMaterial,
    refreshApplications: loadApplications,
  };
}
