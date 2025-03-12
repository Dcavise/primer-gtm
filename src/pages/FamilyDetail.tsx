import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase-client";
import { LoadingState } from "@/components/LoadingState";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronRight,
  MoreHorizontal,
  Phone,
  Mail,
  ExternalLink,
  Trash,
  Edit,
  AlertCircle,
  Copy,
  Check,
  CheckCircle2,
  Building,
  GraduationCap,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  FileText,
  Banknote,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

// Define the FamilyRecord type with student arrays
interface FamilyRecord {
  id: string;
  household_name: string;
  campus_c: string;
  campus_name?: string;
  contact_count: number;
  opportunity_count: number;
  opportunity_ids: string[];
  opportunity_names: string[];
  opportunity_stages?: string[];
  opportunity_record_types?: string[];
  opportunity_grades?: string[];
  opportunity_campuses?: string[];
  opportunity_school_years?: string[];
  opportunity_is_won?: boolean[];
  contact_ids?: string[];
  contact_names?: string[];
  contact_phones?: string[];
  contact_emails?: string[];
  contact_types?: string[];
  // Add student arrays from derived_students
  student_ids?: string[];
  student_first_names?: string[];
  student_last_names?: string[];
  student_full_names?: string[];
  student_count?: number;
  // Additional properties used in the component
  opportunity_campus_names?: string[];
  opportunity_created_dates?: string[];
  tuition_offer_family_contributions?: number[];
  tuition_offer_state_scholarships?: number[];
  contact_first_names?: string[];
  contact_last_names?: string[];
  contact_last_activity_dates?: string[];
  lifetime_value?: number;
  tuition_offer_count?: number;
  tuition_offer_ids?: string[];
  tuition_offer_statuses?: string[];
  opportunity_lead_notes?: string[];
  opportunity_family_interview_notes?: string[];
  pdc_family_id_c?: string;
}

// Type definition for student records
interface StudentRecord {
  studentName: string;
  firstName: string;
  lastName: string;
  opportunities: any[];
  contacts: any[];
}

/**
 * Extract student name from opportunity name
 *
 * Examples:
 * "Cameron Abreu - G0 - Y23/24" -> "Cameron Abreu"
 * "Jacobo Buritica - G4 - Y25/26 - R" -> "Jacobo Buritica"
 */
const extractStudentName = (opportunityName: string, opportunityId?: string): string => {
  // Special case for specific opportunity ID that needs correction
  if (opportunityId === "006UH00000IPT46YAH") {
    return "Ivana Buritica";
  }

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
const extractSchoolYear = (opportunityName: string, schoolYearField?: string): string => {
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

const StudentTimeline: React.FC<TimelineProps> = ({ studentName, opportunities }) => {
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
    const startYear = year.split("-")[0];
    const endYear = year.split("-")[1];
    const shortYearFormat = `${startYear.slice(-2)}/${endYear.slice(-2)}`;

    // Check if any opportunity is won and matches this year
    return opportunities.some(
      (opp) =>
        opp.isWon &&
        // Check for full year format match (in school_year_c field)
        (opp.schoolYear === year ||
          // Check for short year format match (e.g., "24/25")
          opp.schoolYear === shortYearFormat ||
          // Check for Y format (e.g., "Y24/25" in opportunity name)
          opp.schoolYear.includes(`Y${shortYearFormat}`))
    );
  };

  return (
    <div className="mt-6 mb-8 bg-muted/10 p-6 rounded-lg border border-muted shadow-sm">
      <h4 className="text-sm font-medium mb-5 text-foreground/80">Enrollment Timeline</h4>
      <div className="relative w-full">
        {/* Simplified timeline container */}
        <div className="flex flex-col">
          {/* Horizontal layout for timeline nodes */}
          <div className="flex items-center justify-between mb-3 relative px-8">
            {/* Connector line spanning the width */}
            <div className="absolute h-1 top-4 left-12 right-12 bg-muted-foreground/20 rounded-full"></div>

            {/* Green glow layer on top of base line */}
            <div className="absolute h-2 top-[14px] left-12 right-12 bg-green-500/10 blur-md rounded-full"></div>

            {/* Active line segments between enrolled nodes */}
            {years.map((year, idx) => {
              if (idx < years.length - 1) {
                const currentYearEnrolled = isEnrolledForYear(year);
                const nextYearEnrolled = isEnrolledForYear(years[idx + 1]);

                // Only show active line if both connected nodes are enrolled
                if (currentYearEnrolled && nextYearEnrolled) {
                  return (
                    <div
                      key={`connector-${idx}`}
                      className="absolute h-2 top-[14px] bg-gradient-to-r from-green-500 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.6)] z-0 rounded-full transition-all duration-500"
                      style={{
                        left: `calc(${(100 / (years.length - 1)) * idx}% + 3px)`,
                        width: `calc(${100 / (years.length - 1)}% - 6px)`,
                      }}
                    ></div>
                  );
                }
              }
              return null;
            })}

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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 border-2 border-white transition-all duration-300 hover:scale-110">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : idx === 0 ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border border-white/70 shadow-md transition-all duration-300 hover:scale-105"></div>
                  ) : (
                    <div className="w-7 h-7 rounded-full border-2 border-gray-300 bg-white shadow-sm transition-all duration-300 hover:border-gray-400"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Year labels */}
          <div className="flex items-center justify-between px-8 mb-3">
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
              let badgeClass =
                "text-xs rounded-md px-3 py-1 font-medium shadow-sm transition-all duration-300 ";
              if (isEnrolled) {
                badgeClass +=
                  "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200";
              } else if (idx === 0) {
                badgeClass += "bg-muted/50 text-muted-foreground/80";
              } else {
                badgeClass += "border border-muted-foreground/20 text-muted-foreground/70";
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

const FamilyDetail = () => {
  const { familyId } = useParams();
  const [familyRecord, setFamilyRecord] = useState<FamilyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validate that the ID is a valid UUID
  const isValidId = useMemo(() => {
    if (!familyId) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(familyId);
  }, [familyId]);

  // Fetch family record from Supabase
  useEffect(() => {
    if (!isValidId) return;

    const fetchFamilyRecord = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc("get_family_record", {
          family_id_param: familyId,
        });

        if (error) {
          console.error("Error fetching family record:", error);
          setError(error.message);
          return;
        }

        if (!data) {
          setError("Family record not found");
          return;
        }

        console.log("Family record:", data);
        setFamilyRecord(data as FamilyRecord);
      } catch (err) {
        console.error("Exception fetching family record:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyRecord();
  }, [familyId, isValidId]);

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
                <li>
                  Family ID from URL: <code className="bg-red-50 px-1 font-mono">{familyId}</code>
                </li>
                <li>Make sure this ID exists in the database</li>
                <li>
                  Check that you have access to the{" "}
                  <code className="bg-red-50 px-1 font-mono">fivetran_views</code> schema
                </li>
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
          <p className="text-muted-foreground">No opportunities found for this family.</p>
        </div>
      );
    }

    // Check if we have student data from derived_students
    const hasStudentArrays =
      Array.isArray(familyRecord.student_ids) &&
      Array.isArray(familyRecord.student_first_names) &&
      Array.isArray(familyRecord.student_last_names) &&
      Array.isArray(familyRecord.student_full_names);

    console.log("DEBUG - Family Record Student Arrays:", {
      hasStudentArrays,
      student_ids: familyRecord.student_ids,
      student_first_names: familyRecord.student_first_names,
      student_last_names: familyRecord.student_last_names,
      student_full_names: familyRecord.student_full_names,
      student_count: familyRecord.student_count,
    });

    // Create a mapping of opportunity IDs to student names
    // This uses the opportunity_student_map implicitly through the derived_students implementation
    const opportunityToStudentMap = new Map();

    // Process opportunities and map them to students
    const opportunitiesData = familyRecord.opportunity_ids.map((id, index) => {
      const oppData = {
        id,
        index,
        stage: familyRecord.opportunity_stages[index] || "New Application",
        name: familyRecord.opportunity_names[index] || "",
        recordType: familyRecord.opportunity_record_types?.[index],
        grade: familyRecord.opportunity_grades?.[index],
        campus: familyRecord.opportunity_campuses?.[index],
        // Default to extracted name as fallback
        studentName: "Unknown Student",
        schoolYear:
          familyRecord.opportunity_school_years?.[index] ||
          (familyRecord.opportunity_names[index]
            ? extractSchoolYear(familyRecord.opportunity_names[index])
            : ""),
        isWon:
          familyRecord.opportunity_is_won?.[index] ||
          familyRecord.opportunity_stages?.[index]?.includes("Closed Won") ||
          false,
      };

      // Extract student name as fallback
      if (oppData.name) {
        oppData.studentName = extractStudentName(oppData.name, id);
      }

      return oppData;
    });

    // Create student records from the derived_students data
    let studentGroups: StudentRecord[] = [];

    if (hasStudentArrays && familyRecord.student_ids.length > 0) {
      // Use the derived_students data
      studentGroups = familyRecord.student_ids.map((studentId, idx) => {
        const firstName = familyRecord.student_first_names[idx] || "";
        const lastName = familyRecord.student_last_names[idx] || "";
        const fullName = familyRecord.student_full_names[idx] || `${firstName} ${lastName}`.trim();

        // Find opportunities for this student
        // This is a simplified approach - in a real implementation, we would use the opportunity_student_map
        const studentOpportunities = opportunitiesData.filter(
          (opp) =>
            // Match by name similarity
            opp.studentName.toLowerCase().includes(firstName.toLowerCase()) &&
            opp.studentName.toLowerCase().includes(lastName.toLowerCase())
        );

        console.log(`DEBUG - Student ${fullName} (${idx}):`, {
          studentId,
          firstName,
          lastName,
          fullName,
          opportunityCount: studentOpportunities.length,
          opportunities: studentOpportunities.map((o) => ({
            id: o.id,
            name: o.name,
            studentName: o.studentName,
          })),
        });

        return {
          studentName: fullName,
          firstName,
          lastName,
          opportunities: studentOpportunities,
          contacts: [], // Initialize empty contacts array
        };
      });

      // Handle any opportunities that weren't matched to students
      const unmatchedOpportunities = opportunitiesData.filter(
        (opp) =>
          !studentGroups.some((student) =>
            student.opportunities.some((studentOpp) => studentOpp.id === opp.id)
          )
      );

      if (unmatchedOpportunities.length > 0) {
        // Group unmatched opportunities by extracted student name
        const unmatchedByName = unmatchedOpportunities.reduce(
          (acc, opp) => {
            if (!acc[opp.studentName]) {
              acc[opp.studentName] = [];
            }
            acc[opp.studentName].push(opp);
            return acc;
          },
          {} as Record<string, typeof opportunitiesData>
        );

        // Add these as additional student groups
        Object.entries(unmatchedByName).forEach(([studentName, opportunities]) => {
          const nameParts = studentName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          studentGroups.push({
            studentName,
            firstName,
            lastName,
            opportunities,
            contacts: [],
          });
        });
      }
    } else {
      // Fallback to the old method if we don't have student arrays
      const opportunitiesByStudent: Record<string, typeof opportunitiesData> =
        opportunitiesData.reduce((acc, opp) => {
          if (!acc[opp.studentName]) {
            acc[opp.studentName] = [];
          }
          acc[opp.studentName].push(opp);
          return acc;
        }, {});

      // Convert to array of student groups
      studentGroups = Object.entries(opportunitiesByStudent).map(
        ([studentName, opportunities]) => ({
          studentName,
          firstName: studentName.split(" ")[0],
          lastName: studentName.split(" ").slice(1).join(" "),
          opportunities,
          contacts: [], // Initialize empty contacts array
        })
      );
    }

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
      const similarity = 1 - distance / maxLen;

      return similarity >= FUZZY_MATCH_THRESHOLD;
    }

    // Deduplicate student groups based on name similarity
    const deduplicatedStudentGroups: StudentRecord[] = [];
    const processedNames = new Set<string>();

    // Special case handling for known duplicates
    const knownDuplicates: Record<string, string> = {
      "Ivana Buritica": "Ivana Buritica", // Map variations of Ivana's name to a canonical form
    };

    // Sort student groups by name for consistent processing
    studentGroups.sort((a, b) => a.studentName.localeCompare(b.studentName));

    // First pass: process students from derived_students (more reliable source)
    studentGroups.forEach((student) => {
      // Skip if this name has already been processed
      if (processedNames.has(student.studentName.toLowerCase())) {
        return;
      }

      // Check if this is a known duplicate
      const canonicalName = knownDuplicates[student.studentName];
      if (canonicalName && processedNames.has(canonicalName.toLowerCase())) {
        return; // Skip this duplicate
      }

      // Check for fuzzy duplicates
      let isDuplicate = false;
      for (const processedName of processedNames) {
        if (fuzzyMatch(student.studentName.toLowerCase(), processedName)) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        deduplicatedStudentGroups.push(student);
        processedNames.add(student.studentName.toLowerCase());
      }
    });

    // Log the deduplication results
    console.log("DEBUG - Deduplication Results:", {
      originalGroups: studentGroups.map((s) => s.studentName),
      deduplicatedGroups: deduplicatedStudentGroups.map((s) => s.studentName),
      processedNames: Array.from(processedNames),
    });

    // Special case: ensure Jacobo is included if he exists in the original data
    const hasJacobo = studentGroups.some(
      (s) =>
        s.firstName.toLowerCase() === "jacobo" || s.studentName.toLowerCase().includes("jacobo")
    );

    const jacoboInDeduped = deduplicatedStudentGroups.some(
      (s) =>
        s.firstName.toLowerCase() === "jacobo" || s.studentName.toLowerCase().includes("jacobo")
    );

    if (hasJacobo && !jacoboInDeduped) {
      // Find Jacobo in the original groups and add him to the deduplicated list
      const jacoboStudent = studentGroups.find(
        (s) =>
          s.firstName.toLowerCase() === "jacobo" || s.studentName.toLowerCase().includes("jacobo")
      );

      if (jacoboStudent) {
        console.log("DEBUG - Adding Jacobo back to the list:", jacoboStudent);
        deduplicatedStudentGroups.push(jacoboStudent);
      }
    }

    // Sort the final list alphabetically by student name
    deduplicatedStudentGroups.sort((a, b) => a.studentName.localeCompare(b.studentName));

    // Create tabs for each student
    return (
      <Tabs
        defaultValue={deduplicatedStudentGroups[0]?.studentName || "default"}
        className="w-full"
      >
        <TabsList className="mb-4 flex-wrap h-auto py-1">
          {deduplicatedStudentGroups.map((student) => (
            <TabsTrigger
              key={student.studentName}
              value={student.studentName}
              className="px-4 py-2 text-sm"
            >
              {student.studentName}
            </TabsTrigger>
          ))}
        </TabsList>

        {deduplicatedStudentGroups.map((student) => (
          <TabsContent key={student.studentName} value={student.studentName}>
            <StudentTimeline
              studentName={student.studentName}
              opportunities={student.opportunities}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
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
                {familyRecord.household_name}
              </h1>

              {/* Active status pill - displayed when family has any closed won opportunity for current year */}
              {familyRecord.opportunity_count > 0 &&
                familyRecord.opportunity_ids.some(
                  (_, idx) =>
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
                  {familyRecord.campus_name || familyRecord.campus_c || "Not Assigned"}
                </span>
              </Badge>

              {/* Students Badge - using the exact structure from the screenshot */}
              <div className="flex items-center border border-muted/40 rounded-full py-1.5 px-3">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                <span className="text-sm font-medium">
                  {familyRecord.opportunity_count || 0} Students
                </span>
              </div>

              {/* Health District badge from screenshot */}
              <div className="flex items-center p-2 px-4 rounded-full border bg-white">
                <span className="text-sm font-medium">Health District</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Back to Search Button */}
            <Button variant="outline" asChild size="sm" className="font-medium">
              <Link to="/search">Back to Search</Link>
            </Button>
          </div>
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
                                  <span>
                                    Last Activity:{" "}
                                    {new Date(
                                      familyRecord.contact_last_activity_dates[index]
                                    ).toLocaleDateString()}
                                  </span>
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
                      <Banknote className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Lifetime Value</div>
                        <div className="font-medium">
                          {familyRecord.lifetime_value !== undefined
                            ? `$${familyRecord.lifetime_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Based on accepted offers
                        </div>
                      </div>
                    </div>

                    {/* Last Activity */}
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Last Activity</div>
                        <div className="font-medium">
                          {familyRecord.contact_count > 0 &&
                          familyRecord.contact_last_activity_dates.some((date) => date)
                            ? new Date(
                                Math.max(
                                  ...familyRecord.contact_last_activity_dates
                                    .filter((date) => date)
                                    .map((date) => new Date(date).getTime())
                                )
                              ).toLocaleDateString()
                            : "No activity"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Most recent contact interaction
                        </div>
                      </div>
                    </div>

                    {/* Open Tuition Offers */}
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Open Tuition Offers</div>
                        <div className="font-medium">
                          {familyRecord.tuition_offer_count > 0
                            ? `${
                                familyRecord.tuition_offer_statuses.filter(
                                  (status) =>
                                    status && (status.includes("Active") || status.includes("Open"))
                                ).length
                              } out of ${familyRecord.tuition_offer_count}`
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
                          {familyRecord.opportunity_count > 0 &&
                          familyRecord.opportunity_created_dates.some((date) => date)
                            ? new Date(
                                Math.min(
                                  ...familyRecord.opportunity_created_dates
                                    .filter((date) => date)
                                    .map((date) => new Date(date).getTime())
                                )
                              ).toLocaleDateString()
                            : "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          First opportunity created
                        </div>
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
      <div>
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
                  {familyRecord.opportunity_lead_notes &&
                  familyRecord.opportunity_lead_notes.some((note) => note) ? (
                    <div className="space-y-4">
                      {familyRecord.opportunity_lead_notes.map((note, index) => {
                        if (!note) return null;
                        return (
                          <div
                            key={`lead-note-${index}`}
                            className="border-l-4 border-primary p-4 bg-primary/5 rounded-md"
                          >
                            <div className="flex items-center mb-2">
                              <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                              <h5 className="text-sm font-medium">
                                {familyRecord.opportunity_names[index]
                                  ? extractStudentName(familyRecord.opportunity_names[index])
                                  : `Note ${index + 1}`}
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
                  {familyRecord.opportunity_family_interview_notes &&
                  familyRecord.opportunity_family_interview_notes.some((note) => note) ? (
                    <div className="space-y-4">
                      {familyRecord.opportunity_family_interview_notes.map((note, index) => {
                        if (!note) return null;
                        return (
                          <div
                            key={`interview-note-${index}`}
                            className="border-l-4 border-secondary p-4 bg-secondary/5 rounded-md"
                          >
                            <div className="flex items-center mb-2">
                              <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                              <h5 className="text-sm font-medium">
                                {familyRecord.opportunity_names[index]
                                  ? extractStudentName(familyRecord.opportunity_names[index])
                                  : `Note ${index + 1}`}
                              </h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{note}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No family interview notes found for this family.
                      </p>
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
                  return status && (status.includes("Active") || status.includes("Open"));
                })
                .map(({ id, index }) => (
                  <Card key={id}>
                    <CardHeader>
                      <CardTitle className="text-lg">Tuition Offer #{index + 1}</CardTitle>
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
                          {familyRecord.tuition_offer_statuses[index] || "Unknown Status"}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-medium mb-1">Family Contribution</h5>
                          <p className="text-2xl font-semibold text-primary">
                            $
                            {(
                              familyRecord.tuition_offer_family_contributions[index] || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium mb-1">State Scholarship</h5>
                          <p className="text-2xl font-semibold text-accent-foreground">
                            $
                            {(
                              familyRecord.tuition_offer_state_scholarships[index] || 0
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4" />
                        <span>
                          Total Package: $
                          {(
                            (familyRecord.tuition_offer_family_contributions[index] || 0) +
                            (familyRecord.tuition_offer_state_scholarships[index] || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tuition offers found for this family.</p>
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
            href={
              familyRecord.id
                ? `https://primer.lightning.force.com/lightning/r/Account/${familyRecord.id}/view`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${!familyRecord.id ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            Salesforce
          </a>

          {/* PDC Link */}
          <a
            href={
              familyRecord.pdc_family_id_c
                ? `https://pdc.primerlearning.org/families/${familyRecord.pdc_family_id_c}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-10 px-4 py-2 ${!familyRecord.pdc_family_id_c ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            PDC Link
          </a>

          {/* Intercom Link */}
          <a
            href={
              familyRecord.contact_emails && familyRecord.contact_emails[0]
                ? `https://app.intercom.com/a/apps/default/users?email=${encodeURIComponent(familyRecord.contact_emails[0])}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${!familyRecord.contact_emails || !familyRecord.contact_emails[0] ? "opacity-50 pointer-events-none" : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
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

export default FamilyDetail;
