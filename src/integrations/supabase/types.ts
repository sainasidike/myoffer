Initialising login role...
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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      application_materials: {
        Row: {
          application_id: string
          created_at: string | null
          due_date: string | null
          essay_id: string | null
          file_url: string | null
          id: string
          material_name: string
          material_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          due_date?: string | null
          essay_id?: string | null
          file_url?: string | null
          id?: string
          material_name: string
          material_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          due_date?: string | null
          essay_id?: string | null
          file_url?: string | null
          id?: string
          material_name?: string
          material_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_materials_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_materials_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          notes: string | null
          program_id: string
          status: string | null
          target_round: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          notes?: string | null
          program_id: string
          status?: string | null
          target_round?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          status?: string | null
          target_round?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      essay_conversations: {
        Row: {
          content: string
          created_at: string | null
          essay_id: string
          id: string
          role: string
        }
        Insert: {
          content: string
          created_at?: string | null
          essay_id: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          created_at?: string | null
          essay_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "essay_conversations_essay_id_fkey"
            columns: ["essay_id"]
            isOneToOne: false
            referencedRelation: "essays"
            referencedColumns: ["id"]
          },
        ]
      }
      essays: {
        Row: {
          ai_model: string | null
          application_id: string | null
          content: string | null
          created_at: string | null
          essay_type: string
          id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          application_id?: string | null
          content?: string | null
          created_at?: string | null
          essay_type: string
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          application_id?: string | null
          content?: string | null
          created_at?: string | null
          essay_type?: string
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "essays_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          awards: string[] | null
          budget: string | null
          created_at: string
          cross_major: boolean | null
          current_education: string | null
          gpa: number | null
          gpa_scale: number | null
          gre_gmat: Json | null
          id: string
          internship: string[] | null
          language_score: Json | null
          language_type: string | null
          major: string | null
          onboarding_completed: boolean | null
          profile_summary: string | null
          ranking_req: string | null
          research: string[] | null
          school: string | null
          special_needs: string | null
          target_country: string[] | null
          target_degree: string | null
          target_year: number | null
          user_display_id: string
          username: string
        }
        Insert: {
          awards?: string[] | null
          budget?: string | null
          created_at?: string
          cross_major?: boolean | null
          current_education?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          gre_gmat?: Json | null
          id: string
          internship?: string[] | null
          language_score?: Json | null
          language_type?: string | null
          major?: string | null
          onboarding_completed?: boolean | null
          profile_summary?: string | null
          ranking_req?: string | null
          research?: string[] | null
          school?: string | null
          special_needs?: string | null
          target_country?: string[] | null
          target_degree?: string | null
          target_year?: number | null
          user_display_id: string
          username: string
        }
        Update: {
          awards?: string[] | null
          budget?: string | null
          created_at?: string
          cross_major?: boolean | null
          current_education?: string | null
          gpa?: number | null
          gpa_scale?: number | null
          gre_gmat?: Json | null
          id?: string
          internship?: string[] | null
          language_score?: Json | null
          language_type?: string | null
          major?: string | null
          onboarding_completed?: boolean | null
          profile_summary?: string | null
          ranking_req?: string | null
          research?: string[] | null
          school?: string | null
          special_needs?: string | null
          target_country?: string[] | null
          target_degree?: string | null
          target_year?: number | null
          user_display_id?: string
          username?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          application_link: string | null
          country: string
          created_at: string | null
          deadline: Json | null
          degree_type: string
          department: string | null
          description: string | null
          duration: string | null
          gpa_requirement: number | null
          gre_required: boolean | null
          id: string
          language_requirement: Json | null
          program_name: string
          program_name_cn: string | null
          qs_ranking: number | null
          required_materials: string[] | null
          tags: string[] | null
          tuition: string | null
          university_name: string
          university_name_cn: string | null
        }
        Insert: {
          application_link?: string | null
          country: string
          created_at?: string | null
          deadline?: Json | null
          degree_type: string
          department?: string | null
          description?: string | null
          duration?: string | null
          gpa_requirement?: number | null
          gre_required?: boolean | null
          id?: string
          language_requirement?: Json | null
          program_name: string
          program_name_cn?: string | null
          qs_ranking?: number | null
          required_materials?: string[] | null
          tags?: string[] | null
          tuition?: string | null
          university_name: string
          university_name_cn?: string | null
        }
        Update: {
          application_link?: string | null
          country?: string
          created_at?: string | null
          deadline?: Json | null
          degree_type?: string
          department?: string | null
          description?: string | null
          duration?: string | null
          gpa_requirement?: number | null
          gre_required?: boolean | null
          id?: string
          language_requirement?: Json | null
          program_name?: string
          program_name_cn?: string | null
          qs_ranking?: number | null
          required_materials?: string[] | null
          tags?: string[] | null
          tuition?: string | null
          university_name?: string
          university_name_cn?: string | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
A new version of Supabase CLI is available: v2.84.2 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
