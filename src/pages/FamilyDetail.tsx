import React, { useEffect, useState } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LoadingState } from "@/components/LoadingState";
import { useToast } from "@/components/ui/use-toast";
import {
  Phone,
  Mail,
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
  CheckCircle2,
} from "lucide-react";

// Import the enhanced family data hook with mock data implementation
import { useEnhancedFamilyData, EnhancedFamilyRecord } from "@/hooks/useEnhancedFamilyData";

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
  const { loading, error, familyRecord, fetchFamilyRecord } = useEnhancedFamilyData();
  const { toast } = useToast();

  // Validate that the ID is valid
  const isValidId = familyId && /^[a-zA-Z0-9-]{15,36}$/.test(familyId);

  // Fetch family record using the mock data implementation
  useEffect(() => {
    if (!isValidId) return;

    console.log("FamilyDetail: Fetching family record for ID:", familyId);
    fetchFamilyRecord(familyId);
  }, [familyId, isValidId, fetchFamilyRecord]);

  if (!isValidId) {
    return <Navigate to="/not-found" replace />;
  }

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
                <li>Check your network connection</li>
                <li>Verify the API service is working</li>
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

  // Process student data from family record
  const processStudentData = (familyRecord: EnhancedFamilyRecord) => {
    if (!familyRecord.students || familyRecord.students.length === 0) {
      return [];
    }

    return familyRecord.students.map(student => {
      const opportunities = student.opportunities.map((opp, index) => ({
        id: opp.id,
        index,
        name: opp.name,
        schoolYear: opp.school_year,
        stage: opp.stage,
        isWon: opp.is_won
      }));

      return {
        id: student.id,
        name: student.full_name,
        firstName: student.first_name,
        lastName: student.last_name,
        opportunities
      };
    });
  };

  const students = processStudentData(familyRecord);

  // Render students section
  const renderStudentsSection = () => {
    if (!students || students.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No students found for this family.</p>
        </div>
      );
    }

    // Create tabs for each student
    return (
      <Tabs
        defaultValue={students[0]?.id || "default"}
        className="w-full"
      >
        <TabsList className="mb-4 flex-wrap h-auto py-1">
          {students.map((student) => (
            <TabsTrigger
              key={student.id}
              value={student.id}
              className="px-4 py-2 text-sm"
            >
              {student.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {students.map((student) => (
          <TabsContent key={student.id} value={student.id}>
            <StudentTimeline
              studentName={student.name}
              opportunities={student.opportunities}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  // Process the lead notes and family interview notes from student opportunities
  const getAllLeadNotes = () => {
    if (!familyRecord.students) return [];
    
    return familyRecord.students
      .flatMap(student => 
        student.opportunities
          .filter(opp => opp.lead_notes)
          .map(opp => ({
            studentName: student.full_name,
            opportunityId: opp.id,
            opportunityName: opp.name,
            note: opp.lead_notes
          }))
      )
      .filter(item => item.note);
  };

  const getAllFamilyInterviewNotes = () => {
    if (!familyRecord.students) return [];
    
    return familyRecord.students
      .flatMap(student => 
        student.opportunities
          .filter(opp => opp.family_interview_notes)
          .map(opp => ({
            studentName: student.full_name,
            opportunityId: opp.id,
            opportunityName: opp.name, 
            note: opp.family_interview_notes
          }))
      )
      .filter(item => item.note);
  };

  const leadNotes = getAllLeadNotes();
  const familyInterviewNotes = getAllFamilyInterviewNotes();

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
              {familyRecord.students &&
                familyRecord.students.some(student => 
                  student.opportunities.some(opp => 
                    opp.is_won && opp.school_year?.includes("25/26")
                  )
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
                  {familyRecord.current_campus_name || "Not Assigned"}
                </span>
              </Badge>

              {/* Students Badge - using the exact structure from the screenshot */}
              <div className="flex items-center border border-muted/40 rounded-full py-1.5 px-3">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                <span className="text-sm font-medium">
                  {familyRecord.student_count || 0} Students
                </span>
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
                {familyRecord.contacts && familyRecord.contacts.length > 0 ? (
                  <div className="space-y-4">
                    {familyRecord.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors"
                      >
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {contact.first_name?.[0] || ""}
                              {contact.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            <div className="space-y-2 mt-2">
                              {contact.phone && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{contact.phone}</span>
                                </div>
                              )}
                              {contact.email && (
                                <div className="flex items-center">
                                  <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{contact.email}</span>
                                </div>
                              )}
                              {contact.last_activity_date && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>
                                    Last Activity:{" "}
                                    {new Date(
                                      contact.last_activity_date
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
                          {familyRecord.contacts && familyRecord.contacts.length > 0 &&
                          familyRecord.contacts.some(contact => contact.last_activity_date)
                            ? new Date(
                                Math.max(
                                  ...familyRecord.contacts
                                    .filter(contact => contact.last_activity_date)
                                    .map(contact => new Date(contact.last_activity_date).getTime())
                                )
                              ).toLocaleDateString()
                            : "No activity"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Most recent contact interaction
                        </div>
                      </div>
                    </div>

                    {/* Student Count */}
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Students</div>
                        <div className="font-medium">
                          {familyRecord.student_count || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total students in family
                        </div>
                      </div>
                    </div>

                    {/* Family Since Date */}
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Family Since</div>
                        <div className="font-medium">
                          {familyRecord.students && familyRecord.students.length > 0 &&
                          familyRecord.students.some(student => student.opportunities && student.opportunities.length > 0)
                            ? new Date(
                                Math.min(
                                  ...familyRecord.students
                                    .flatMap(student => student.opportunities)
                                    .filter(opp => opp.created_date)
                                    .map(opp => new Date(opp.created_date).getTime())
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
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Notes</h2>
          <Card>
            <CardContent className="p-6">
              <Tabs defaultValue="lead-notes" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lead-notes">Lead Notes</TabsTrigger>
                  <TabsTrigger value="interview-notes">Family Interview Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="lead-notes" className="mt-4">
                  {leadNotes && leadNotes.length > 0 ? (
                    <div className="space-y-4">
                      {leadNotes.map((noteItem, index) => (
                        <div
                          key={`lead-note-${index}`}
                          className="border-l-4 border-primary p-4 bg-primary/5 rounded-md"
                        >
                          <div className="flex items-center mb-2">
                            <ClipboardList className="h-4 w-4 mr-2 text-muted-foreground" />
                            <h5 className="text-sm font-medium">
                              {noteItem.studentName}
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground">{noteItem.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No lead notes found for this family.</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="interview-notes" className="mt-4">
                  {familyInterviewNotes && familyInterviewNotes.length > 0 ? (
                    <div className="space-y-4">
                      {familyInterviewNotes.map((noteItem, index) => (
                        <div
                          key={`interview-note-${index}`}
                          className="border-l-4 border-secondary p-4 bg-secondary/5 rounded-md"
                        >
                          <div className="flex items-center mb-2">
                            <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                            <h5 className="text-sm font-medium">
                              {noteItem.studentName}
                            </h5>
                          </div>
                          <p className="text-sm text-muted-foreground">{noteItem.note}</p>
                        </div>
                      ))}
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
      </div>

      {/* Links / Resources Section */}
      <div className="bg-muted/20 rounded-lg p-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">Resources</h2>
        <div className="flex flex-wrap gap-4">
          {/* Salesforce Link */}
          <a
            href={
              familyRecord.family_id
                ? `https://primer.lightning.force.com/lightning/r/Account/${familyRecord.family_id}/view`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${!familyRecord.family_id ? "opacity-50 pointer-events-none" : ""}`}
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
              familyRecord.contacts && familyRecord.contacts[0]?.email
                ? `https://app.intercom.com/a/apps/default/users?email=${encodeURIComponent(familyRecord.contacts[0].email)}`
                : "#"
            }
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${!familyRecord.contacts || !familyRecord.contacts[0]?.email ? "opacity-50 pointer-events-none" : ""}`}
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