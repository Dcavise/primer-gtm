import { useState, useCallback } from "react";
import { getEnhancedFamilyRecord } from "@/integrations/supabase-client";

// Define types for the enhanced family record structure
export interface StudentOpportunity {
  id: string;
  name: string;
  stage: string;
  // stage_name is removed since it doesn't exist in the database
  school_year: string;
  is_won: boolean;
  created_date: string;
  record_type_id: string;
  campus: string;
  // campus_name is removed since it doesn't exist in the database
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
  opportunity_is_won?: boolean[]; // This should match opportunity_is_won_flags in the database
}

interface UseEnhancedFamilyDataReturn {
  loading: boolean;
  error: string | null;
  familyRecord: EnhancedFamilyRecord | null;
  fetchFamilyRecord: (familyId: string) => Promise<void>;
}

/**
 * Transform raw family data from API into the expected structured format
 */
const transformRawFamilyData = (rawData: any): EnhancedFamilyRecord => {
  console.log("Transforming raw family data:", {
    hasOpportunityNames: Boolean(rawData.opportunity_names),
    opportunityNamesLength: Array.isArray(rawData.opportunity_names)
      ? rawData.opportunity_names.length
      : 0,
    hasOpportunityIds: Boolean(rawData.opportunity_ids),
  });

  // Extract student information from opportunity data
  const studentsMap = new Map<string, Student>();

  // Debug raw opportunity data
  console.log('Raw opportunity data:', {
    opportunity_ids: rawData.opportunity_ids || [],
    opportunity_stages: rawData.opportunity_stages || [],
  });

  // Only process if we have arrays to work with
  if (
    Array.isArray(rawData.opportunity_names) &&
    Array.isArray(rawData.opportunity_ids) &&
    rawData.opportunity_names.length > 0
  ) {
    // Loop through opportunities to build student records
    for (let i = 0; i < rawData.opportunity_names.length; i++) {
      const oppName = rawData.opportunity_names[i];
      if (!oppName) continue;

      // Extract student name from opportunity name (e.g., "Ivana Buritica - G1 - Y24/25")
      const studentNamePart = oppName.split(" - ")[0];
      const nameParts = studentNamePart.split(" ");

      if (nameParts.length < 2) continue;

      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");
      const fullName = `${firstName} ${lastName}`;
      const studentKey = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;

      console.log(`Extracted student: ${firstName} ${lastName} from opportunity: ${oppName}`);

      // Create or update student record
      if (!studentsMap.has(studentKey)) {
        studentsMap.set(studentKey, {
          id: `student-${i}`, // Generate an ID
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          opportunities: [],
        });
      }

      // Add opportunity to this student
      const student = studentsMap.get(studentKey);

      // Get is_won value and add debug info
      const rawIsWon = Array.isArray(rawData.opportunity_is_won_flags) && i < rawData.opportunity_is_won_flags.length 
        ? rawData.opportunity_is_won_flags[i] 
        : null;
      const isWon = Boolean(rawIsWon);
      
      console.log(`Processing opportunity ${i} (${oppName}): raw is_won=${rawIsWon}, converted is_won=${isWon}`);
      
      // Create opportunity object with proper null checks
      const opportunity: StudentOpportunity = {
        id: Array.isArray(rawData.opportunity_ids) && i < rawData.opportunity_ids.length 
          ? rawData.opportunity_ids[i] || `opp-${i}` 
          : `opp-${i}`,
        name: oppName,
        stage: Array.isArray(rawData.opportunity_stages) && i < rawData.opportunity_stages.length 
          ? rawData.opportunity_stages[i] || "" 
          : "",
        school_year: Array.isArray(rawData.opportunity_school_years) && i < rawData.opportunity_school_years.length
          ? rawData.opportunity_school_years[i] || ""
          : "",
        is_won: isWon,
        created_date: Array.isArray(rawData.opportunity_created_dates) && i < rawData.opportunity_created_dates.length
          ? rawData.opportunity_created_dates[i] || new Date().toISOString()
          : new Date().toISOString(),
        record_type_id: Array.isArray(rawData.opportunity_record_types) && i < rawData.opportunity_record_types.length
          ? rawData.opportunity_record_types[i] || ""
          : "",
        campus: Array.isArray(rawData.opportunity_campuses) && i < rawData.opportunity_campuses.length
          ? rawData.opportunity_campuses[i] || ""
          : "",
        grade: Array.isArray(rawData.opportunity_grades) && i < rawData.opportunity_grades.length 
          ? rawData.opportunity_grades[i] || "" 
          : "",
        lead_notes: Array.isArray(rawData.opportunity_lead_notes) && i < rawData.opportunity_lead_notes.length
          ? rawData.opportunity_lead_notes[i] || ""
          : "",
        family_interview_notes: Array.isArray(rawData.opportunity_family_interview_notes) && i < rawData.opportunity_family_interview_notes.length
          ? rawData.opportunity_family_interview_notes[i] || ""
          : "",
      };

      console.log('Processing opportunity stages:', {
        index: i,
        opportunity_id: rawData.opportunity_ids?.[i],
        stage: rawData.opportunity_stages?.[i],
        hasStagesArray: Array.isArray(rawData.opportunity_stages),
        stagesLength: rawData.opportunity_stages?.length
      });

      student.opportunities.push(opportunity);
    }
  }

  // Create contacts array with better null checking
  const contacts: Contact[] = [];
  if (Array.isArray(rawData.contact_ids)) {
    for (let i = 0; i < rawData.contact_ids.length; i++) {
      contacts.push({
        id: rawData.contact_ids[i] || `contact-${i}`,
        first_name: Array.isArray(rawData.contact_first_names) && i < rawData.contact_first_names.length
          ? rawData.contact_first_names[i] || ""
          : "",
        last_name: Array.isArray(rawData.contact_last_names) && i < rawData.contact_last_names.length
          ? rawData.contact_last_names[i] || ""
          : "",
        email: Array.isArray(rawData.contact_emails) && i < rawData.contact_emails.length
          ? rawData.contact_emails[i] || ""
          : "",
        phone: Array.isArray(rawData.contact_phones) && i < rawData.contact_phones.length
          ? rawData.contact_phones[i] || ""
          : "",
        last_activity_date: Array.isArray(rawData.contact_last_activity_dates) && i < rawData.contact_last_activity_dates.length
          ? rawData.contact_last_activity_dates[i] || ""
          : "",
      });
    }
  }

  const students = Array.from(studentsMap.values());
  console.log(`Transformed ${students.length} students with opportunities from raw data`);

  // Return transformed record with better null checking
  return {
    family_id: rawData.family_id || "",
    family_name: rawData.family_name || "",
    pdc_family_id_c: rawData.pdc_family_id_c || "",
    current_campus_c: rawData.current_campus_c || "",
    current_campus_name: rawData.current_campus_name || "",
    contacts: contacts,
    students: students,
    contact_count: rawData.contact_count || contacts.length || 0,
    opportunity_count: rawData.opportunity_count || 0,
    student_count: studentsMap.size || 0,
    lifetime_value: rawData.lifetime_value || 0,
    // Legacy fields
    opportunity_ids: rawData.opportunity_ids || [],
    opportunity_names: rawData.opportunity_names || [],
    opportunity_stages: rawData.opportunity_stages || [],
    opportunity_school_years: rawData.opportunity_school_years || [],
    opportunity_is_won: rawData.opportunity_is_won_flags || [], // Use the correct field name
  };
};

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
        // Transform the raw data into the expected structure
        const transformedData = transformRawFamilyData(data);
        setFamilyRecord(transformedData);
        console.log("useEnhancedFamilyData: Successfully fetched and transformed family record");
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
    fetchFamilyRecord,
  };
};

export default useEnhancedFamilyData;
