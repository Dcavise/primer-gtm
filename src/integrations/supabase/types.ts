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
      real_estate_pipeline: {
        Row: {
          address: string | null
          ahj_building_records: string | null
          ahj_zoning_confirmation: string | null
          created_at: string
          fiber: string | null
          fire_sprinklers: string | null
          id: number
          lease_status: string | null
          ll_email: string | null
          ll_phone: string | null
          ll_poc: string | null
          loi_status: string | null
          market: string | null
          parking: string | null
          permitted_use: string | null
          phase: string | null
          sf_available: string | null
          site_name: string | null
          status_notes: string | null
          survey_status: string | null
          test_fit_status: string | null
          zoning: string | null
        }
        Insert: {
          address?: string | null
          ahj_building_records?: string | null
          ahj_zoning_confirmation?: string | null
          created_at?: string
          fiber?: string | null
          fire_sprinklers?: string | null
          id?: number
          lease_status?: string | null
          ll_email?: string | null
          ll_phone?: string | null
          ll_poc?: string | null
          loi_status?: string | null
          market?: string | null
          parking?: string | null
          permitted_use?: string | null
          phase?: string | null
          sf_available?: string | null
          site_name?: string | null
          status_notes?: string | null
          survey_status?: string | null
          test_fit_status?: string | null
          zoning?: string | null
        }
        Update: {
          address?: string | null
          ahj_building_records?: string | null
          ahj_zoning_confirmation?: string | null
          created_at?: string
          fiber?: string | null
          fire_sprinklers?: string | null
          id?: number
          lease_status?: string | null
          ll_email?: string | null
          ll_phone?: string | null
          ll_poc?: string | null
          loi_status?: string | null
          market?: string | null
          parking?: string | null
          permitted_use?: string | null
          phase?: string | null
          sf_available?: string | null
          site_name?: string | null
          status_notes?: string | null
          survey_status?: string | null
          test_fit_status?: string | null
          zoning?: string | null
        }
        Relationships: []
      }
      salesforce_leads: {
        Row: {
          campus_id: string | null
          converted: boolean | null
          converted_date: string | null
          converted_opportunity_id: string | null
          created_date: string | null
          first_name: string | null
          id: string
          last_name: string
          lead_id: string
          lead_source: string | null
          preferred_campus: string | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          converted?: boolean | null
          converted_date?: string | null
          converted_opportunity_id?: string | null
          created_date?: string | null
          first_name?: string | null
          id?: string
          last_name: string
          lead_id: string
          lead_source?: string | null
          preferred_campus?: string | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          converted?: boolean | null
          converted_date?: string | null
          converted_opportunity_id?: string | null
          created_date?: string | null
          first_name?: string | null
          id?: string
          last_name?: string
          lead_id?: string
          lead_source?: string | null
          preferred_campus?: string | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_salesforce_leads_campus"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["campus_id"]
          },
        ]
      }
      salesforce_opportunities: {
        Row: {
          campus_id: string | null
          close_date: string | null
          created_at: string
          id: string
          opportunity_id: string
          opportunity_name: string | null
          preferred_campus: string | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          campus_id?: string | null
          close_date?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          opportunity_name?: string | null
          preferred_campus?: string | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          campus_id?: string | null
          close_date?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          opportunity_name?: string | null
          preferred_campus?: string | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_salesforce_opportunities_campus"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["campus_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fetch_and_update_google_sheet_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
    }
    Enums: {
      [_ in never]: never
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
