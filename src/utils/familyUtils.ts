/**
 * Utility functions for handling family data in the Primer GTM application
 */

/**
 * Format school year for display (e.g., "2024-2025" -> "24/25")
 * @param schoolYear The school year string to format
 * @returns Formatted school year string
 */
export const formatSchoolYearForDisplay = (schoolYear: string | undefined): string => {
  if (!schoolYear) return "";

  // Already in short format like "24/25"
  if (/^\d{2}\/\d{2}$/.test(schoolYear)) {
    return schoolYear;
  }

  // Format like "Y24/25"
  const yearPatternShort = /Y(\d{2})\/(\d{2})/;
  let match = schoolYear.match(yearPatternShort);
  if (match && match.length >= 3) {
    return `${match[1]}/${match[2]}`;
  }

  // Format like "2024-2025"
  const yearPatternLong = /(\d{4})[^\d](\d{4})/;
  match = schoolYear.match(yearPatternLong);
  if (match && match.length >= 3) {
    return `${match[1].slice(-2)}/${match[2].slice(-2)}`;
  }

  // If we can't parse it, return as is
  return schoolYear;
};

/**
 * Check if a family has an open opportunity for 25/26 school year
 * in the stages: "Family Interview", "Awaiting Documents", "Admission Offered", or "Education Review"
 * 
 * @param familyRecord The family record object to check
 * @returns Boolean indicating if the family has an open opportunity
 */
export const hasFamilyOpenOpportunity = (familyRecord: any): boolean => {
  // Define the target stages and school year
  const targetStages = ["Family Interview", "Awaiting Documents", "Admission Offered", "Education Review"];
  const targetSchoolYear = "25/26";
  
  // First check the structured student opportunities if available
  if (familyRecord?.students?.length > 0) {
    for (const student of familyRecord.students) {
      if (student.opportunities?.length > 0) {
        for (const opportunity of student.opportunities) {
          const formattedSchoolYear = formatSchoolYearForDisplay(opportunity.school_year);
          const normalizedStage = opportunity.stage?.trim() || "";
          
          if (formattedSchoolYear === targetSchoolYear && targetStages.includes(normalizedStage)) {
            return true;
          }
        }
      }
    }
  }
  
  // Also check legacy arrays for backward compatibility
  if (
    Array.isArray(familyRecord?.opportunity_stages) && 
    Array.isArray(familyRecord?.opportunity_school_years) && 
    familyRecord.opportunity_stages.length === familyRecord.opportunity_school_years.length
  ) {
    for (let i = 0; i < familyRecord.opportunity_stages.length; i++) {
      const stage = familyRecord.opportunity_stages[i]?.trim() || "";
      const schoolYear = formatSchoolYearForDisplay(familyRecord.opportunity_school_years[i] || "");
      
      if (targetStages.includes(stage) && schoolYear === targetSchoolYear) {
        return true;
      }
    }
  }
  
  return false;
};
