import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

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

  // Upload file to Supabase Storage and update material's file_url
  const uploadMaterialFile = useMutation({
    mutationFn: async ({
      materialId,
      file,
    }: {
      materialId: string;
      file: File;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const ext = file.name.split(".").pop() || "pdf";
      const path = `${user.id}/materials/${materialId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save the storage path to material
      const { error: updateError } = await supabase
        .from("application_materials")
        .update({
          file_url: path,
          status: "submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", materialId);

      if (updateError) throw updateError;
      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  // Get a temporary signed URL for viewing a file
  const getFileUrl = async (storagePath: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  // Download all materials as individual files (browser triggers downloads)
  const downloadAllMaterials = async (app: ApplicationWithDetails) => {
    const materialsWithFiles = app.materials.filter((m) => m.file_url || m.essay_id);

    for (const mat of materialsWithFiles) {
      if (mat.file_url) {
        const url = await getFileUrl(mat.file_url);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${mat.material_name}.${mat.file_url.split(".").pop()}`;
        a.click();
      } else if (mat.essay_id) {
        // Download essay content as txt
        const { data: essay } = await supabase
          .from("essays")
          .select("content, title")
          .eq("id", mat.essay_id)
          .single();
        if (essay?.content) {
          const blob = new Blob([essay.content], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${essay.title || mat.material_name}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
    }
  };

  // Stats
  const stats = {
    total: applications?.length || 0,
    inProgress: applications?.filter((a) => a.status === "in_progress").length || 0,
    submitted: applications?.filter((a) => a.status === "submitted").length || 0,
    accepted: applications?.filter((a) => a.status === "accepted").length || 0,
    rejected: applications?.filter((a) => a.status === "rejected").length || 0,
  };

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
    uploadMaterialFile: uploadMaterialFile.mutateAsync,
    isUploading: uploadMaterialFile.isPending,
    getFileUrl,
    downloadAllMaterials,
    stats,
    urgentApps,
  };
}
