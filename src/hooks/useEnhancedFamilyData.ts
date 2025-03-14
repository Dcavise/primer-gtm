import { useState, useCallback } from "react";
// Import mock data instead of using Supabase

// Define types for the enhanced family record structure
export interface StudentOpportunity {
  id: string;
  name: string;
  stage: string;
  stage_name?: string; // Added back for backwards compatibility
  school_year: string;
  is_won: boolean;
  created_date: string;
  record_type_id: string;
  campus: string;
  campus_name?: string; // Added back for backwards compatibility
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

// Generate realistic mock family data
const generateMockFamilyData = (familyId: string): EnhancedFamilyRecord => {
  // Use familyId to create deterministic mock data
  const familyIdSuffix = familyId.slice(-4);
  const familyIdNum = parseInt(familyIdSuffix, 16) || 1000;
  
  // Family last names - use deterministic selection based on familyId
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Martinez"];
  const familyLastName = lastNames[familyIdNum % lastNames.length];
  
  // Campus names - use deterministic selection based on familyId
  const campusNames = ["Atlanta", "Miami", "New York", "Birmingham", "Chicago"];
  const campusIndex = (familyIdNum % campusNames.length);
  const campusName = campusNames[campusIndex];
  
  // Generate 1 or 2 students with realistic data
  const studentCount = (familyIdNum % 3) + 1; // 1-3 students
  const students: Student[] = [];
  
  // First names for students - use deterministic selection
  const firstNames = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Elijah", "Charlotte", "William", 
    "Sophia", "James", "Amelia", "Benjamin", "Isabella", "Lucas", "Mia", "Henry"
  ];
  
  // Generate school years
  const schoolYears = ["23/24", "24/25", "25/26"];
  
  // Generate grades based on student age
  const grades = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];
  
  // Generate opportunity stages with probabilities
  const opportunityStages = [
    { name: "Closed Won", probability: 0.4 },
    { name: "Family Interview", probability: 0.2 },
    { name: "Application", probability: 0.2 },
    { name: "Education Review", probability: 0.1 },
    { name: "Admission Offered", probability: 0.1 }
  ];
  
  // Create students with opportunities
  for (let i = 0; i < studentCount; i++) {
    const studentFirstName = firstNames[(familyIdNum + i) % firstNames.length];
    const fullName = `${studentFirstName} ${familyLastName}`;
    
    // Determine number of opportunities for this student (1-3)
    const opportunityCount = Math.min(3, Math.max(1, Math.floor(familyIdNum % 4)));
    const studentOpportunities: StudentOpportunity[] = [];
    
    // Generate opportunities for this student
    for (let j = 0; j < opportunityCount; j++) {
      // Use deterministic selection for realistic progression
      const schoolYearIndex = Math.min(schoolYears.length - 1, j);
      const schoolYear = schoolYears[schoolYearIndex];
      
      // Determine grade based on school year and student
      const gradeOffset = (i % 3) + j;
      const grade = grades[gradeOffset % grades.length];
      
      // Determine stage probabilistically but deterministically
      let stageIndex = 0;
      const stageRandom = ((familyIdNum + i + j) % 100) / 100;
      let cumulativeProbability = 0;
      
      for (let k = 0; k < opportunityStages.length; k++) {
        cumulativeProbability += opportunityStages[k].probability;
        if (stageRandom <= cumulativeProbability) {
          stageIndex = k;
          break;
        }
      }
      
      const stage = opportunityStages[stageIndex].name;
      const isWon = stage === "Closed Won";
      
      // Create created date based on school year
      const yearOffset = parseInt(schoolYear.split('/')[0]) - 23; // Assuming 23/24 is the first year
      const createdDate = new Date();
      createdDate.setFullYear(createdDate.getFullYear() - (2 - yearOffset));
      createdDate.setMonth(createdDate.getMonth() - (j * 2));
      
      // Add the opportunity
      studentOpportunities.push({
        id: `opp-${familyId}-${i}-${j}`,
        name: `${studentFirstName} ${familyLastName} - G${grade} - ${schoolYear}`,
        stage: stage,
        stage_name: stage, // For backward compatibility
        school_year: schoolYear,
        is_won: isWon,
        created_date: createdDate.toISOString(),
        record_type_id: "012UH0000000VAkYAM", // A realistic format for Salesforce record type ID
        campus: `campus-${campusIndex}`,
        campus_name: campusName,
        grade: grade,
        lead_notes: j === 0 ? `Initial inquiry for ${studentFirstName}` : "",
        family_interview_notes: j === 1 ? `Family interview completed for ${schoolYear}` : ""
      });
    }
    
    // Add the student with their opportunities
    students.push({
      id: `student-${familyId}-${i}`,
      first_name: studentFirstName,
      last_name: familyLastName,
      full_name: fullName,
      opportunities: studentOpportunities
    });
  }
  
  // Create 1 or 2 parent contacts
  const parentCount = 1 + (familyIdNum % 2); // 1-2 parents
  const contacts: Contact[] = [];
  
  // Parent first names
  const parentFirstNames = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
    "William", "Elizabeth", "David", "Susan", "Richard", "Jessica", "Joseph", "Sarah"
  ];
  
  for (let i = 0; i < parentCount; i++) {
    const parentFirstName = parentFirstNames[(familyIdNum + i) % parentFirstNames.length];
    
    // Create a last activity date within the last 30 days
    const lastActivityDate = new Date();
    lastActivityDate.setDate(lastActivityDate.getDate() - (familyIdNum + i) % 30);
    
    contacts.push({
      id: `contact-${familyId}-${i}`,
      first_name: parentFirstName,
      last_name: familyLastName,
      email: `${parentFirstName.toLowerCase()}.${familyLastName.toLowerCase()}@example.com`,
      phone: `(${100 + (familyIdNum % 900)}) ${200 + (familyIdNum % 700)}-${1000 + (familyIdNum % 9000)}`,
      last_activity_date: lastActivityDate.toISOString()
    });
  }
  
  // Calculate total opportunity count across all students
  const totalOpportunityCount = students.reduce((sum, student) => sum + student.opportunities.length, 0);
  
  // Calculate a realistic lifetime value
  const lifetimeValue = students.reduce((sum, student) => {
    return sum + student.opportunities.reduce((oppSum, opp) => {
      // Only count closed won opportunities
      if (opp.is_won) {
        // Base tuition varies by campus
        const baseTuition = 15000 + (campusIndex * 1000);
        
        // Calculate full tuition based on grade
        const gradeMultiplier = opp.grade ? Math.min(8, Math.max(0, parseInt(opp.grade) || 0)) * 0.05 + 1 : 1;
        
        return oppSum + (baseTuition * gradeMultiplier);
      }
      return oppSum;
    }, 0);
  }, 0);
  
  // Compile legacy fields for backward compatibility
  const opportunityIds: string[] = [];
  const opportunityNames: string[] = [];
  const opportunityStagesList: string[] = [];
  const opportunitySchoolYears: string[] = [];
  const opportunityIsWon: boolean[] = [];
  
  students.forEach(student => {
    student.opportunities.forEach(opp => {
      opportunityIds.push(opp.id);
      opportunityNames.push(opp.name);
      opportunityStagesList.push(opp.stage);
      opportunitySchoolYears.push(opp.school_year);
      opportunityIsWon.push(opp.is_won);
    });
  });
  
  // Return the complete mock family record
  return {
    family_id: familyId,
    family_name: `${familyLastName} Family`,
    pdc_family_id_c: `pdc-${familyId}`,
    current_campus_c: `campus-${campusIndex}`,
    current_campus_name: campusName,
    contacts: contacts,
    students: students,
    contact_count: contacts.length,
    opportunity_count: totalOpportunityCount,
    student_count: students.length,
    lifetime_value: lifetimeValue,
    // Legacy fields
    opportunity_ids: opportunityIds,
    opportunity_names: opportunityNames,
    opportunity_stages: opportunityStagesList,
    opportunity_school_years: opportunitySchoolYears,
    opportunity_is_won: opportunityIsWon
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
      
      // Simulate a short delay for the network request
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate mock data for this family ID
      const mockFamilyData = generateMockFamilyData(normalizedId);
      
      // Set the family record
      setFamilyRecord(mockFamilyData);
      console.log("useEnhancedFamilyData: Successfully generated mock family record");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Error fetching family data: ${errorMessage}`);
      console.error("useEnhancedFamilyData: Error generating mock family data:", err);
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