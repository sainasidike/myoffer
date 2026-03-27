export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string
          id: string
          user_display_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          user_display_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          user_display_id?: string
          username?: string
        }
        Relationships: []
      }
      school_programs: {
        Row: {
          accept_list: string | null
          application_materials: string | null
          avg_score: number | null
          country: string
          created_at: string
          deadline: string | null
          degree: string
          duration: string | null
          field: string
          id: string
          link: string | null
          living_cost: string | null
          notes: string | null
          prestige: number | null
          program: string
          qs_ranking: number | null
          require_gpa: string | null
          require_lang: string | null
          rolling_admission: boolean | null
          scholarship: string | null
          school: string
          tuition: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          accept_list?: string | null
          application_materials?: string | null
          avg_score?: number | null
          country: string
          created_at?: string
          deadline?: string | null
          degree: string
          duration?: string | null
          field: string
          id?: string
          link?: string | null
          living_cost?: string | null
          notes?: string | null
          prestige?: number | null
          program: string
          qs_ranking?: number | null
          require_gpa?: string | null
          require_lang?: string | null
          rolling_admission?: boolean | null
          scholarship?: string | null
          school: string
          tuition?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          accept_list?: string | null
          application_materials?: string | null
          avg_score?: number | null
          country?: string
          created_at?: string
          deadline?: string | null
          degree?: string
          duration?: string | null
          field?: string
          id?: string
          link?: string | null
          living_cost?: string | null
          notes?: string | null
          prestige?: number | null
          program?: string
          qs_ranking?: number | null
          require_gpa?: string | null
          require_lang?: string | null
          rolling_admission?: boolean | null
          scholarship?: string | null
          school?: string
          tuition?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_onboarding_profiles: {
        Row: {
          awards: string | null
          budget: string | null
          created_at: string
          cross_major: string | null
          current_education: string | null
          entrepreneurship: string | null
          gpa: string | null
          gre_gmat: string | null
          id: string
          internship: string | null
          language_score: string | null
          language_type: string | null
          major: string | null
          other_activities: string | null
          overseas: string | null
          ranking_req: string | null
          research: string | null
          scholarship: string | null
          school: string | null
          special_needs: string | null
          target_country: string | null
          target_degree: string | null
          target_year: string | null
          updated_at: string
          user_id: string
          volunteer: string | null
        }
        Insert: {
          awards?: string | null
          budget?: string | null
          created_at?: string
          cross_major?: string | null
          current_education?: string | null
          entrepreneurship?: string | null
          gpa?: string | null
          gre_gmat?: string | null
          id?: string
          internship?: string | null
          language_score?: string | null
          language_type?: string | null
          major?: string | null
          other_activities?: string | null
          overseas?: string | null
          ranking_req?: string | null
          research?: string | null
          scholarship?: string | null
          school?: string | null
          special_needs?: string | null
          target_country?: string | null
          target_degree?: string | null
          target_year?: string | null
          updated_at?: string
          user_id: string
          volunteer?: string | null
        }
        Update: {
          awards?: string | null
          budget?: string | null
          created_at?: string
          cross_major?: string | null
          current_education?: string | null
          entrepreneurship?: string | null
          gpa?: string | null
          gre_gmat?: string | null
          id?: string
          internship?: string | null
          language_score?: string | null
          language_type?: string | null
          major?: string | null
          other_activities?: string | null
          overseas?: string | null
          ranking_req?: string | null
          research?: string | null
          scholarship?: string | null
          school?: string | null
          special_needs?: string | null
          target_country?: string | null
          target_degree?: string | null
          target_year?: string | null
          updated_at?: string
          user_id?: string
          volunteer?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_user_display_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
