import { useState, useCallback } from "react";
import { supabase, SupabaseUnifiedClient } from "@/integrations/supabase-client";

// Define the types for family records
export interface FamilyRecord {
  family_id: string;
  family_name: string;
  pdc_family_id_c: string;
  current_campus_c: string;
  current_campus_name?: string; // Added campus name field
  contact_ids: string[];
  contact_first_names: string[];
  contact_last_names: string[];
  contact_phones: string[];
  contact_emails: string[];
  contact_last_activity_dates: string[];
  opportunity_ids: string[];
  opportunity_names: string[];
  opportunity_stages: string[];
  opportunity_grades: string[];
  opportunity_campuses: string[];
  opportunity_campus_names?: string[]; // Added campus names array
  opportunity_lead_notes: string[];
  opportunity_family_interview_notes: string[];
  opportunity_created_dates: string[];
  opportunity_record_types?: string[]; // Added record types field
  opportunity_school_years?: string[]; // School years for each opportunity
  opportunity_is_won?: boolean[]; // Whether each opportunity is won (Closed Won)
  tuition_offer_ids: string[];
  tuition_offer_statuses: string[];
  tuition_offer_family_contributions: number[];
  tuition_offer_state_scholarships: number[];
  contact_count: number;
  opportunity_count: number;
  tuition_offer_count: number;
  lifetime_value?: number; // Added lifetime value based on accepted tuition offers
}

// Define the type for family search results with standardized IDs
export interface FamilySearchResult {
  // The fields below may not be in results from older functions
  // but would be added by our new standardized search function
  standard_id?: string;
  family_id: string; // This is the only guaranteed ID field
  alternate_id?: string; // This is the pdc_family_id_c in the original data

  family_name: string;
  current_campus_c: string;
  contact_count: number;
  opportunity_count: number;
  opportunity_is_won_flags?: boolean[]; // Array of booleans indicating if any opportunity is won
  opportunity_school_years?: string[]; // Array of school years for opportunities
  opportunity_campuses?: string[]; // Array of campuses for opportunities
  opportunity_stages?: string[]; // Array of stages for opportunities
}

// Define the return type for the hook
interface UseFamilyDataReturn {
  loading: boolean;
  error: string | null;
  familyRecord: FamilyRecord | null;
  searchResults: FamilySearchResult[];
  fetchFamilyRecord: (familyId: string) => Promise<void>;
  searchFamilies: (searchTerm: string) => Promise<void>;
}

/**
 * Hook for managing family data retrieval operations
 * Uses the fivetran_views schema functions for data access
 */
export const useFamilyData = (): UseFamilyDataReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [familyRecord, setFamilyRecord] = useState<FamilyRecord | null>(null);
  const [searchResults, setSearchResults] = useState<FamilySearchResult[]>([]);

  /**
   * Fetch a single family record by ID
   * Uses the improved getFamilyRecord method from the Supabase client
   */
  const fetchFamilyRecord = useCallback(async (familyId: string) => {
    if (!familyId) {
      setError("No family ID provided");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`useFamilyData: Fetching family record for ID: ${familyId}`);

      // Try to normalize the ID to improve search success
      const normalizedId = familyId.trim();

      // Check if this might be a truncated ID (common in URLs)
      if (normalizedId.length < 18 && normalizedId.length > 10) {
        console.log(
          `useFamilyData: ID appears to be truncated (length ${normalizedId.length}), will use partial matching`
        );
      }

      console.log(`useFamilyData: Using normalized ID: ${normalizedId}`);

      // Use our improved getFamilyRecord method that queries the comprehensive_family_records table
      // from the fivetran_views schema as mentioned in the documentation
      const { success, data, error } = await (supabase as SupabaseUnifiedClient).getFamilyRecord(
        normalizedId
      );

      if (!success || error) {
        console.warn("useFamilyData: Failed to fetch family record:", error);
        throw new Error(typeof error === "string" ? error : "Failed to fetch family data");
      }

      if (!data) {
        console.error(`useFamilyData: Family with ID ${normalizedId} not found`);
        setError(`Family with ID ${normalizedId} not found in the database. Please verify the ID.`);
        setFamilyRecord(null);
      } else {
        // Cast to FamilyRecord type
        setFamilyRecord(data as unknown as FamilyRecord);
        console.log(
          "useFamilyData: Successfully fetched family record with fields:",
          Object.keys(data).join(", ")
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error fetching family data: ${errorMessage}`);
      console.error("useFamilyData: Error fetching family data:", err);

      // Add more detailed logging for troubleshooting
      if (err instanceof Error && err.stack) {
        console.error("Stack trace:", err.stack);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search for families based on a search term
   * Uses the improved searchFamilies method in the Supabase client
   * which properly handles schema references and provides fallback options
   */
  const searchFamilies = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Searching for families with term: "${searchTerm}" (useFamilyData)`);

      // Use the improved searchFamilies method from our Supabase client
      const { success, data, error } = await (supabase as SupabaseUnifiedClient).searchFamilies(
        searchTerm
      );

      if (!success || error) {
        console.warn("Search failed in useFamilyData hook:", error);
        throw new Error(typeof error === "string" ? error : "Search failed");
      }

      // Type guard to properly access array length and ensure proper typing
      const resultCount = Array.isArray(data) ? data.length : 0;
      console.log(`Found ${resultCount} family results`);

      // Process the data to ensure ID fields are properly set
      if (Array.isArray(data)) {
        const processedResults = data.map((family) => {
          // Log all IDs for debugging - only include properties from FamilySearchResult interface
          console.log("Family search result with IDs:", {
            family_id: family.family_id,
            standard_id: family.standard_id || null,
            alternate_id: family.alternate_id || null,
          });

          return family as FamilySearchResult;
        });

        setSearchResults(processedResults);
      } else {
        // If data is not an array, set an empty array
        setSearchResults([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      // Create a more detailed error message including all available information
      const detailedError =
        typeof err === "object"
          ? JSON.stringify(err, Object.getOwnPropertyNames(err))
          : String(err);

      setError(`Error searching families: ${errorMessage}`);
      console.error("Error fetching family data:", detailedError);
      console.error("Search term was:", searchTerm);

      // Log the stack trace if available
      if (err instanceof Error && err.stack) {
        console.error("Stack trace:", err.stack);
      }

      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    familyRecord,
    searchResults,
    fetchFamilyRecord,
    searchFamilies,
  };
};

export default useFamilyData;
