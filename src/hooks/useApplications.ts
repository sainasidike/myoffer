import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

type Application = Tables<"applications">;
type ApplicationMaterial = Tables<"application_materials">;

export interface ApplicationWithDetails extends Application {
  programs: Tables<"programs"> | null;
  materials: ApplicationMaterial[];
}

export function useApplications() {
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async (): Promise<ApplicationWithDetails[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: apps, error } = await supabase
        .from("applications")
        .select("*, programs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch materials for all applications
      const appIds = (apps || []).map((a) => a.id);
      const { data: materials } = appIds.length > 0
        ? await supabase
            .from("application_materials")
            .select("*")
            .in("application_id", appIds)
            .order("created_at", { ascending: true })
        : { data: [] };

      return (apps || []).map((app) => ({
        ...app,
        programs: app.programs as Tables<"programs"> | null,
        materials: (materials || []).filter((m) => m.application_id === app.id),
      }));
    },
  });

  const updateApplication = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"applications">;
    }) => {
      const { error } = await supabase
        .from("applications")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const updateMaterial = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: TablesUpdate<"application_materials">;
    }) => {
      const { error } = await supabase
        .from("application_materials")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  const deleteApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  // Stats
  const stats = {
    total: applications?.length || 0,
    inProgress: applications?.filter((a) => a.status === "in_progress").length || 0,
    submitted: applications?.filter((a) => a.status === "submitted").length || 0,
    accepted: applications?.filter((a) => a.status === "accepted").length || 0,
    rejected: applications?.filter((a) => a.status === "rejected").length || 0,
  };

  // Upcoming deadlines (within 7 days)
  const urgentApps = (applications || []).filter((a) => {
    if (!a.deadline) return false;
    const days = Math.ceil(
      (new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days >= 0 && days <= 7;
  });

  return {
    applications: applications || [],
    isLoading,
    updateApplication: updateApplication.mutate,
    updateMaterial: updateMaterial.mutate,
    deleteApplication: deleteApplication.mutate,
    stats,
    urgentApps,
  };
}
