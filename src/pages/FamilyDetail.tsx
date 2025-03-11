import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFamilyData } from "@/hooks/useFamilyData";
import { metricCard, metricValue, metricLabel, metricDescription } from "@/components/ui/metric-card-variants";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  UserIcon,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  Building,
  GraduationCap,
  Circle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

// Importing the FamilyRecord type from our hook

/**
 * Extract student name from opportunity name
 *
 * Examples:
 * "Cameron Abreu - G0 - Y23/24" -> "Cameron Abreu"
 * "Jacobo Buritica - G4 - Y25/26 - R" -> "Jacobo Buritica"
 */
const extractStudentName = (opportunityName: string): string => {
  if (!opportunityName) return "Unknown Student";

  // Student name is everything before the first ' - ' in the opportunity name
  const parts = opportunityName.split(" - ");
  return parts[0] || "Unknown Student";
};

/**
 * Extract school year from opportunity name or school_year_c field
 *
 * Examples:
 * - "Y23/24" from "Cameron Abreu - G0 - Y23/24"
 * - "2023-2024" from school_year_c field
 */
/**
 * Extract school year from opportunity name or school_year_c field
 * and return in the standard format (YYYY-YYYY)
 */
const extractSchoolYear = (
  opportunityName: string,
  schoolYearField?: string,
): string => {
  // First try to use the school_year_c field if available
  if (schoolYearField) {
    return formatSchoolYear(schoolYearField);
  }

  // Otherwise try to extract from the opportunity name
  if (!opportunityName) return "";

  // Look for patterns like "Y23/24"
  const yearPattern = /Y(\d{2})\/(\d{2})/;
  const match = opportunityName.match(yearPattern);

  if (match && match.length >= 3) {
    const startYear = `20${match[1]}`;
    const endYear = `20${match[2]}`;
    return `${startYear}-${endYear}`;
  }

  return "";
};

/**
 * Format school year consistently regardless of input format
 * Converts various formats to a standardized display format
 */
const formatSchoolYearForDisplay = (schoolYear: string | undefined): string => {
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
 * Standardize school year to YYYY-YYYY format for internal use
 */
const formatSchoolYear = (schoolYear: string | undefined): string => {
  if (!schoolYear) return "";
  
  // Already in full format like "2024-2025"
  if (/^\d{4}[^\d]\d{4}$/.test(schoolYear)) {
    return schoolYear;
  }
  
  // Format like "24/25"
  const shortYearPattern = /^(\d{2})\/(\d{2})$/;
  let match = schoolYear.match(shortYearPattern);
  if (match && match.length >= 3) {
    return `20${match[1]}-20${match[2]}`;
  }
  
  // Format like "Y24/25"
  const yearPatternWithY = /Y(\d{2})\/(\d{2})/;
  match = schoolYear.match(yearPatternWithY);
  if (match && match.length >= 3) {
    return `20${match[1]}-20${match[2]}`;
  }
  
  // If we can't parse it, return as is
  return schoolYear;
};

/**
 * StudentTimeline component displays a visual timeline of won opportunities
 */
interface TimelineProps {
  studentName: string;
  opportunities: {
    id: string;
    index: number;
    name: string;
    schoolYear: string;
    stage: string;
    isWon: boolean;
  }[];
}

const StudentTimeline: React.FC<TimelineProps> = ({
  studentName,
  opportunities,
}) => {
  // Always show the timeline for all students, regardless of enrollment status
  // Get current year and generate years for timeline
  const getCurrentYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    return year;
  };

  // Generate 3 consecutive years starting from current year - 1
  const generateYears = () => {
    const currentYear = getCurrentYear();
    return [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`,
    ];
  };

  const years = generateYears();
  
  // Helper function to check if an opportunity is enrolled for a specific year
  const isEnrolledForYear = (year: string): boolean => {
    // Convert the year format from "2024-2025" to shorthand "24/25" format
    const startYear = year.split('-')[0];
    const endYear = year.split('-')[1];
    const shortYearFormat = `${startYear.slice(-2)}/${endYear.slice(-2)}`;
    
    // Check if any opportunity is won and matches this year
    return opportunities.some(opp => 
      opp.isWon && 
      (
        // Check for full year format match (in school_year_c field)
        (opp.schoolYear === year) ||
        // Check for short year format match (e.g., "24/25")
        (opp.schoolYear === shortYearFormat) ||
        // Check for Y format (e.g., "Y24/25" in opportunity name)
        (opp.schoolYear.includes(`Y${shortYearFormat}`))
      )
    );
  };

  return (
    <div className="mt-6 mb-8 bg-muted/10 p-4 rounded-lg border border-muted">
      <h4 className="text-sm font-medium mb-4">Enrollment Timeline</h4>
      <div className="relative w-full">
        {/* Simplified timeline container */}
        <div className="flex flex-col">
          {/* Horizontal layout for timeline nodes */}
          <div className="flex items-center justify-between mb-2 relative px-8">
            {/* Connector line spanning the width */}
            <div className="absolute h-0.5 top-4 left-12 right-12 bg-muted-foreground/30"></div>

            {years.map((year, idx) => {
              const isEnrolled = isEnrolledForYear(year);

              return (
                <div
                  key={year}
                  className="flex flex-col items-center z-10"
                  style={{ width: "80px" }}
                >
                  {/* Circle node - green if enrolled for this year */}
                  {isEnrolled ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  ) : idx === 0 ? (
                    <div className="w-6 h-6 rounded-full bg-gray-400"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Year labels */}
          <div className="flex items-center justify-between px-8 mb-4">
            {years.map((year) => {
              return (
                <div
                  key={`label-${year}`}
                  className="flex flex-col items-center"
                  style={{ width: "80px" }}
                >
                  <div className="text-sm text-muted-foreground">/</div>
                  <div className="text-sm text-muted-foreground">—</div>
                </div>
              );
            })}
          </div>

          {/* Year badges at bottom */}
          <div className="flex items-center justify-between px-8">
            {years.map((year, idx) => {
              const displayYear = year.split("-")[0];
              const isEnrolled = isEnrolledForYear(year);
              const yearLabel =
                displayYear.substring(2) +
                "/" +
                (parseInt(displayYear) + 1).toString().substring(2);

              // Different styling based on enrollment status
              let badgeClass = "text-xs rounded px-2 py-0.5 font-medium ";
              if (isEnrolled) {
                badgeClass += "bg-green-100 text-green-700 border border-green-300";
              } else if (idx === 0) {
                badgeClass += "bg-muted/50 text-muted-foreground";
              } else {
                badgeClass += "border border-muted-foreground/30 text-muted-foreground";
              }

              return (
                <div
                  key={`badge-${year}`}
                  className="flex flex-col items-center"
                  style={{ width: "80px" }}
                >
                  <div className={badgeClass}>{yearLabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const FamilyDetail: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const { loading, error, familyRecord, fetchFamilyRecord } = useFamilyData();

  useEffect(() => {
    if (familyId) {
      console.log(`FamilyDetail: Fetching family record for ID: ${familyId}`);
      
      // Attempt to normalize the ID - it might be in different formats
      // Salesforce IDs are often 18 characters, PDC IDs may be different
      const normalizedId = familyId.trim();
      
      console.log(`FamilyDetail: Using normalized ID: ${normalizedId}`);
      fetchFamilyRecord(normalizedId);
    } else {
      console.error("FamilyDetail: No familyId found in URL params");
    }
  }, [familyId, fetchFamilyRecord]);

  // Validate familyId format after all hooks are called
  const isValidId = familyId && /^[a-zA-Z0-9]{15,18}$/.test(familyId);
  
  if (!isValidId) {
    return <Navigate to="/not-found" replace />;
  }

  // Mock data for design purposes
  const mockFamilyData = {
    householdName: "Adames Rincon Household",
    campus: "a0NUH0000018zd2AA",
    campusName: "New York",
    parents: [
      {
        name: "Maria Adames",
        phone: "(212) 555-7890",
        email: "maria.adames@example.com",
      },
      {
        name: "Carlos Rincon",
        phone: "(212) 555-1234",
        email: "carlos.rincon@example.com",
      },
    ],
    contactCount: 2,
    opportunityCount: 3,
  };

  if (loading) {
    return <LoadingState message="Loading family record..." />;
  }

  if (error || !familyRecord) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Error Loading Family Record</h2>
            <p className="text-red-700 mb-4">{error || "Family record not found"}</p>
            
            <div className="bg-white p-4 rounded border border-red-100 mb-4">
              <h3 className="font-medium text-red-800 mb-2">Troubleshooting Information:</h3>
              <ul className="list-disc pl-5 space-y-2 text-red-700">
                <li>Family ID from URL: <code className="bg-red-50 px-1 font-mono">{familyId}</code></li>
                <li>Make sure this ID exists in the database</li>
                <li>Check that you have access to the <code className="bg-red-50 px-1 font-mono">fivetran_views</code> schema</li>
                <li>Verify the database connection is working</li>
              </ul>
            </div>
            
            <div className="flex space-x-4">
              <button 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
              <button 
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                onClick={() => window.history.back()}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process opportunity data and provide defaults for missing values
  const renderStudentsSection = () => {
    if (!familyRecord.opportunity_count || familyRecord.opportunity_count <= 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No opportunities found for this family.
          </p>
        </div>
      );
    }

    const opportunitiesData = familyRecord.opportunity_ids.map(
      (id, index) => ({
        id,
        index,
        stage: familyRecord.opportunity_stages[index] || "New Application",
        name: familyRecord.opportunity_names[index] || "",
        recordType: familyRecord.opportunity_record_types?.[index],
        grade: familyRecord.opportunity_grades?.[index],
        campus: familyRecord.opportunity_campuses?.[index],
        studentName: familyRecord.opportunity_names[index]
          ? extractStudentName(familyRecord.opportunity_names[index])
          : "Unknown Student",
        schoolYear:
          familyRecord.opportunity_school_years?.[index] ||
          (familyRecord.opportunity_names[index]
            ? extractSchoolYear(familyRecord.opportunity_names[index])
            : ""),
        isWon:
          familyRecord.opportunity_is_won?.[index] ||
          familyRecord.opportunity_stages?.[index]?.includes("Closed Won") ||
          false,
      }),
    );

    // Group opportunities by student name
    const opportunitiesByStudent = opportunitiesData.reduce(
      (acc, opp) => {
        if (!acc[opp.studentName]) {
          acc[opp.studentName] = [];
        }
        acc[opp.studentName].push(opp);
        return acc;
      },
      {} as Record<string, typeof opportunitiesData>,
    );

    // Fuzzy match threshold (0-1 where 1 is exact match)
    const FUZZY_MATCH_THRESHOLD = 0.8;

    // Helper function to compare two strings using Levenshtein distance
    function fuzzyMatch(str1: string, str2: string): boolean {
      if (str1 === str2) return true;

      const len1 = str1.length;
      const len2 = str2.length;
      const maxLen = Math.max(len1, len2);

      // Calculate Levenshtein distance
      const matrix = [];
      for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }

      const distance = matrix[len1][len2];
      const similarity = 1 - (distance / maxLen);

      return similarity >= FUZZY_MATCH_THRESHOLD;
    }

    // Function to combine similar student records
    function combineSimilarStudents(students: StudentRecord[]): StudentRecord[] {
      const combined: StudentRecord[] = [];

      students.forEach(student => {
        const existing = combined.find(s => 
          fuzzyMatch(s.lastName, student.lastName) && 
          fuzzyMatch(s.firstName, student.firstName)
        );

        if (existing) {
          // Merge the records
          existing.opportunities = [...existing.opportunities, ...student.opportunities];
          existing.contacts = [...existing.contacts, ...student.contacts];
        } else {
          combined.push({...student});
        }
      });

      return combined;
    }

    // Convert to array of student groups
    const studentGroups = Object.entries(
      opportunitiesByStudent,
    ).map(([studentName, opportunities]) => ({
      studentName,
      firstName: studentName.split(' ')[0],
      lastName: studentName.split(' ').slice(1).join(' '),
      opportunities,
      contacts: [] // Initialize empty contacts array
    }));

    // Combine similar student records
    const combinedStudentGroups = combineSimilarStudents(studentGroups);

    if (combinedStudentGroups.length > 1) {
      return (
        <Tabs defaultValue={combinedStudentGroups[0].studentName} className="w-full">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(combinedStudentGroups.length, 4)}, 1fr)` }}>
            {combinedStudentGroups.map(({ studentName }) => (
              <TabsTrigger key={`tab-${studentName}`} value={studentName}>
                {studentName}
              </TabsTrigger>
            ))}
          </TabsList>
          {combinedStudentGroups.map(({ studentName, opportunities }) => (
            <TabsContent key={`content-${studentName}`} value={studentName} className="mt-4">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold">
                    {studentName}
                    {opportunities.some(opp => opp.isWon) && (
                      <Badge variant="success" className="ml-2">Closed Won</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Timeline directly under student name */}
                  <StudentTimeline
                    studentName={studentName}
                    opportunities={opportunities}
                  />
                  
                  {/* Individual opportunity cards */}
                  <div className="space-y-4 mt-4">
                    {opportunities.map(({
                      id,
                      index,
                      stage,
                      name,
                      recordType,
                      grade,
                      campus,
                      isWon,
                      schoolYear
                    }) => {
                      // Get the corresponding campus name if available
                      const campusName = familyRecord.opportunity_campus_names && 
                                        familyRecord.opportunity_campus_names[index] ? 
                                        familyRecord.opportunity_campus_names[index] : 
                                        null;
                      // Map record type IDs to display names
                      const getRecordTypeDisplayName = (
                        recordTypeId: string | undefined,
                        stageName?: string,
                        opportunityName?: string
                      ) => {
                        // Try to use record type ID if available
                        if (recordTypeId) {
                          switch (recordTypeId) {
                            case "012Dn000000ZzP9IAK":
                              return "New Enrollment";
                            case "012Dn000000a9ncIAA":
                              return "Re-enrollment";
                            // Add other record type IDs if known
                            default:
                              // Fall through to inference methods
                              break;
                          }
                        }
                        
                        // Try to infer from opportunity name if it contains enrollment type info
                        if (opportunityName) {
                          if (opportunityName.includes(" - R ") || opportunityName.toLowerCase().includes("re-enroll")) {
                            return "Re-enrollment";
                          }
                          if (opportunityName.includes(" - N ") || opportunityName.toLowerCase().includes("new enroll")) {
                            return "New Enrollment";
                          }
                        }
                        
                        // If other methods fail, infer from stage
                        if (stageName && stageName.toLowerCase().includes("re-enroll")) {
                          return "Re-enrollment";
                        }
                        
                        // Default to Enrollment
                        return "Enrollment";
                      };

                      // Use the recordType passed from our filtered data with fallbacks
                      const recordTypeDisplay =
                        getRecordTypeDisplayName(recordType, stage, name);

                      // Normalize stage value to handle case sensitivity and whitespace
                      const normalizedStage = stage
                        ? stage.trim()
                        : "New Application";

                      return (
                        <Card
                          key={id}
                          className={
                            isWon ? "border-l-4 border-l-green-500" : ""
                          }
                        >
                          <CardHeader>
                            <CardTitle>
                              {/* Display school year and record type in the header */}
                              {(familyRecord.opportunity_school_years?.[index] || 
                               (name ? extractSchoolYear(name) : "")) && recordTypeDisplay ? (
                                <>
                                  {formatSchoolYearForDisplay(familyRecord.opportunity_school_years?.[index] || 
                                   (name ? extractSchoolYear(name) : ""))} {recordTypeDisplay}
                                </>
                              ) : (
                                `Opportunity ${index + 1}`
                              )}
                            </CardTitle>
                            <CardDescription>
                              <Badge
                                variant={
                                  normalizedStage === "Closed Won"
                                    ? "success"
                                    : normalizedStage === "Closed Lost"
                                    ? "destructive"
                                    : normalizedStage === "Family Interview"
                                    ? "secondary"
                                    : normalizedStage === "Awaiting Documents"
                                    ? "default"
                                    : normalizedStage === "Education Review"
                                    ? "secondary"
                                    : normalizedStage === "Admission Offered"
                                    ? "default"
                                    : "outline"
                                }
                              >
                                {normalizedStage || "New Application"}
                              </Badge>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left column - Student Info */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">Student Information</h3>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="text-sm font-medium text-muted-foreground">Name</h5>
                                      <p className="text-sm font-medium">
                                        {name ? extractStudentName(name) : "Unknown"}
                                      </p>
                                    </div>
                                    
                                    {grade && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground">Grade</h5>
                                        <p className="text-sm font-medium">{grade}</p>
                                      </div>
                                    )}
                                    
                                    {(campus || campusName) && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground">Campus</h5>
                                        <p className="text-sm font-medium">{campusName || campus}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right column - Opportunity Details */}
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">Opportunity Details</h3>
                                  
                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="text-sm font-medium text-muted-foreground">School Year</h5>
                                      <p className="text-sm font-medium">
                                        {familyRecord.opportunity_school_years?.[index] ||
                                          (name ? extractSchoolYear(name) : "Unknown")}
                                      </p>
                                    </div>
                                    
                                    {recordType && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground">Opportunity Type</h5>
                                        <p className="text-sm font-medium">{recordTypeDisplay}</p>
                                      </div>
                                    )}
                                    
                                    {familyRecord.opportunity_created_dates[index] && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground">Created Date</h5>
                                        <p className="text-sm font-medium">
                                          {new Date(familyRecord.opportunity_created_dates[index]).toLocaleDateString()}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Placeholder for financial info - This would need actual data from the family object */}
                                    {familyRecord.tuition_offer_family_contributions && familyRecord.tuition_offer_family_contributions[index] !== undefined && (
                                      <div>
                                        <h5 className="text-sm font-medium text-muted-foreground">Family Contribution</h5>
                                        <p className="text-sm font-medium">
                                          ${familyRecord.tuition_offer_family_contributions[index].toLocaleString()}
                                        </p>
                                      </div>
                                    )}
                                    
                                    {/* Debug information */}
                                    <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                                      <div>
                                        <h5 className="text-xs font-medium text-muted-foreground">Opportunity ID (Debug)</h5>
                                        <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                          {id}
                                        </p>
                                      </div>
                                      
                                      <div className="mt-2">
                                        <h5 className="text-xs font-medium text-muted-foreground">Last Stage Change (Debug)</h5>
                                        <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                          {familyRecord.opportunity_created_dates[index] 
                                            ? new Date(familyRecord.opportunity_created_dates[index]).toLocaleDateString() 
                                            : "Unknown"}
                                        </p>
                                      </div>
                                      
                                      <div className="mt-2">
                                        <h5 className="text-xs font-medium text-muted-foreground">Record Type ID (Debug)</h5>
                                        <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                          {recordType || "Missing"}
                                        </p>
                                        <p className="text-xs font-mono mt-1">
                                          Display: {recordTypeDisplay}
                                        </p>
                                      </div>
                                      
                                      <div className="mt-2">
                                        <h5 className="text-xs font-medium text-muted-foreground">School Year (Debug)</h5>
                                        <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                          Raw: {familyRecord.opportunity_school_years?.[index] || "Missing"}<br/>
                                          Extracted: {name ? extractSchoolYear(name) : "Missing"}<br/>
                                          Display Format: {formatSchoolYearForDisplay(familyRecord.opportunity_school_years?.[index] || 
                                           (name ? extractSchoolYear(name) : ""))}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      );
    } else if (combinedStudentGroups.length === 1) {
      // If there's only one student, just show the cards without tabs
      const { studentName, opportunities } = combinedStudentGroups[0];
      return (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold">
              {studentName}
              {opportunities.some(opp => opp.isWon) && (
                <Badge variant="success" className="ml-2">Closed Won</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentTimeline
              studentName={studentName}
              opportunities={opportunities}
            />
            
            <div className="space-y-4 mt-4">
              {opportunities.map(({
                id,
                index,
                stage,
                name,
                recordType,
                grade,
                campus,
                isWon,
                schoolYear
              }) => {
                // Get the corresponding campus name if available
                const campusName = familyRecord.opportunity_campus_names && 
                                  familyRecord.opportunity_campus_names[index] ? 
                                  familyRecord.opportunity_campus_names[index] : 
                                  null;
                // Map record type IDs to display names
                const getRecordTypeDisplayName = (
                  recordTypeId: string | undefined,
                  stageName?: string,
                  opportunityName?: string
                ) => {
                  // Try to use record type ID if available
                  if (recordTypeId) {
                    switch (recordTypeId) {
                      case "012Dn000000ZzP9IAK":
                        return "New Enrollment";
                      case "012Dn000000a9ncIAA":
                        return "Re-enrollment";
                      // Add other record type IDs if known
                      default:
                        // Fall through to inference methods
                        break;
                    }
                  }
                  
                  // Try to infer from opportunity name if it contains enrollment type info
                  if (opportunityName) {
                    if (opportunityName.includes(" - R ") || opportunityName.toLowerCase().includes("re-enroll")) {
                      return "Re-enrollment";
                    }
                    if (opportunityName.includes(" - N ") || opportunityName.toLowerCase().includes("new enroll")) {
                      return "New Enrollment";
                    }
                  }
                  
                  // If other methods fail, infer from stage
                  if (stageName && stageName.toLowerCase().includes("re-enroll")) {
                    return "Re-enrollment";
                  }
                  
                  // Default to Enrollment
                  return "Enrollment";
                };

                // Use the recordType passed from our filtered data with fallbacks
                const recordTypeDisplay =
                  getRecordTypeDisplayName(recordType, stage, name);

                // Normalize stage value to handle case sensitivity and whitespace
                const normalizedStage = stage
                  ? stage.trim()
                  : "New Application";

                return (
                  <Card
                    key={id}
                    className={
                      isWon ? "border-l-4 border-l-green-500" : ""
                    }
                  >
                    <CardHeader>
                      <CardTitle>
                        {/* Display school year and record type in the header */}
                        {(familyRecord.opportunity_school_years?.[index] || 
                         (name ? extractSchoolYear(name) : "")) && recordTypeDisplay ? (
                          <>
                            {formatSchoolYearForDisplay(familyRecord.opportunity_school_years?.[index] || 
                             (name ? extractSchoolYear(name) : ""))} {recordTypeDisplay}
                          </>
                        ) : (
                          `Opportunity ${index + 1}`
                        )}
                      </CardTitle>
                      <CardDescription>
                        <Badge
                          variant={
                            normalizedStage === "Closed Won"
                              ? "success"
                              : normalizedStage === "Closed Lost"
                              ? "destructive"
                              : normalizedStage === "Family Interview"
                              ? "secondary"
                              : normalizedStage === "Awaiting Documents"
                              ? "default"
                              : normalizedStage === "Education Review"
                              ? "secondary"
                              : normalizedStage === "Admission Offered"
                              ? "default"
                              : "outline"
                          }
                        >
                          {normalizedStage || "New Application"}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column - Student Info */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">Student Information</h3>
                            
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">Name</h5>
                                <p className="text-sm font-medium">
                                  {name ? extractStudentName(name) : "Unknown"}
                                </p>
                              </div>
                              
                              {grade && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground">Grade</h5>
                                  <p className="text-sm font-medium">{grade}</p>
                                </div>
                              )}
                              
                              {(campus || campusName) && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground">Campus</h5>
                                  <p className="text-sm font-medium">{campusName || campus}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Right column - Opportunity Details */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">Opportunity Details</h3>
                            
                            <div className="space-y-3">
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">School Year</h5>
                                <p className="text-sm font-medium">
                                  {familyRecord.opportunity_school_years?.[index] ||
                                    (name ? extractSchoolYear(name) : "Unknown")}
                                </p>
                              </div>
                              
                              {recordType && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground">Opportunity Type</h5>
                                  <p className="text-sm font-medium">{recordTypeDisplay}</p>
                                </div>
                              )}
                              
                              {familyRecord.opportunity_created_dates[index] && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground">Created Date</h5>
                                  <p className="text-sm font-medium">
                                    {new Date(familyRecord.opportunity_created_dates[index]).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                              
                              {/* Placeholder for financial info - This would need actual data from the family object */}
                              {familyRecord.tuition_offer_family_contributions && familyRecord.tuition_offer_family_contributions[index] !== undefined && (
                                <div>
                                  <h5 className="text-sm font-medium text-muted-foreground">Family Contribution</h5>
                                  <p className="text-sm font-medium">
                                    ${familyRecord.tuition_offer_family_contributions[index].toLocaleString()}
                                  </p>
                                </div>
                              )}
                              
                              {/* Debug information */}
                              <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                                <div>
                                  <h5 className="text-xs font-medium text-muted-foreground">Opportunity ID (Debug)</h5>
                                  <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                    {id}
                                  </p>
                                </div>
                                
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium text-muted-foreground">Last Stage Change (Debug)</h5>
                                  <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                    {familyRecord.opportunity_created_dates[index] 
                                      ? new Date(familyRecord.opportunity_created_dates[index]).toLocaleDateString() 
                                      : "Unknown"}
                                  </p>
                                </div>
                                
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium text-muted-foreground">Record Type ID (Debug)</h5>
                                  <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                    {recordType || "Missing"}
                                  </p>
                                  <p className="text-xs font-mono mt-1">
                                    Display: {recordTypeDisplay}
                                  </p>
                                </div>
                                
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium text-muted-foreground">School Year (Debug)</h5>
                                  <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                                    Raw: {familyRecord.opportunity_school_years?.[index] || "Missing"}<br/>
                                    Extracted: {name ? extractSchoolYear(name) : "Missing"}<br/>
                                    Display Format: {formatSchoolYearForDisplay(familyRecord.opportunity_school_years?.[index] || 
                                     (name ? extractSchoolYear(name) : ""))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // This shouldn't happen but included for completeness
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No student data found for this family.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header / Summary Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            {/* Prominent Household Name as Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {familyRecord.family_name}
              </h1>
              
              {/* Active status pill - displayed when family has any closed won opportunity for current year */}
              {familyRecord.opportunity_count > 0 && 
                familyRecord.opportunity_ids.some((_, idx) => 
                  (familyRecord.opportunity_is_won?.[idx] || 
                   familyRecord.opportunity_stages?.[idx]?.includes("Closed Won")) && 
                  (familyRecord.opportunity_school_years?.[idx]?.includes("25/26") || 
                   (familyRecord.opportunity_names?.[idx] && 
                    familyRecord.opportunity_names[idx].includes("Y25/26")))
                ) && (
                <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                  <div className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Active
                </div>
              )}
            </div>

            {/* Badges for key information */}
            <div className="flex items-center mt-2 space-x-2">
              {/* Campus Badge with Icon */}
              <Badge
                variant="outline"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3 border-muted/40"
              >
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {familyRecord.current_campus_name || familyRecord.current_campus_c || "Not Assigned"}
                </span>
              </Badge>

            </div>
          </div>

          {/* Back to Search Button */}
          <Button variant="outline" asChild size="sm" className="font-medium">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>

        {/* Quick Parent Contact Information */}
        <Card className="mt-6 border-muted/40 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Parents Information - Left Column */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-primary" />
                  Parent Contact Information
                </h3>
                {familyRecord.contact_count > 0 ? (
                  <div className="space-y-4">
                    {familyRecord.contact_ids.map((id, index) => (
                      <div
                        key={id}
                        className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors"
                      >
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-4">
                            <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
                              {familyRecord.contact_first_names[index]?.[0] || ""}
                              {familyRecord.contact_last_names[index]?.[0] || ""}
                            </div>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">
                              {familyRecord.contact_first_names[index]}{" "}
                              {familyRecord.contact_last_names[index]}
                            </h4>
                            <div className="space-y-2 mt-2">
                              {familyRecord.contact_phones[index] && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{familyRecord.contact_phones[index]}</span>
                                </div>
                              )}
                              {familyRecord.contact_emails[index] && (
                                <div className="flex items-center">
                                  <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{familyRecord.contact_emails[index]}</span>
                                </div>
                              )}
                              {familyRecord.contact_last_activity_dates[index] && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Last Activity: {new Date(familyRecord.contact_last_activity_dates[index]).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic p-4 bg-muted/10 rounded-lg border border-muted/20">
                    No parent contacts found
                  </div>
                )}
              </div>

              {/* Family Information - Right Column */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Family Information
                </h3>
                
                {/* Family Information content - styled to match Parent Contact Information */}
                <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Lifetime Value */}
                    <div className="flex items-center">
                      <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Lifetime Value</div>
                        <div className="font-medium">
                          {familyRecord.tuition_offer_count > 0
                            ? `$${((familyRecord.tuition_offer_family_contributions.reduce((sum, val) => sum + (val || 0), 0) || 0)).toLocaleString()}`
                            : "$0"}
                        </div>
                        <div className="text-xs text-muted-foreground">Total family contribution</div>
                      </div>
                    </div>
                    
                    {/* Last Activity */}
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Last Activity</div>
                        <div className="font-medium">
                          {familyRecord.contact_count > 0 && familyRecord.contact_last_activity_dates.some(date => date)
                            ? new Date(Math.max(...familyRecord.contact_last_activity_dates
                                .filter(date => date)
                                .map(date => new Date(date).getTime()))).toLocaleDateString()
                            : "No activity"}
                        </div>
                        <div className="text-xs text-muted-foreground">Most recent contact interaction</div>
                      </div>
                    </div>
                    
                    {/* Open Tuition Offers */}
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Open Tuition Offers</div>
                        <div className="font-medium">
                          {familyRecord.tuition_offer_count > 0
                            ? `${familyRecord.tuition_offer_statuses.filter(status => 
                                status && (status.includes("Active") || status.includes("Open"))
                              ).length} out of ${familyRecord.tuition_offer_count}`
                            : "0"}
                        </div>
                        <div className="text-xs text-muted-foreground">Active tuition offers</div>
                      </div>
                    </div>
                    
                    {/* Family Since Date */}
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Family Since</div>
                        <div className="font-medium">
                          {familyRecord.opportunity_count > 0 && familyRecord.opportunity_created_dates.some(date => date)
                            ? new Date(Math.min(...familyRecord.opportunity_created_dates
                                .filter(date => date)
                                .map(date => new Date(date).getTime()))).toLocaleDateString()
                            : "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">First opportunity created</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Space between header and content sections */}
      <div className="mb-8"></div>

      {/* All content is now displayed on a single page */}
      <div className="space-y-8">
        {/* Students Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Students</h2>
          {renderStudentsSection()}
        </div>

        {/* Notes Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Notes</h2>
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="lead-notes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lead-notes">Lead Notes</TabsTrigger>
                  <TabsTrigger value="interview-notes">Family Interview Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="lead-notes" className="mt-4">
                  {familyRecord.opportunity_lead_notes && familyRecord.opportunity_lead_notes.some(note => note) ? (
                    <div className="space-y-4">
                      {familyRecord.opportunity_lead_notes.map((note, index) => {
                        if (!note) return null;
                        return (
                          <div key={`lead-note-${index}`} className="border-l-4 border-primary p-4 bg-primary/5 rounded-md">
                            <div className="flex items-center mb-2">
                              <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                              <h5 className="text-sm font-medium">
                                {familyRecord.opportunity_names[index] ? extractStudentName(familyRecord.opportunity_names[index]) : `Note ${index + 1}`}
                              </h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{note}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No lead notes found for this family.</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="interview-notes" className="mt-4">
                  {familyRecord.opportunity_family_interview_notes && familyRecord.opportunity_family_interview_notes.some(note => note) ? (
                    <div className="space-y-4">
                      {familyRecord.opportunity_family_interview_notes.map((note, index) => {
                        if (!note) return null;
                        return (
                          <div key={`interview-note-${index}`} className="border-l-4 border-secondary p-4 bg-secondary/5 rounded-md">
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                              <h5 className="text-sm font-medium">
                                {familyRecord.opportunity_names[index] ? extractStudentName(familyRecord.opportunity_names[index]) : `Note ${index + 1}`}
                              </h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{note}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No family interview notes found for this family.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Tuition Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tuition Offers</h2>
          <div className="space-y-4">
            {familyRecord.tuition_offer_count > 0 ? (
              familyRecord.tuition_offer_ids
                .map((id, index) => ({ id, index }))
                .filter((item) => {
                  const status = familyRecord.tuition_offer_statuses[item.index];
                  return (
                    status &&
                    (status.includes("Active") || status.includes("Open"))
                  );
                })
                .map(({ id, index }) => (
                  <Card key={id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Tuition Offer #{index + 1}
                      </CardTitle>
                      <CardDescription>
                        <Badge
                          variant={
                            familyRecord.tuition_offer_statuses[index]
                              ?.toLowerCase()
                              .includes("accepted")
                              ? "default"
                              : familyRecord.tuition_offer_statuses[index]
                                ?.toLowerCase()
                                .includes("declined")
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {familyRecord.tuition_offer_statuses[index] ||
                            "Unknown Status"}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1">
                            Family Contribution
                          </h5>
                          <p className="text-2xl font-semibold text-primary">
                            $
                            {(
                              familyRecord.tuition_offer_family_contributions[
                                index
                              ] || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1">
                            State Scholarship
                          </h5>
                          <p className="text-2xl font-semibold text-accent-foreground">
                            $
                            {(
                              familyRecord.tuition_offer_state_scholarships[index] ||
                              0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span>
                          Total Package: $
                          {(
                            (familyRecord.tuition_offer_family_contributions[index] ||
                              0) +
                            (familyRecord.tuition_offer_state_scholarships[index] ||
                              0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No tuition offers found for this family.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Links / Resources Section */}
      <div className="bg-muted/20 rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">Resources</h2>
        <div className="flex flex-wrap gap-4">
          {/* Salesforce Link */}
          <a 
            href={familyRecord.family_id ? `https://primer.lightning.force.com/lightning/r/Account/${familyRecord.family_id}/view` : "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${!familyRecord.family_id ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Salesforce
          </a>

          {/* PDC Link */}
          <a 
            href={familyRecord.pdc_family_id_c ? `https://pdc.primerlearning.org/families/${familyRecord.pdc_family_id_c}` : "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 ${!familyRecord.pdc_family_id_c ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            PDC Link
          </a>

          {/* Intercom Link */}
          <a 
            href={familyRecord.contact_emails && familyRecord.contact_emails[0] ? `https://app.intercom.com/a/apps/default/users?email=${encodeURIComponent(familyRecord.contact_emails[0])}` : "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${!familyRecord.contact_emails || !familyRecord.contact_emails[0] ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Intercom
          </a>
        </div>
      </div>
    </div>
  );
};

// Type definition for student records
interface StudentRecord {
  studentName: string;
  firstName: string;
  lastName: string;
  opportunities: any[];
  contacts: any[];
}

export default FamilyDetail;