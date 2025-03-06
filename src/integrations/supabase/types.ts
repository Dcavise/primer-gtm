export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      campuses: {
        Row: {
          campus_id: string
          campus_name: string
          created_at: string
          id: string
          State: string | null
          updated_at: string
        }
        Insert: {
          campus_id: string
          campus_name: string
          created_at?: string
          id?: string
          State?: string | null
          updated_at?: string
        }
        Update: {
          campus_id?: string
          campus_name?: string
          created_at?: string
          id?: string
          State?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comment_mentions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_mentions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "property_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_mentions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fellows: {
        Row: {
          campus: string | null
          campus_id: string | null
          cohort: number | null
          fellow_id: number | null
          fellow_name: string
          fte_employment_status: string | null
          grade_band: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          campus?: string | null
          campus_id?: string | null
          cohort?: number | null
          fellow_id?: number | null
          fellow_name: string
          fte_employment_status?: string | null
          grade_band?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          campus?: string | null
          campus_id?: string | null
          cohort?: number | null
          fellow_id?: number | null
          fellow_name?: string
          fte_employment_status?: string | null
          grade_band?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fellows_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["campus_id"]
          },
        ]
      }
      phase_options: {
        Row: {
          id: number
          phase_name: string
        }
        Insert: {
          id?: never
          phase_name: string
        }
        Update: {
          id?: never
          phase_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      property_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          property_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          property_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          property_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_file_metadata: {
        Row: {
          description: string | null
          display_name: string | null
          file_name: string
          file_path: string
          id: number
          property_id: number
          uploaded_at: string | null
        }
        Insert: {
          description?: string | null
          display_name?: string | null
          file_name: string
          file_path: string
          id?: number
          property_id: number
          uploaded_at?: string | null
        }
        Update: {
          description?: string | null
          display_name?: string | null
          file_name?: string
          file_path?: string
          id?: number
          property_id?: number
          uploaded_at?: string | null
        }
        Relationships: []
      }
      real_estate_pipeline: {
        Row: {
          address: string | null
          ahj_building_records: string | null
          ahj_zoning_confirmation:
            | Database["public"]["Enums"]["ahj_zoning_confirmation_status"]
            | null
          campus_id: string | null
          created_at: string
          fiber: Database["public"]["Enums"]["fiber_status"] | null
          fire_sprinklers:
            | Database["public"]["Enums"]["fire_sprinkler_status"]
            | null
          id: number
          lease_status: Database["public"]["Enums"]["lease_status_enum"] | null
          ll_email: string | null
          ll_phone: string | null
          ll_poc: string | null
          loi_status: Database["public"]["Enums"]["loi_status_enum"] | null
          market: string | null
          parking: string | null
          permitted_use: string | null
          phase: Database["public"]["Enums"]["property_phase"] | null
          phase_group: string | null
          sf_available: string | null
          site_name: string | null
          status_notes: string | null
          survey_status:
            | Database["public"]["Enums"]["survey_status_enum"]
            | null
          test_fit_status:
            | Database["public"]["Enums"]["test_fit_status_enum"]
            | null
          zoning: string | null
        }
        Insert: {
          address?: string | null
          ahj_building_records?: string | null
          ahj_zoning_confirmation?:
            | Database["public"]["Enums"]["ahj_zoning_confirmation_status"]
            | null
          campus_id?: string | null
          created_at?: string
          fiber?: Database["public"]["Enums"]["fiber_status"] | null
          fire_sprinklers?:
            | Database["public"]["Enums"]["fire_sprinkler_status"]
            | null
          id?: number
          lease_status?: Database["public"]["Enums"]["lease_status_enum"] | null
          ll_email?: string | null
          ll_phone?: string | null
          ll_poc?: string | null
          loi_status?: Database["public"]["Enums"]["loi_status_enum"] | null
          market?: string | null
          parking?: string | null
          permitted_use?: string | null
          phase?: Database["public"]["Enums"]["property_phase"] | null
          phase_group?: string | null
          sf_available?: string | null
          site_name?: string | null
          status_notes?: string | null
          survey_status?:
            | Database["public"]["Enums"]["survey_status_enum"]
            | null
          test_fit_status?:
            | Database["public"]["Enums"]["test_fit_status_enum"]
            | null
          zoning?: string | null
        }
        Update: {
          address?: string | null
          ahj_building_records?: string | null
          ahj_zoning_confirmation?:
            | Database["public"]["Enums"]["ahj_zoning_confirmation_status"]
            | null
          campus_id?: string | null
          created_at?: string
          fiber?: Database["public"]["Enums"]["fiber_status"] | null
          fire_sprinklers?:
            | Database["public"]["Enums"]["fire_sprinkler_status"]
            | null
          id?: number
          lease_status?: Database["public"]["Enums"]["lease_status_enum"] | null
          ll_email?: string | null
          ll_phone?: string | null
          ll_poc?: string | null
          loi_status?: Database["public"]["Enums"]["loi_status_enum"] | null
          market?: string | null
          parking?: string | null
          permitted_use?: string | null
          phase?: Database["public"]["Enums"]["property_phase"] | null
          phase_group?: string | null
          sf_available?: string | null
          site_name?: string | null
          status_notes?: string | null
          survey_status?:
            | Database["public"]["Enums"]["survey_status_enum"]
            | null
          test_fit_status?:
            | Database["public"]["Enums"]["test_fit_status_enum"]
            | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_real_estate_pipeline_campus"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["campus_id"]
          },
        ]
      }
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      conversion_by_campus: {
        Row: {
          campus_name: string | null
          conversion_rate: number | null
          converted_leads: number | null
          total_leads: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      airtable_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      airtable_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      auth0_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      auth0_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      big_query_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      big_query_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      click_house_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      click_house_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      cognito_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      cognito_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      fetch_and_update_google_sheet_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      firebase_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      firebase_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      get_campus_id_from_name: {
        Args: {
          p_preferred_campus: string
        }
        Returns: string
      }
      get_campuses_with_lead_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          campus_id: string
          campus_name: string
          state: string
          lead_count: number
        }[]
      }
      get_closed_won_by_campus: {
        Args: Record<PropertyKey, never>
        Returns: {
          campus_name: string
          state: string
          closed_won_count: number
          total_opportunities: number
          win_rate: number
        }[]
      }
      get_daily_lead_count: {
        Args: {
          p_days?: number
          p_campus_id?: string
        }
        Returns: {
          date: string
          count: number
        }[]
      }
      get_monthly_lead_trends: {
        Args: {
          start_date: string
          end_date: string
          p_campus_id?: string
        }
        Returns: {
          month: string
          lead_count: number
          conversion_count: number
          conversion_rate: number
        }[]
      }
      get_opportunities_by_stage_campus: {
        Args: Record<PropertyKey, never>
        Returns: {
          stage_name: string
          campus_name: string
          state: string
          count: number
          percentage: number
        }[]
      }
      get_week_over_week_comparison: {
        Args: {
          p_campus_id?: string
        }
        Returns: {
          metric: string
          current_week: number
          previous_week: number
          change_percentage: number
        }[]
      }
      get_weekly_lead_counts: {
        Args: {
          start_date: string
          end_date: string
          campus_filter?: string
        }
        Returns: {
          week: string
          lead_count: number
        }[]
      }
      get_weekly_lead_trends:
        | {
            Args: {
              p_weeks?: number
              p_campus_id?: string
            }
            Returns: {
              week_start: string
              lead_count: number
              conversion_count: number
              conversion_rate: number
              previous_week_count: number
              weekly_growth_percentage: number
            }[]
          }
        | {
            Args: {
              start_date: string
              end_date: string
            }
            Returns: {
              week_start: string
              campus_name: string
              lead_count: number
              conversion_count: number
              conversion_rate: number
            }[]
          }
      hello_world_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      hello_world_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      logflare_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      logflare_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      mssql_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      mssql_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      redis_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      redis_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      s3_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      s3_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      stripe_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      stripe_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      wasm_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      wasm_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
    }
    Enums: {
      ahj_zoning_confirmation_status: "true" | "false" | "unknown"
      fiber_status: "true" | "false" | "unknown"
      fire_sprinkler_status: "true" | "false" | "unknown"
      lease_status_enum: "pending" | "sent" | "signed"
      loi_status_enum: "pending" | "sent" | "signed"
      property_phase:
        | "0. New Site"
        | "1. Initial Diligence"
        | "2. Survey"
        | "3. Test Fit"
        | "4. Plan Production"
        | "5. Permitting"
        | "6. Construction"
        | "7. Set Up"
        | "Hold"
        | "Deprioritize"
      survey_status_enum: "complete" | "pending" | "unknown"
      test_fit_status_enum: "unknown" | "pending" | "complete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
