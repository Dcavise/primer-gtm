// Temporary solution until proper types are created
type Database = any;

export type FivetranViewsSchema = {
  Tables: {
    mv_comprehensive_family_records: {
      Row: {
        family_id: string;
        family_name: string;
        pdc_family_id_c: string | null;
        current_campus_c: string | null;
        contact_ids: string[] | null;
        contact_first_names: string[] | null;
        contact_last_names: string[] | null;
        contact_phones: string[] | null;
        contact_emails: string[] | null;
        contact_last_activity_dates: string[] | null;
        opportunity_ids: string[] | null;
        opportunity_record_types: string[] | null;
        opportunity_names: string[] | null;
        opportunity_stages: string[] | null;
        opportunity_is_won_flags: boolean[] | null;
        opportunity_created_dates: string[] | null;
        opportunity_last_stage_change_dates: string[] | null;
        opportunity_lead_notes: string[] | null;
        opportunity_family_interview_notes: string[] | null;
        opportunity_preferred_campuses: string[] | null;
        opportunity_family_last_names: string[] | null;
        opportunity_pdc_user_ids: string[] | null;
        opportunity_grades: string[] | null;
        opportunity_pdc_profile_urls: string[] | null;
        opportunity_campuses: string[] | null;
        opportunity_actualized_financial_aids: number[] | null;
        tuition_offer_ids: string[] | null;
        tuition_offer_created_dates: string[] | null;
        tuition_offer_accepted_dates: string[] | null;
        tuition_offer_enrollment_fees: number[] | null;
        tuition_offer_family_contributions: number[] | null;
        tuition_offer_statuses: string[] | null;
        tuition_offer_start_dates: string[] | null;
        tuition_offer_state_scholarships: number[] | null;
        tuition_offer_last_viewed_dates: string[] | null;
        contact_count: number;
        opportunity_count: number;
        student_count: number | null;
        tuition_offer_count: number | null;
        latest_opportunity_date: string | null;
        latest_contact_activity_date: string | null;
        latest_tuition_offer_date: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "family_records_current_campus_c_fkey";
          columns: ["current_campus_c"];
          isOneToOne: false;
          referencedRelation: "campus_c";
          referencedColumns: ["id"];
        }
      ];
    };
    mv_total_enrolled_by_campus: {
      Row: {
        campus_name: string;
        total_enrolled: number;
      };
      Relationships: [];
    };
    mv_combined_arr_metrics: {
      Row: {
        date: string;
        metric_type: string;
        value: number;
        campus_id: string | null;
        period: string;
      };
      Relationships: [];
    };
    mv_combined_lead_metrics: {
      Row: {
        date: string;
        metric_type: string;
        value: number;
        campus_id: string | null;
        period: string;
      };
      Relationships: [];
    };
    // Add other fivetran_views tables you use frequently
    derived_students: {
      Row: {
        id: string;
        family_id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        grade: string | null;
        created_at: string;
        updated_at: string;
        campus_id: string | null;
        status: string | null;
      };
      Relationships: [
        {
          foreignKeyName: "derived_students_family_id_fkey";
          columns: ["family_id"];
          isOneToOne: false;
          referencedRelation: "account";
          referencedColumns: ["id"];
        },
        {
          foreignKeyName: "derived_students_campus_id_fkey";
          columns: ["campus_id"];
          isOneToOne: false;
          referencedRelation: "campus_c";
          referencedColumns: ["id"];
        }
      ];
    };
  };
  Functions: {
    search_families: {
      Args: {
        search_term: string;
      };
      Returns: Record<string, unknown>[];
    };
    search_families_consistent: {
      Args: {
        search_term: string;
      };
      Returns: Record<string, unknown>[];
    };
    get_enhanced_family_record: {
      Args: {
        family_id_param: string;
      };
      Returns: Record<string, unknown>;
    };
    get_distinct_fellow_stages: {
      Args: Record<string, never>;
      Returns: string[];
    };
    get_all_families: {
      Args: Record<string, never>;
      Returns: Record<string, unknown>[];
    };
    refresh_materialized_views: {
      Args: Record<string, never>;
      Returns: undefined;
    };
    optimize_database: {
      Args: Record<string, never>;
      Returns: undefined;
    };
  };
};

// Update the Database type to include fivetran_views
export type ExtendedDatabase = {
  public: Database['public'];
  fivetran_views: FivetranViewsSchema;
};
