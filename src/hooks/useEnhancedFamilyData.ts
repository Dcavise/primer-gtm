import { useState, useCallback } from "react";
import { getEnhancedFamilyRecord } from "@/integrations/supabase-client";

// Define types for the enhanced family record structure
export interface StudentOpportunity {
  id: string;
  name: string;
  stage: string;
  school_year: string;
  is_won: boolean;
  created_date: string;
  record_type_id: string;
  campus: string;
  campus_name?: string;
  grade?: string;
  lead_notes?: string;
  family_interview_notes?: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  opportunities: StudentOpportunity[];
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  last_activity_date: string;
}

export interface EnhancedFamilyRecord {
  family_id: string;
  family_name: string;
  pdc_family_id_c: string;
  current_campus_c: string;
  current_campus_name: string;
  contacts: Contact[];
  students: Student[];
  contact_count: number;
  opportunity_count: number;
  student_count: number;
  lifetime_value?: number; // Added lifetime value based on accepted tuition offers
  is_minimal_record?: boolean;
  // Legacy fields for backward compatibility
  opportunity_ids?: string[];
  opportunity_names?: string[];
  opportunity_stages?: string[];
  opportunity_school_years?: string[];
  opportunity_is_won?: boolean[];
}

interface UseEnhancedFamilyDataReturn {
  loading: boolean;
  error: string | null;
  familyRecord: EnhancedFamilyRecord | null;
  fetchFamilyRecord: (familyId: string) => Promise<void>;
}

export const useEnhancedFamilyData = (): UseEnhancedFamilyDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familyRecord, setFamilyRecord] = useState<EnhancedFamilyRecord | null>(null);
  
  const fetchFamilyRecord = useCallback(async (familyId: string) => {
    if (!familyId) {
      setError("No family ID provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`useEnhancedFamilyData: Fetching family record for ID: ${familyId}`);
      
      const normalizedId = familyId.trim();
      
      const { success, data, error } = await getEnhancedFamilyRecord(normalizedId);

      if (!success || error) {
        console.warn("useEnhancedFamilyData: Failed to fetch family record:", error);
        throw new Error(typeof error === "string" ? error : "Failed to fetch family data");
      }

      if (!data) {
        console.error(`useEnhancedFamilyData: Family with ID ${normalizedId} not found`);
        setError(`Family with ID ${normalizedId} not found in the database. Please verify the ID.`);
        setFamilyRecord(null);
      } else {
        // Cast to EnhancedFamilyRecord type
        setFamilyRecord(data as unknown as EnhancedFamilyRecord);
        console.log("useEnhancedFamilyData: Successfully fetched family record");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error fetching family data: ${errorMessage}`);
      console.error("useEnhancedFamilyData: Error fetching family data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    familyRecord,
    fetchFamilyRecord
  };
};

export default useEnhancedFamilyData;