import React from "react";
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
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";

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

// StudentTimeline component displays enrollment history
interface TimelineProps {
  student: Student;
}

const StudentTimeline: React.FC<TimelineProps> = ({ student }) => {
  // Filter to only show won opportunities
  const wonOpportunities = student.opportunities.filter((opp) => opp.is_won);

  // Don't show timeline if no won opportunities
  if (wonOpportunities.length === 0) return null;

  // Get school years from won opportunities
  const opportunitiesByYear = wonOpportunities.reduce(
    (acc, opp) => {
      const year = opp.school_year;
      if (!acc[year]) acc[year] = [];
      acc[year].push(opp);
      return acc;
    },
    {} as Record<string, StudentOpportunity[]>,
  );

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

  return (
    <div className="mt-6 mb-8 bg-muted/10 p-4 rounded-lg border border-muted">
      <h4 className="text-sm font-medium mb-4">Enrollment Timeline</h4>
      <div className="relative w-full">
        <div className="flex flex-col">
          {/* Horizontal layout for timeline nodes */}
          <div className="flex items-center justify-between mb-2 relative px-8">
            {/* Connector line spanning the width */}
            <div className="absolute h-0.5 top-4 left-12 right-12 bg-muted-foreground/30"></div>

            {years.map((year, idx) => {
              const displayYear = year.split("-")[0];
              // Check if student is enrolled in this year
              const hasWonOpportunity = Object.keys(opportunitiesByYear).some(oppYear => {
                const formattedYear = formatSchoolYearForDisplay(oppYear);
                const yearToCheck = formatSchoolYearForDisplay(year);
                return formattedYear === yearToCheck;
              });

              return (
                <div
                  key={year}
                  className="flex flex-col items-center z-10"
                  style={{ width: "80px" }}
                >
                  {/* Circle node */}
                  {hasWonOpportunity ? (
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
              const yearLabel = formatSchoolYearForDisplay(year);
              
              // Check if student is enrolled in this year
              const hasWonOpportunity = Object.keys(opportunitiesByYear).some(oppYear => {
                return formatSchoolYearForDisplay(oppYear) === yearLabel;
              });

              // Different styling based on status
              let badgeClass = "text-xs rounded px-2 py-0.5 font-medium ";
              if (hasWonOpportunity) {
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

// Opportunity Card component
interface OpportunityCardProps {
  opportunity: StudentOpportunity;
  studentName: string;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, studentName }) => {
  const normalizedStage = opportunity.stage ? opportunity.stage.trim() : "New Application";
  
  return (
    <Card className={opportunity.is_won ? "border-l-4 border-l-green-500" : ""}>
      <CardHeader>
        <CardTitle>
          {formatSchoolYearForDisplay(opportunity.school_year)} School Year
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
                    {studentName}
                  </p>
                </div>
                
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
              <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">Opportunity Details</h3>
              
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-muted-foreground">School Year</h5>
                  <p className="text-sm font-medium">
                    {opportunity.school_year || "Unknown"}
                  </p>
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
                    <h5 className="text-xs font-medium text-muted-foreground">Opportunity ID (Debug)</h5>
                    <p className="text-xs font-mono bg-gray-50 p-1 rounded">
                      {opportunity.id}
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
          
          <Card className="mt-6 border-muted/40 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle>Basic Family Information</CardTitle>
              <CardDescription>
                Limited data is available due to a database connection issue.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Family Name</h3>
                    <p className="text-base font-medium">{familyRecord.family_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Family ID</h3>
                    <p className="text-base font-mono text-xs bg-muted p-1 rounded">{familyRecord.family_id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">PDC Family ID</h3>
                    <p className="text-base font-medium">{familyRecord.pdc_family_id_c || "Not available"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Campus</h3>
                    <p className="text-base font-medium">{familyRecord.current_campus_name || "Not assigned"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-orange-50 p-4 border-t border-orange-100">
              <div className="flex items-start">
                <div className="mr-3 mt-1 flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4 text-orange-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Limited Data Mode</h3>
                  <p className="mt-1 text-sm text-orange-700">
                    Unable to retrieve complete family data. Only basic information is displayed.
                    Try refreshing the page or check database connectivity.
                  </p>
                  <div className="mt-3">
                    <button 
                      className="inline-flex items-center rounded-md bg-orange-100 px-2 py-1 text-sm font-medium text-orange-700 hover:bg-orange-200"
                      onClick={() => window.location.reload()}
                    >
                      Retry Loading Complete Data
                    </button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
          
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render students section with the new data structure
  const renderStudentsSection = () => {
    if (!familyRecord.students || familyRecord.students.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No students found for this family.
          </p>
        </div>
      );
    }

    if (familyRecord.students.length > 1) {
      return (
        <Tabs defaultValue={familyRecord.students[0].id} className="w-full">
          <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(familyRecord.students.length, 4)}, 1fr)` }}>
            {familyRecord.students.map((student) => (
              <TabsTrigger key={`tab-${student.id}`} value={student.id}>
                {student.full_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {familyRecord.students.map((student) => (
            <TabsContent key={`content-${student.id}`} value={student.id} className="mt-4">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl font-semibold">
                    {student.full_name}
                    {student.opportunities.some(opp => opp.is_won) && (
                      <Badge variant="success" className="ml-2">Enrolled</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Timeline visualization for student's enrollment history */}
                  <StudentTimeline student={student} />
                  
                  {/* Opportunity cards for this student */}
                  <div className="space-y-4 mt-4">
                    {student.opportunities.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity} 
                        studentName={student.full_name}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      );
    } else if (familyRecord.students.length === 1) {
      // If there's only one student, just show the cards without tabs
      const student = familyRecord.students[0];
      return (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold">
              {student.full_name}
              {student.opportunities.some(opp => opp.is_won) && (
                <Badge variant="success" className="ml-2">Enrolled</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudentTimeline student={student} />
            
            <div className="space-y-4 mt-4">
              {student.opportunities.map((opportunity) => (
                <OpportunityCard 
                  key={opportunity.id} 
                  opportunity={opportunity} 
                  studentName={student.full_name}
                />
              ))}
            </div>
          </CardContent>
        </Card>
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
              {familyRecord.students && familyRecord.students.some(student => 
                student.opportunities && student.opportunities.some(opp => 
                  opp.is_won && 
                  formatSchoolYearForDisplay(opp.school_year).includes("25/26")
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
                {familyRecord.contacts && familyRecord.contacts.length > 0 ? (
                  <div className="space-y-4">
                    {familyRecord.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors"
                      >
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-4">
                            <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
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
                              {contact.last_activity_date && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Last Activity: {new Date(contact.last_activity_date).toLocaleDateString()}</span>
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
                
                <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Students count */}
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Students</div>
                        <div className="font-medium">
                          {familyRecord.students?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total students</div>
                      </div>
                    </div>
                    
                    {/* Opportunities count */}
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Opportunities</div>
                        <div className="font-medium">
                          {familyRecord.students?.reduce((total, student) => 
                            total + student.opportunities.length, 0) || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Total opportunities</div>
                      </div>
                    </div>
                    
                    {/* Family Since Date */}
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Family Since</div>
                        <div className="font-medium">
                          {familyRecord.students?.length > 0 && 
                           familyRecord.students.some(s => s.opportunities.length > 0) ? 
                            new Date(Math.min(...familyRecord.students
                              .flatMap(s => s.opportunities)
                              .filter(o => o.created_date)
                              .map(o => new Date(o.created_date).getTime())
                            )).toLocaleDateString() : 
                            "Unknown"
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">First opportunity created</div>
                      </div>
                    </div>
                    
                    {/* Active School Years */}
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Active School Years</div>
                        <div className="font-medium">
                          {familyRecord.students ? 
                            Array.from(new Set(
                              familyRecord.students
                                .flatMap(s => s.opportunities)
                                .filter(o => o.is_won)
                                .map(o => formatSchoolYearForDisplay(o.school_year))
                            )).join(", ") : 
                            "None"
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">Years with won opportunities</div>
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
              href={familyRecord.contacts && familyRecord.contacts.length > 0 && familyRecord.contacts[0].email ? 
                `https://app.intercom.com/a/apps/default/users?email=${encodeURIComponent(familyRecord.contacts[0].email)}` : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${!familyRecord.contacts || !familyRecord.contacts[0]?.email ? 'opacity-50 pointer-events-none' : ''}`}
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
    </div>
  );
};

export default EnhancedFamilyDetail;