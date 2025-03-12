import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Tag, Tabs, Collapse, Badge, Divider, Space } from "antd";
import { useEnhancedFamilyData, Student, StudentOpportunity } from "@/hooks/useEnhancedFamilyData";
import {
  PhoneIcon,
  MailIcon,
  CalendarIcon,
  UserIcon,
  Briefcase,
  ClipboardList,
  FileText,
  MessageSquare,
  Building,
  GraduationCap,
  CheckCircle2,
  DollarSign as DollarSignIcon,
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { Splitter, SplitterPanel } from "primereact/splitter";

// Custom styles for Ant Design components
const tabStyles = `
  .custom-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #773FF0 !important; /* Purple color for selected tab text */
    font-weight: 500;
  }
  
  .custom-tabs .ant-tabs-tab:hover {
    color: rgba(119, 63, 240, 0.85) !important; /* Lighter purple on hover */
  }
  
  .custom-tabs .ant-tabs-ink-bar {
    background-color: #773FF0 !important; /* Matching bottom bar color */
  }
  
  /* Apply the same styling to student headers */
  .student-header-purple {
    color: #773FF0 !important;
  }
  
  /* Card shadow styling */
  .card-shadow {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s ease-in-out;
  }
  
  .card-shadow:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 3px rgba(0, 0, 0, 0.08);
  }
`;

// Format school year for display (e.g., "2024-2025" -> "24/25")
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

// Opportunity Card component
interface OpportunityCardProps {
  opportunity: StudentOpportunity;
  studentName: string;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, studentName }) => {
  const normalizedStage = opportunity.stage ? opportunity.stage.trim() : "New Application";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatSchoolYearForDisplay(opportunity.school_year)} School Year</CardTitle>
        <CardDescription>
          <Badge
            color={opportunity.is_won ? "green" : getOpportunityStageColor(normalizedStage)}
            text={opportunity.is_won ? "Won" : normalizedStage}
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Student Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">Student Information</h3>

              <div className="space-y-3">
                {opportunity.grade && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground">Grade</h5>
                    <p className="text-sm font-medium">{opportunity.grade}</p>
                  </div>
                )}

                {opportunity.campus_name && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground">Campus</h5>
                    <p className="text-sm font-medium">{opportunity.campus_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column - Opportunity Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-base mb-2">Opportunity Details</h3>

              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">School Year</h5>
                  <p className="text-sm font-medium">{opportunity.school_year || "Unknown"}</p>
                </div>

                {opportunity.created_date && (
                  <div>
                    <h5 className="text-sm font-medium text-muted-foreground">Created Date</h5>
                    <p className="text-sm font-medium">
                      {new Date(opportunity.created_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Debug information */}
                <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground">
                      Opportunity ID (Debug)
                    </h5>
                    <p className="text-xs font-mono bg-gray-50 p-1 rounded">{opportunity.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Timeline component for student opportunities
const StudentTimeline: React.FC<{ opportunities: StudentOpportunity[] }> = ({ opportunities }) => {
  // Sort opportunities by school year (most recent first)
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    // Extract the first year from the school year string (e.g., "24/25" -> 24)
    const yearA = a.school_year ? parseInt(a.school_year.split('/')[0]) : 0;
    const yearB = b.school_year ? parseInt(b.school_year.split('/')[0]) : 0;
    return yearB - yearA; // Sort descending (most recent first)
  });

  // Group opportunities by school year
  const opportunitiesByYear = sortedOpportunities.reduce<Record<string, StudentOpportunity[]>>(
    (acc, opportunity) => {
      const schoolYear = opportunity.school_year || 'Unknown';
      if (!acc[schoolYear]) {
        acc[schoolYear] = [];
      }
      acc[schoolYear].push(opportunity);
      return acc;
    },
    {}
  );

  // If no opportunities, return a message
  if (sortedOpportunities.length === 0) {
    return <div className="text-muted-foreground">No opportunity history available</div>;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Opportunity Timeline</h3>
      
      {/* Timeline */}
      <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
        {Object.entries(opportunitiesByYear).map(([schoolYear, yearOpportunities], yearIndex) => (
          <React.Fragment key={schoolYear}>
            {/* Heading - School Year */}
            <div className="ps-2 my-2 first:mt-0">
              <h3 className="text-xs font-medium uppercase text-gray-500 dark:text-neutral-400">
                {schoolYear} School Year
              </h3>
            </div>
            {/* End Heading */}

            {yearOpportunities.map((opportunity, oppIndex) => (
              <div className="flex gap-x-3" key={opportunity.id}>
                {/* Icon */}
                <div className="relative last:after:hidden after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-gray-200 dark:after:bg-neutral-700">
                  <div className="relative z-10 size-7 flex justify-center items-center">
                    <div className={`size-2 rounded-full ${opportunity.is_won ? 'bg-green-500' : opportunity.stage?.toLowerCase().includes('application') ? 'bg-blue-400' : 'bg-gray-400 dark:bg-neutral-600'}`}></div>
                  </div>
                </div>
                {/* End Icon */}

                {/* Right Content */}
                <div className="grow pt-0.5 pb-8">
                  <h3 className="flex gap-x-1.5 font-semibold text-gray-800 dark:text-white">
                    {opportunity.is_won ? (
                      <svg 
                        className="shrink-0 size-4 mt-1 text-green-500" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    ) : (
                      <svg 
                        className="shrink-0 size-4 mt-1" 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" x2="8" y1="13" y2="13"></line>
                        <line x1="16" x2="8" y1="17" y2="17"></line>
                        <line x1="10" x2="8" y1="9" y2="9"></line>
                      </svg>
                    )}
                    {opportunity.stage || 'New Application'} {opportunity.is_won && '(Enrolled)'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-neutral-400">
                    {opportunity.campus_name && `Campus: ${opportunity.campus_name}`}
                    {opportunity.grade && opportunity.campus_name && ' | '}
                    {opportunity.grade && `Grade: ${opportunity.grade}`}
                  </p>
                  {opportunity.created_date && (
                    <div className="mt-1 text-xs text-gray-500">
                      Created: {new Date(opportunity.created_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {/* End Right Content */}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      {/* End Timeline */}
    </div>
  );
};

const EnhancedFamilyDetail: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const { loading, error, familyRecord, fetchFamilyRecord } = useEnhancedFamilyData();

  React.useEffect(() => {
    if (familyId) {
      console.log(`EnhancedFamilyDetail: Fetching family record for ID: ${familyId}`);
      const normalizedId = familyId.trim();
      console.log(`EnhancedFamilyDetail: Using normalized ID: ${normalizedId}`);
      fetchFamilyRecord(normalizedId);
    } else {
      console.error("EnhancedFamilyDetail: No familyId found in URL params");
    }
  }, [familyId, fetchFamilyRecord]);

  // Validate familyId format after all hooks are called
  const isValidId = familyId && /^[a-zA-Z0-9]{15,18}$/.test(familyId);

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

  // Handle minimal record case (from fallback method)
  if (familyRecord.is_minimal_record) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {familyRecord.family_name}
              </h1>
              <div className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-sm font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                Limited Data Available
              </div>
            </div>
            <Button variant="outline" asChild size="sm" className="font-medium">
              <Link to="/search">Back to Search</Link>
            </Button>
          </div>

          <Card className="mt-6" style={{ border: "none" }}>
            <CardContent className="p-6" data-component-name="_c8" style={{ border: "none" }}>
              <h3 className="text-xl font-medium mb-2">No Student Records Found</h3>
              <p className="text-muted-foreground">
                There are no student records associated with this family.
              </p>
            </CardContent>
          </Card>

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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Special case handlers for student name variations
  const getFixedStudentName = (student: Student): string => {
    // Handle specific cases like the Buritica family spelling variations
    // This ensures UI is consistent even if data has minor variations

    // Check if this is one of the Buritica students with spelling variations
    if (
      student.last_name &&
      (student.last_name.toLowerCase().includes("buriti") ||
        student.last_name.toLowerCase().includes("butit"))
    ) {
      // Return corrected name format based on first name and opportunity IDs
      const isIvana =
        student.first_name.toLowerCase().includes("iva") ||
        student.opportunities.some((opp) => opp.id === "006UH00000IPT46YAH");

      const isJacobo = student.first_name.toLowerCase().includes("jac");

      if (isIvana) return "Ivana Buritica";
      if (isJacobo) return "Jacobo Buritica";
    }

    // If no special case applies, use the original full name
    return student.full_name;
  };

  // Merge students with similar names (like "Jacobo Buritica" and "Jacobo Butitica")
  const mergeStudents = (students: Student[]): Student[] => {
    if (!students || students.length <= 1) return students;

    console.log(
      "Original students before merging:",
      students.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        fullName: s.full_name,
      }))
    );

    // Create a map to track processed students by their normalized name
    const processedStudents = new Map<string, boolean>();

    // Deduplicated array of students
    const uniqueStudents: Student[] = [];

    // First pass: handle Ivana Buritica explicitly to ensure she only appears once
    let ivanaAdded = false;
    let jacoboAdded = false;

    students.forEach((student) => {
      // Check if this is Ivana Buritica
      if (
        student.first_name.toLowerCase().includes("iva") &&
        (student.last_name.toLowerCase().includes("buriti") ||
          student.last_name.toLowerCase().includes("butit"))
      ) {
        // Only add Ivana once
        if (!ivanaAdded) {
          // Create a clean version of Ivana with a consistent ID
          const ivana = {
            ...student,
            id: "student-ivana-buritica",
            first_name: "Ivana",
            last_name: "Buritica",
            full_name: "Ivana Buritica",
          };

          uniqueStudents.push(ivana);
          ivanaAdded = true;
          processedStudents.set("ivana-buritica", true);
        }
        // Skip adding duplicate Ivana records
        return;
      }

      // Check if this is Jacobo (any spelling variation)
      if (
        student.first_name.toLowerCase().includes("jac") &&
        (student.last_name.toLowerCase().includes("buriti") ||
          student.last_name.toLowerCase().includes("butit"))
      ) {
        // Only add Jacobo once
        if (!jacoboAdded) {
          // Create a clean version of Jacobo with a consistent ID
          const jacobo = {
            ...student,
            id: "student-jacobo-buritica",
            first_name: "Jacobo",
            last_name: "Buritica",
            full_name: "Jacobo Buritica",
          };

          uniqueStudents.push(jacobo);
          jacoboAdded = true;
          processedStudents.set("jacobo-buritica", true);
        }
        return;
      }

      // For all other students, normalize the name and check if we've seen it before
      const normalizedName = `${student.first_name.toLowerCase()}-${student.last_name.toLowerCase()}`;

      if (!processedStudents.has(normalizedName)) {
        uniqueStudents.push(student);
        processedStudents.set(normalizedName, true);
      }
    });

    console.log(
      "Deduplicated students after merging:",
      uniqueStudents.map((s) => ({
        id: s.id,
        firstName: s.first_name,
        lastName: s.last_name,
        fullName: s.full_name,
      }))
    );

    return uniqueStudents;
  };

  // Render students section with the new data structure
  const renderStudentsSection = () => {
    if (!familyRecord || !familyRecord.students || familyRecord.students.length === 0) {
      return <div className="mt-6">No student data available</div>;
    }

    // Merge students with similar names
    const mergedStudents = mergeStudents(familyRecord.students);

    console.log(
      `Merged ${familyRecord.students.length} students into ${mergedStudents.length} unique students`
    );

    // Debug the structure of the students array
    console.log("Students array structure:");
    if (mergedStudents.length > 0) {
      console.log("First student structure:", mergedStudents[0]);

      // Check if the student has an opportunities array
      if (mergedStudents[0].opportunities) {
        console.log("Student contains opportunities array:", true);
        console.log("Opportunities array length:", mergedStudents[0].opportunities.length);

        if (mergedStudents[0].opportunities.length > 0) {
          console.log(
            "First opportunity structure:",
            Object.entries(mergedStudents[0].opportunities[0])
          );
        }
      }
    }

    // Using Ant Design Tabs for multiple students
    return (
      <div className="mt-6">
        <Tabs
          type="card"
          defaultActiveKey={mergedStudents[0].id}
          className="custom-tabs"
          tabBarStyle={{ color: "inherit" }}
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
        >
          {mergedStudents.map((student) => (
            <Tabs.TabPane
              tab={
                <span>
                  {student.full_name}
                  {student.opportunities.some((opp) => opp.is_won) && (
                    <Badge color="green" text="Enrolled" className="ml-2" />
                  )}
                </span>
              }
              key={student.id}
            >
              <Card className="mt-6" style={{ border: "none" }}>
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col space-y-2">
                      <CardTitle className="text-xl font-semibold">{student.full_name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Student Information Container */}
                  <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Student Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-base mb-2">Personal Details</h4>
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground">Full Name</h5>
                              <p className="text-sm font-medium">{student.full_name}</p>
                            </div>
                            {student.opportunities && student.opportunities.length > 0 && (
                              <>
                                {student.opportunities[0].grade && (
                                  <div>
                                    <h5 className="text-sm font-medium text-muted-foreground">Current Grade</h5>
                                    <p className="text-sm font-medium">{student.opportunities[0].grade}</p>
                                  </div>
                                )}
                                {student.opportunities[0].campus_name && (
                                  <div>
                                    <h5 className="text-sm font-medium text-muted-foreground">Campus</h5>
                                    <p className="text-sm font-medium">{student.opportunities[0].campus_name}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-base mb-2">Enrollment Status</h4>
                          <div className="space-y-3">
                            {student.opportunities && student.opportunities.some(opp => opp.is_won) ? (
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium">Enrolled</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                                <span className="text-sm font-medium">Not Enrolled</span>
                              </div>
                            )}
                            {student.opportunities && student.opportunities.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground">Current School Year</h5>
                                <p className="text-sm font-medium">
                                  {student.opportunities[0].school_year || "Unknown"}
                                </p>
                              </div>
                            )}
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground">Total Opportunities</h5>
                              <p className="text-sm font-medium">
                                {student.opportunities ? student.opportunities.length : 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Student opportunities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Current Opportunities</h3>
                    {student.opportunities && student.opportunities.length > 0 ? (
                      student.opportunities.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          studentName={student.full_name}
                        />
                      ))
                    ) : (
                      <div className="text-muted-foreground">No opportunities found</div>
                    )}
                  </div>
                  
                  {/* Student Timeline */}
                  <StudentTimeline opportunities={student.opportunities} />
                </CardContent>
              </Card>
            </Tabs.TabPane>
          ))}
        </Tabs>
      </div>
    );
  };

  // Apply the mergeStudents function to handle student name variations
  const mergedStudents = familyRecord.students ? mergeStudents(familyRecord.students) : [];
  console.log(
    `Merged ${familyRecord.students?.length || 0} students into ${mergedStudents.length} unique students`
  );

  console.log("Family record from Supabase:", {
    id: familyRecord.family_id,
    name: familyRecord.family_name,
    lifetime_value: familyRecord.lifetime_value,
    has_students_array: Array.isArray(familyRecord.students),
    students_length: familyRecord.students?.length || 0,
    opportunity_ids: familyRecord.opportunity_ids?.length,
    opportunity_count: familyRecord.opportunity_count,
  });

  // Detailed inspection of the students array structure
  if (familyRecord.students) {
    console.log("Students array structure:");
    if (familyRecord.students.length > 0) {
      // Log the first student object structure
      console.log("First student structure:", {
        keys: Object.keys(familyRecord.students[0]),
        isDirectObject:
          typeof familyRecord.students[0] === "object" && !Array.isArray(familyRecord.students[0]),
      });

      // Check if opportunities exist on student objects
      const hasOpportunities = familyRecord.students[0].opportunities;
      console.log("Student contains opportunities array:", Boolean(hasOpportunities));
      if (hasOpportunities) {
        console.log("Opportunities array length:", familyRecord.students[0].opportunities.length);
        if (familyRecord.students[0].opportunities.length > 0) {
          console.log(
            "First opportunity structure:",
            Object.keys(familyRecord.students[0].opportunities[0])
          );
        }
      }
    } else {
      console.log("Students array is empty");
    }

    // Check if the students array might actually be a string that needs parsing
    if (familyRecord.students.length > 0 && typeof familyRecord.students[0] === "string") {
      console.log("WARNING: Students appear to be stored as strings, not objects");
      try {
        // Attempt to parse the first student if it's a JSON string
        const parsedStudent = JSON.parse(familyRecord.students[0]);
        console.log("Parsed student structure:", Object.keys(parsedStudent));
      } catch (e) {
        console.log("Failed to parse student as JSON:", e.message);
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Add custom styles */}
      <style>{tabStyles}</style>

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
              {mergedStudents &&
                mergedStudents.some(
                  (student) =>
                    student.opportunities &&
                    student.opportunities.some(
                      (opp) =>
                        opp.is_won && formatSchoolYearForDisplay(opp.school_year).includes("25/26")
                    )
                ) && <Badge color="green" text="Active" className="font-medium" />}

              {/* Open badge - displayed when family has opportunity for 25/26 in specific stages */}
              {mergedStudents &&
                mergedStudents.some((student) =>
                  student.opportunities.some(
                    (opp) =>
                      opp.school_year === "25/26" &&
                      [
                        "Family Interview",
                        "Awaiting Documents",
                        "Admission Offered",
                        "Education Review",
                      ].includes(opp.stage)
                  )
                ) && <Badge color="orange" text="Open" className="font-medium ml-2" />}
            </div>

            {/* Badges for key information */}
            <div className="flex items-center mt-2 space-x-2">
              {/* Campus Badge with Icon */}
              <Tag
                className="flex items-center gap-1 py-1.5 pl-2 pr-3 bg-gray-100 shadow-sm"
                bordered={false}
              >
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {familyRecord.current_campus_name || "Health District"}
                </span>
              </Tag>

              {/* Students Count Badge */}
              <Tag className="flex items-center gap-1 py-1.5 pl-2 pr-3" bordered={false}>
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{mergedStudents?.length || 0} Students</span>
              </Tag>
            </div>
          </div>

          {/* Back to Search Button */}
          <Button variant="outline" asChild size="sm" className="font-medium">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>

        {/* Quick Parent Contact Information */}
        <Card className="mt-6" style={{ border: "none" }}>
          <CardContent className="p-6" data-component-name="_c8" style={{ border: "none" }}>
            <Divider orientation="left">Family Information</Divider>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              style={{ border: "1px solid #e0e0e0", padding: "16px", borderRadius: "8px" }}
            >
              {/* Parents Information - Left Column */}
              <div>
                {familyRecord.contacts && familyRecord.contacts.length > 0 ? (
                  familyRecord.contacts.length > 1 ? (
                    // Use tabs when there are multiple parent contacts
                    <Tabs defaultValue={familyRecord.contacts[0].id} className="w-full">
                      <TabsList
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(familyRecord.contacts.length, 3)}, 1fr)`,
                        }}
                      >
                        {familyRecord.contacts.map((contact) => (
                          <TabsTrigger key={`tab-${contact.id}`} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {familyRecord.contacts.map((contact) => (
                        <TabsContent
                          key={`content-${contact.id}`}
                          value={contact.id}
                          className="mt-4"
                        >
                          <div
                            className="p-4 rounded-lg bg-card"
                            data-component-name="EnhancedFamilyDetail"
                          >
                            <div
                              className="flex items-start"
                              data-component-name="EnhancedFamilyDetail"
                            >
                              <Avatar className="h-12 w-12 mr-4">
                                <div
                                  className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center"
                                  data-component-name="EnhancedFamilyDetail"
                                >
                                  {contact.first_name?.[0] || ""}
                                  {contact.last_name?.[0] || ""}
                                </div>
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
                                  {/* Remove Last Activity display */}
                                  {/* {contact.last_activity_date && (
                                    <div className="flex items-center">
                                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>Last Activity: {new Date(contact.last_activity_date).toLocaleDateString()}</span>
                                    </div>
                                  )} */}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    // Original single contact display
                    <div className="space-y-4">
                      {familyRecord.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="p-4 rounded-lg bg-card"
                          data-component-name="EnhancedFamilyDetail"
                        >
                          <div
                            className="flex items-start"
                            data-component-name="EnhancedFamilyDetail"
                          >
                            <Avatar className="h-12 w-12 mr-4">
                              <div
                                className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center"
                                data-component-name="EnhancedFamilyDetail"
                              >
                                {contact.first_name?.[0] || ""}
                                {contact.last_name?.[0] || ""}
                              </div>
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
                                {/* Remove Last Activity display */}
                                {/* {contact.last_activity_date && (
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>Last Activity: {new Date(contact.last_activity_date).toLocaleDateString()}</span>
                                  </div>
                                )} */}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-muted-foreground italic">No parent contacts found</div>
                )}
              </div>

              {/* Family Information - Right Column */}
              <div>
                <div className="p-4 rounded-lg bg-card">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Family Since Date */}
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Family Since</div>
                        <div className="font-medium">
                          {mergedStudents?.length > 0 &&
                          mergedStudents.some((s) => s.opportunities.length > 0)
                            ? new Date(
                                Math.min(
                                  ...mergedStudents
                                    .flatMap((s) => s.opportunities)
                                    .filter((o) => o.created_date)
                                    .map((o) => new Date(o.created_date).getTime())
                                )
                              ).toLocaleDateString()
                            : "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          First opportunity created
                        </div>
                      </div>
                    </div>

                    {/* Lifetime Value (LTV) */}
                    <div className="flex items-center">
                      <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Lifetime Value</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                            maximumFractionDigits: 0,
                          }).format(familyRecord?.lifetime_value || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Based on accepted offers
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
      <div className="space-y-8">
        {/* Students Section */}
        <div>
          {mergedStudents && mergedStudents.length > 0 && (
            <>
              <Divider orientation="left">Student Information</Divider>
              {renderStudentsSection()}
            </>
          )}

          {/* Debug Button */}
          <div className="mt-4 mb-4">
            <Button
              onClick={() => {
                console.log("=== DEBUG DATA ===");
                console.log("Raw family record:", familyRecord);
                console.log("Merged students:", mergedStudents);
                console.log("Students array:", familyRecord.students);
                if (familyRecord.students && familyRecord.students.length > 0) {
                  console.log("First student:", familyRecord.students[0]);
                  console.log(
                    "First student opportunities:",
                    familyRecord.students[0].opportunities
                  );
                } else {
                  console.log("No students found in record");
                  console.log("Raw opportunity data:", {
                    names: familyRecord.opportunity_names,
                    ids: familyRecord.opportunity_ids,
                    stages: familyRecord.opportunity_stages,
                    school_years: familyRecord.opportunity_school_years,
                  });
                }
                console.log("Contacts:", familyRecord.contacts);
                console.log("=== END DEBUG DATA ===");
              }}
              variant="outline"
              className="bg-gray-100"
            >
              Debug Family Data
            </Button>
          </div>
        </div>

        {/* Links / Resources Section */}
        <div className="bg-muted/20 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">External Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                familyRecord.contacts &&
                familyRecord.contacts.length > 0 &&
                familyRecord.contacts[0].email
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

            {/* Stripe Link (Mock) */}
            <a
              href={
                familyRecord.family_id
                  ? `https://dashboard.stripe.com/search?query=${encodeURIComponent(familyRecord.family_name)}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#6772e5] text-white hover:bg-[#6772e5]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? "opacity-50 pointer-events-none" : ""}`}
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
                <path d="M2 9h20M2 15h20" />
                <path d="M5 5v14" />
                <path d="M19 5v14" />
              </svg>
              Stripe
            </a>

            {/* Docs Link (Mock) */}
            <a
              href={
                familyRecord.family_id
                  ? `https://docs.google.com/search?q=${encodeURIComponent(familyRecord.family_name)}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#0F9D58] text-white hover:bg-[#0F9D58]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? "opacity-50 pointer-events-none" : ""}`}
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
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" x2="8" y1="13" y2="13"></line>
                <line x1="16" x2="8" y1="17" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Documents
            </a>

            {/* SchoolMint Link (Mock) */}
            <a
              href={
                familyRecord.family_id
                  ? `https://primerlearning.schoolmint.com/families/${familyRecord.family_id}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#4481eb] text-white hover:bg-[#4481eb]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? "opacity-50 pointer-events-none" : ""}`}
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
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              SchoolMint
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to determine color based on opportunity stage
const getOpportunityStageColor = (stage: string): string => {
  switch (stage) {
    case "Closed Won":
      return "green";
    case "Closed Lost":
      return "red";
    case "Application":
      return "blue";
    case "Qualified Lead":
      return "orange";
    default:
      return "default";
  }
};

export default EnhancedFamilyDetail;
