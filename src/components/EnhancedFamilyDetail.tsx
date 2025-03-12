import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Tabs as ShadcnTabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Splitter, SplitterPanel } from 'primereact/splitter';

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
        <CardTitle>
          {formatSchoolYearForDisplay(opportunity.school_year)} School Year
        </CardTitle>
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
          
          <Card className="mt-6" style={{ border: 'none' }}>
            <CardContent className="p-6" data-component-name="_c8" style={{ border: 'none' }}>
              <h3 className="text-xl font-medium mb-2">No Student Records Found</h3>
              <p className="text-muted-foreground">There are no student records associated with this family.</p>
            </CardContent>
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

  // Special case handlers for student name variations
  const getFixedStudentName = (student: Student): string => {
    // Handle specific cases like the Buritica family spelling variations
    // This ensures UI is consistent even if data has minor variations
    
    // Check if this is one of the Buritica students with spelling variations
    if (student.last_name && 
        (student.last_name.toLowerCase().includes("buriti") || 
         student.last_name.toLowerCase().includes("butit"))) {
      
      // Return corrected name format based on opportunity IDs or other identifiers
      const isIvana = student.opportunities.some(opp => 
        opp.id === "006UH00000IPT46YAH" || 
        student.first_name.toLowerCase().includes("iva")
      );
      
      const isJacobo = student.first_name.toLowerCase().includes("jac");
      
      if (isIvana) return "Ivana Buritica";
      if (isJacobo) return "Jacobo Buritica";
    }
    
    return student.full_name;
  };
  
  // Merge students with similar names (like "Jacobo Buritica" and "Jacobo Butitica")
  const mergeStudents = (students: Student[]): Student[] => {
    if (!students || students.length <= 1) return students;
    
    // Group students by normalized name
    const studentsByName: Record<string, Student[]> = {};
    
    // First pass: group by normalized names
    students.forEach(student => {
      // Generate a normalized key for the student based on case-insensitive first name
      // and a simplified last name (to handle Buritica family special case)
      const firstName = student.first_name.toLowerCase();
      let lastName = student.last_name.toLowerCase();
      
      // Handle Buritica family special case
      if (lastName.includes("buriti") || lastName.includes("butit")) {
        lastName = "buritica";
      }
      
      const key = `${firstName}-${lastName}`;
      
      if (!studentsByName[key]) {
        studentsByName[key] = [];
      }
      studentsByName[key].push(student);
    });
    
    // Second pass: merge students with the same normalized name
    const mergedStudents: Student[] = [];
    
    Object.values(studentsByName).forEach(group => {
      if (group.length === 1) {
        // No need to merge
        mergedStudents.push(group[0]);
      } else {
        // Merge this group of students
        const mergedStudent: Student = {
          ...group[0],
          opportunities: []
        };
        
        // Combine all opportunities from the group
        group.forEach(student => {
          mergedStudent.opportunities = [
            ...mergedStudent.opportunities,
            ...student.opportunities
          ];
        });
        
        // Use the fixed name for this student
        mergedStudent.full_name = getFixedStudentName(mergedStudent);
        
        mergedStudents.push(mergedStudent);
      }
    });
    
    return mergedStudents;
  };

  // Render students section with the new data structure
  const renderStudentsSection = () => {
    if (!mergedStudents || mergedStudents.length === 0) {
      return (
        <Card className="mt-6" style={{ border: 'none' }}>
          <CardContent className="p-8" data-component-name="_c8" style={{ border: 'none' }}>
            <h3 className="text-xl font-medium mb-2">No Student Records Found</h3>
            <p className="text-muted-foreground">There are no student records associated with this family.</p>
          </CardContent>
        </Card>
      );
    }

    if (mergedStudents.length > 1) {
      // Using Ant Design Tabs for multiple students
      return (
        <div className="mt-6">
          <Tabs
            type="card"
            defaultActiveKey={mergedStudents[0].id}
            className="custom-tabs"
            tabBarStyle={{ color: 'inherit' }}
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
            items={mergedStudents.map((student) => {
              return {
                label: (
                  <span>
                    {getFixedStudentName(student)}
                    {student.opportunities.some(opp => opp.is_won) && (
                      <Badge color="green" text="Enrolled" className="ml-2" />
                    )}
                  </span>
                ),
                key: student.id,
                children: (
                  <Card className="mt-6" style={{ border: 'none' }}>
                    <CardHeader className="pb-0">
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col space-y-2">
                          <CardTitle className="text-xl font-semibold">
                            {getFixedStudentName(student)}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Use Splitter for student information and opportunities */}
                      <Splitter style={{ marginTop: 20 }}>
                        {/* Left Panel - Student Information */}
                        <SplitterPanel size={50}>
                          <div className="bg-card rounded-md p-4">
                            <div className="space-y-4">
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">Status</div>
                                <div className="font-medium flex items-center">
                                  {student.opportunities.some(opp => opp.is_won && 
                                    formatSchoolYearForDisplay(opp.school_year).includes("25/26")) ? (
                                    <>
                                      <Badge color="green" text="Enrolled for 25/26" />
                                    </>
                                  ) : student.opportunities.some(opp => opp.is_won && 
                                      formatSchoolYearForDisplay(opp.school_year).includes("24/25")) ? (
                                    <>
                                      <Badge color="green" text="Enrolled for 24/25" />
                                    </>
                                  ) : (
                                    <>
                                      <Badge color="blue" text="In Process" />
                                    </>
                                  )}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">Latest Grade</div>
                                <div className="font-medium">
                                  {student.opportunities.length > 0 
                                    ? student.opportunities
                                        .filter(opp => opp.grade)
                                        .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0]?.grade || "Not specified"
                                    : "Not specified"}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">Campus</div>
                                <div className="font-medium">
                                  {student.opportunities.length > 0 
                                    ? student.opportunities
                                        .filter(opp => opp.campus_name)
                                        .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0]?.campus_name || "Not assigned"
                                    : "Not assigned"}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">School Years</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Array.from(new Set(
                                    student.opportunities
                                      .filter(opp => opp.school_year)
                                      .map(opp => formatSchoolYearForDisplay(opp.school_year))
                                  )).map(year => (
                                    <Badge key={year} color={year === "24/25" ? "green" : "blue"} text={year} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </SplitterPanel>
                        
                        {/* Right Panel - Opportunities */}
                        <SplitterPanel size={50}>
                          <div className="bg-card rounded-md p-4">
                            <h3 className="text-lg font-medium mb-4">Opportunities</h3>
                            {student.opportunities.length > 0 ? (
                              <Collapse 
                                accordion 
                                items={student.opportunities.map((opportunity, index) => ({
                                  key: opportunity.id,
                                  label: (
                                    <div className="flex justify-between items-center">
                                      <span>{opportunity.name}</span>
                                      <Badge 
                                        color={opportunity.is_won ? "green" : getOpportunityStageColor(opportunity.stage)} 
                                        text={opportunity.is_won ? "Won" : opportunity.stage}
                                      />
                                    </div>
                                  ),
                                  children: <OpportunityCard opportunity={opportunity} studentName={getFixedStudentName(student)} />
                                }))}
                              />
                            ) : (
                              <div className="text-muted-foreground italic">
                                No opportunities found for this student.
                              </div>
                            )}
                          </div>
                        </SplitterPanel>
                      </Splitter>
                    </CardContent>
                  </Card>
                ),
              };
            })}
          />
        </div>
      );
    } else if (mergedStudents.length === 1) {
      // If there's only one student, just show the cards without tabs
      const student = mergedStudents[0];
      return (
        <Card className="mt-6" style={{ border: 'none' }}>
          <CardHeader className="pb-0">
            <CardTitle className="text-xl font-semibold">
              {getFixedStudentName(student)}
              {student.opportunities && student.opportunities.some(opp => opp.is_won) && (
                <Badge color="green" text="Enrolled" className="ml-2" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            {/* Use Splitter for student information and opportunities */}
            <Splitter style={{ marginTop: 20 }}>
              {/* Left Panel - Student Information */}
              <SplitterPanel size={50}>
                <div className="bg-card rounded-md p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <div className="font-medium flex items-center">
                        {student.opportunities.some(opp => opp.is_won && 
                          formatSchoolYearForDisplay(opp.school_year).includes("25/26")) ? (
                          <>
                            <Badge color="green" text="Enrolled for 25/26" />
                          </>
                        ) : student.opportunities.some(opp => opp.is_won && 
                          formatSchoolYearForDisplay(opp.school_year).includes("24/25")) ? (
                          <>
                            <Badge color="green" text="Enrolled for 24/25" />
                          </>
                        ) : (
                          <>
                            <Badge color="blue" text="In Process" />
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Latest Grade</div>
                      <div className="font-medium">
                        {student.opportunities.length > 0 
                          ? student.opportunities
                              .filter(opp => opp.grade)
                              .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0]?.grade || "Not specified"
                          : "Not specified"}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Campus</div>
                      <div className="font-medium">
                        {student.opportunities.length > 0 
                          ? student.opportunities
                              .filter(opp => opp.campus_name)
                              .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())[0]?.campus_name || "Not assigned"
                          : "Not assigned"}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">School Years</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.from(new Set(
                          student.opportunities
                            .filter(opp => opp.school_year)
                            .map(opp => formatSchoolYearForDisplay(opp.school_year))
                        )).map(year => (
                          <Badge key={year} color={year === "24/25" ? "green" : "blue"} text={year} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </SplitterPanel>
              
              {/* Right Panel - Opportunities */}
              <SplitterPanel size={50}>
                <div className="bg-card rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">Opportunities</h3>
                  {student.opportunities.length > 0 ? (
                    <Collapse 
                      accordion 
                      items={student.opportunities.map((opportunity, index) => ({
                        key: opportunity.id,
                        label: (
                          <div className="flex justify-between items-center">
                            <span>{opportunity.name}</span>
                            <Badge 
                              color={opportunity.is_won ? "green" : getOpportunityStageColor(opportunity.stage)} 
                              text={opportunity.is_won ? "Won" : opportunity.stage}
                            />
                          </div>
                        ),
                        children: <OpportunityCard opportunity={opportunity} studentName={getFixedStudentName(student)} />
                      }))}
                    />
                  ) : (
                    <div className="text-muted-foreground italic">
                      No opportunities found for this student.
                    </div>
                  )}
                </div>
              </SplitterPanel>
            </Splitter>
          </CardContent>
        </Card>
      );
    }
  };

  // Apply the mergeStudents function to handle student name variations
  const mergedStudents = familyRecord.students ? mergeStudents(familyRecord.students) : [];
  console.log(`Merged ${familyRecord.students?.length || 0} students into ${mergedStudents.length} unique students`);

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
              {mergedStudents && mergedStudents.some(student => 
                student.opportunities && student.opportunities.some(opp => 
                  opp.is_won && 
                  formatSchoolYearForDisplay(opp.school_year).includes("25/26")
                )
              ) && (
                <Badge color="green" text="Active" className="font-medium" />
              )}
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
              <Tag
                className="flex items-center gap-1 py-1.5 pl-2 pr-3"
                bordered={false}
              >
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {mergedStudents?.length || 0} Students
                </span>
              </Tag>
            </div>
          </div>

          {/* Back to Search Button */}
          <Button variant="outline" asChild size="sm" className="font-medium">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>

        {/* Quick Parent Contact Information */}
        <Card className="mt-6" style={{ border: 'none' }}>
          <CardContent className="p-6" data-component-name="_c8" style={{ border: 'none' }}>
            <Divider orientation="left">Family Information</Divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ border: '1px solid #e0e0e0', padding: '16px', borderRadius: '8px' }}>
              {/* Parents Information - Left Column */}
              <div>
                {familyRecord.contacts && familyRecord.contacts.length > 0 ? (
                  familyRecord.contacts.length > 1 ? (
                    // Use tabs when there are multiple parent contacts
                    <Tabs defaultValue={familyRecord.contacts[0].id} className="w-full">
                      <TabsList className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(familyRecord.contacts.length, 3)}, 1fr)` }}>
                        {familyRecord.contacts.map((contact) => (
                          <TabsTrigger key={`tab-${contact.id}`} value={contact.id}>
                            {contact.first_name} {contact.last_name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {familyRecord.contacts.map((contact) => (
                        <TabsContent key={`content-${contact.id}`} value={contact.id} className="mt-4">
                          <div
                            className="p-4 rounded-lg bg-card"
                            data-component-name="EnhancedFamilyDetail"
                          >
                            <div className="flex items-start" data-component-name="EnhancedFamilyDetail">
                              <Avatar className="h-12 w-12 mr-4">
                                <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center" data-component-name="EnhancedFamilyDetail">
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
                          <div className="flex items-start" data-component-name="EnhancedFamilyDetail">
                            <Avatar className="h-12 w-12 mr-4">
                              <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center" data-component-name="EnhancedFamilyDetail">
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
                  <div className="text-muted-foreground italic">
                    No parent contacts found
                  </div>
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
                           mergedStudents.some(s => s.opportunities.length > 0) ? 
                            new Date(Math.min(...mergedStudents
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
                    
                    {/* Lifetime Value (LTV) */}
                    <div className="flex items-center">
                      <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Lifetime Value</div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            maximumFractionDigits: 0
                          }).format(
                            // Mock LTV calculation based on number of opportunities and won status
                            mergedStudents?.flatMap(s => s.opportunities)
                              .filter(o => o.is_won)
                              .length * 12500 || 0
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">Total tuition revenue</div>
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
        </div>

        {/* Links / Resources Section */}
        <div className="bg-muted/20 rounded-lg p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">External Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            
            {/* Stripe Link (Mock) */}
            <a 
              href={familyRecord.family_id ? 
                `https://dashboard.stripe.com/search?query=${encodeURIComponent(familyRecord.family_name)}` : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#6772e5] text-white hover:bg-[#6772e5]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                <path d="M2 9h20M2 15h20" />
                <path d="M5 5v14" />
                <path d="M19 5v14" />
              </svg>
              Stripe
            </a>
            
            {/* Docs Link (Mock) */}
            <a 
              href={familyRecord.family_id ? 
                `https://docs.google.com/search?q=${encodeURIComponent(familyRecord.family_name)}` : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#0F9D58] text-white hover:bg-[#0F9D58]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"></path>
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Documents
            </a>
            
            {/* SchoolMint Link (Mock) */}
            <a 
              href={familyRecord.family_id ? 
                `https://primerlearning.schoolmint.com/families/${familyRecord.family_id}` : "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-[#4481eb] text-white hover:bg-[#4481eb]/90 h-10 px-4 py-2 ${!familyRecord.family_id ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 mr-2">
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