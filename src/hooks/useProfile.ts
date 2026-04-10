import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type ProfileUpdate = TablesUpdate<"profiles">;

export function useProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const profileCompleteness = (): number => {
    if (!profile) return 0;
    const fields = [
      "target_degree", "current_education", "school", "major", "gpa",
      "language_type", "language_score", "target_country", "target_year", "budget",
    ];
    const filled = fields.filter((f) => {
      const val = profile[f as keyof Profile];
      if (val === null || val === undefined || val === "") return false;
      if (typeof val === "string" && val.trim() === "") return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === "object" && !Array.isArray(val) && Object.keys(val as object).length === 0) return false;
      return true;
    });
    return Math.round((filled.length / fields.length) * 100);
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfile.mutate,
    updateProfileAsync: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
    profileCompleteness,
  };
}
