import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
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
const extractSchoolYear = (
  opportunityName: string,
  schoolYearField?: string,
): string => {
  // First try to use the school_year_c field if available
  if (schoolYearField) {
    return schoolYearField;
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
  // Filter to only show won opportunities
  const wonOpportunities = opportunities.filter((opp) => opp.isWon);

  // Don't show timeline if no won opportunities
  if (wonOpportunities.length === 0) return null;

  // Group won opportunities by school year
  const opportunitiesByYear = wonOpportunities.reduce(
    (acc, opp) => {
      const year = opp.schoolYear;
      if (!acc[year]) acc[year] = [];
      acc[year].push(opp);
      return acc;
    },
    {} as Record<string, typeof wonOpportunities>,
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
        {/* Simplified timeline container */}
        <div className="flex flex-col">
          {/* Horizontal layout for timeline nodes */}
          <div className="flex items-center justify-between mb-2 relative px-8">
            {/* Connector line spanning the width */}
            <div className="absolute h-0.5 top-4 left-12 right-12 bg-muted-foreground/30"></div>

            {years.map((year, idx) => {
              const displayYear = year.split("-")[0];
              const hasWonOpportunity = !!opportunitiesByYear[year];

              return (
                <div
                  key={year}
                  className="flex flex-col items-center z-10"
                  style={{ width: "80px" }}
                >
                  {/* Circle node */}
                  {hasWonOpportunity ? (
                    <div className="w-6 h-6 rounded-full bg-green-500"></div>
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
              const displayYear = year.split("-")[0];
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
              const hasWonOpportunity = !!opportunitiesByYear[year];
              const yearLabel =
                displayYear.substring(2) +
                "/" +
                (parseInt(displayYear) + 1).toString().substring(2);

              // Different styling based on status
              let badgeClass = "text-xs rounded px-2 py-0.5 font-medium ";
              if (hasWonOpportunity) {
                badgeClass += "bg-green-100 text-green-600";
              } else if (idx === 0) {
                badgeClass += "bg-muted/50 text-muted-foreground";
              } else {
                badgeClass +=
                  "border border-muted-foreground/30 text-muted-foreground";
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
  // Use our custom hook for family data retrieval
  const {
    loading,
    error,
    familyRecord: family,
    fetchFamilyRecord,
  } = useFamilyData();

  // Fetch the family record when the component mounts or familyId changes
  useEffect(() => {
    if (familyId) {
      fetchFamilyRecord(familyId);
    }
  }, [familyId, fetchFamilyRecord]);

  if (loading) {
    return <LoadingState message="Loading family record..." />;
  }

  if (error || !family) {
    return <ErrorState message={error || "Unknown error occurred"} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header / Summary Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            {/* Prominent Household Name as Title */}
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {family.family_name}
            </h1>

            {/* Badges for key information */}
            <div className="flex items-center mt-2 space-x-2">
              {/* Campus Badge with Icon */}
              <Badge
                variant="outline"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3 border-muted/40"
              >
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {family.current_campus_c || "Not Assigned"}
                </span>
              </Badge>

              {/* Contact Count Badge */}
              <Badge
                variant="secondary"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3"
              >
                <UserIcon className="h-3.5 w-3.5" />
                <span>
                  {family.contact_count}{" "}
                  {family.contact_count !== 1 ? "Contacts" : "Contact"}
                </span>
              </Badge>

              {/* Opportunity Count Badge */}
              <Badge
                variant="secondary"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3"
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>
                  {family.opportunity_count}{" "}
                  {family.opportunity_count !== 1
                    ? "Opportunities"
                    : "Opportunity"}
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
                {family.contact_count > 0 ? (
                  <div className="space-y-4">
                    {family.contact_ids.map((id, index) => (
                      <div
                        key={id}
                        className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors"
                      >
                        <div className="flex items-start">
                          <Avatar className="h-12 w-12 mr-4">
                            <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
                              {family.contact_first_names[index]?.[0] || ""}
                              {family.contact_last_names[index]?.[0] || ""}
                            </div>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">
                              {family.contact_first_names[index]}{" "}
                              {family.contact_last_names[index]}
                            </h4>
                            <div className="space-y-2 mt-2">
                              {family.contact_phones[index] && (
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{family.contact_phones[index]}</span>
                                </div>
                              )}
                              {family.contact_emails[index] && (
                                <div className="flex items-center">
                                  <MailIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>{family.contact_emails[index]}</span>
                                </div>
                              )}
                              {family.contact_last_activity_dates[index] && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Last Activity: {new Date(family.contact_last_activity_dates[index]).toLocaleDateString()}</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                    <div className="text-sm text-muted-foreground mb-1">
                      Family ID
                    </div>
                    <div className="font-medium">Family Record</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                    <div className="text-sm text-muted-foreground mb-1">
                      Campus
                    </div>
                    <div className="font-medium">
                      {family.current_campus_c || "Not Assigned"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                    <div className="text-sm text-muted-foreground mb-1">
                      Contact Count
                    </div>
                    <div className="font-medium">{family.contact_count}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                    <div className="text-sm text-muted-foreground mb-1">
                      Opportunity Count
                    </div>
                    <div className="font-medium">
                      {family.opportunity_count}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Overview / Metrics Section */}
      <div className="mb-8">
        <h3 className="text-xl font-medium mb-4">Family Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* LTV (Lifetime Value) Card */}
          <Card className={metricCard({ importance: "primary", interactive: true })}>
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <DollarSignIcon className="h-5 w-5 text-primary" />
                  Lifetime Value
                </h4>
              </div>
              <div className={metricValue({ emphasis: "high" })}>
                {family.tuition_offer_count > 0
                  ? `$${((family.tuition_offer_family_contributions.reduce((sum, val) => sum + (val || 0), 0) || 0)).toLocaleString()}`
                  : "$0"}
              </div>
              <p className={metricDescription()}>Total family contribution</p>
            </CardContent>
          </Card>

          {/* Last Activity Date Card */}
          <Card className={metricCard({ 
            importance: "secondary", 
            status: family.contact_count > 0 && family.contact_last_activity_dates.some(date => date) ? "positive" : "neutral"
          })}>
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Last Activity
                </h4>
              </div>
              <div className={metricValue()}>
                {family.contact_count > 0 && family.contact_last_activity_dates.some(date => date)
                  ? new Date(Math.max(...family.contact_last_activity_dates
                      .filter(date => date)
                      .map(date => new Date(date).getTime()))).toLocaleDateString()
                  : "No activity"}
              </div>
              <p className={metricDescription()}>Most recent contact interaction</p>
            </CardContent>
          </Card>

          {/* Open Tuition Offers Card */}
          <Card className={metricCard({
            importance: "secondary",
            status: family.tuition_offer_count > 0 ? "positive" : "neutral",
            interactive: true
          })}>
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Open Tuition Offers
                </h4>
              </div>
              <div className={metricValue()}>
                {family.tuition_offer_count > 0
                  ? family.tuition_offer_statuses.filter(status => 
                      status && (status.includes("Active") || status.includes("Open"))
                    ).length
                  : 0}
              </div>
              <p className={metricDescription()}>
                {family.tuition_offer_count > 0
                  ? `Out of ${family.tuition_offer_count} total offers`
                  : "No tuition offers"}
              </p>
            </CardContent>
          </Card>

          {/* Family Since Date Card */}
          <Card className={metricCard({
            importance: "secondary",
            interactive: true
          })}>
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <UserIcon className="h-5 w-5 text-primary" />
                  Family Since
                </h4>
              </div>
              <div className={metricValue()}>
                {family.opportunity_count > 0 && family.opportunity_created_dates.some(date => date)
                  ? new Date(Math.min(...family.opportunity_created_dates
                      .filter(date => date)
                      .map(date => new Date(date).getTime()))).toLocaleDateString()
                  : "Unknown"}
              </div>
              <p className={metricDescription()}>First opportunity created</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All content is now displayed on a single page */}
      <div className="space-y-8">
        {/* Contacts Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Contacts</h2>
          <div className="space-y-4">
            {family.contact_count > 0 ? (
              family.contact_ids.map((id, index) => (
                <Card key={id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start">
                      <Avatar className="h-12 w-12 mr-4">
                        <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
                          {family.contact_first_names[index]?.[0] || "?"}
                          {family.contact_last_names[index]?.[0] || "?"}
                        </div>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {family.contact_first_names[index]}{" "}
                          {family.contact_last_names[index]}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                          {family.contact_phones[index] && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{family.contact_phones[index]}</span>
                            </div>
                          )}
                          {family.contact_emails[index] && (
                            <div className="flex items-center">
                              <MailIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{family.contact_emails[index]}</span>
                            </div>
                          )}
                          {family.contact_last_activity_dates[index] && (
                            <div className="flex items-center">
                              <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>
                                Last Activity:{" "}
                                {new Date(
                                  family.contact_last_activity_dates[index],
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No contacts found for this family.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Opportunities Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Opportunities</h2>
          <div className="space-y-4">
            {family.opportunity_count > 0 ? (
              (() => {
                // Process opportunity data and provide defaults for missing values
                const opportunitiesData = family.opportunity_ids.map(
                  (id, index) => ({
                    id,
                    index,
                    stage:
                      family.opportunity_stages[index] || "New Application",
                    name: family.opportunity_names[index] || "",
                    recordType: family.opportunity_record_types?.[index],
                    grade: family.opportunity_grades?.[index],
                    campus: family.opportunity_campuses?.[index],
                    studentName: family.opportunity_names[index]
                      ? extractStudentName(family.opportunity_names[index])
                      : "Unknown Student",
                    schoolYear:
                      family.opportunity_school_years?.[index] ||
                      (family.opportunity_names[index]
                        ? extractSchoolYear(family.opportunity_names[index])
                        : ""),
                    isWon:
                      family.opportunity_is_won?.[index] ||
                      family.opportunity_stages?.[index]?.includes(
                        "Closed Won",
                      ) ||
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

                // Convert to array of student groups
                const studentGroups = Object.entries(
                  opportunitiesByStudent,
                ).map(([studentName, opportunities]) => ({
                  studentName,
                  opportunities,
                }));

                return studentGroups.map(({ studentName, opportunities }) => {
                  return (
                    <div key={studentName} className="mb-8">
                      <h3 className="text-xl font-semibold mb-3">
                        {studentName}
                      </h3>
                      <StudentTimeline
                        studentName={studentName}
                        opportunities={opportunities}
                      />

                      {/* Individual opportunity cards */}
                      <div className="space-y-4">
                        {opportunities.map(
                          ({
                            id,
                            index,
                            stage,
                            name,
                            recordType,
                            grade,
                            campus,
                            isWon,
                          }) => {
                            // Map record type IDs to display names
                            const getRecordTypeDisplayName = (
                              recordTypeId: string | undefined,
                            ) => {
                              if (!recordTypeId) return "Unknown";
                              switch (recordTypeId) {
                                case "012Dn000000ZzP9IAK":
                                  return "New Enrollment";
                                case "012Dn000000a9ncIAA":
                                  return "Re-enrollment";
                                default:
                                  return recordTypeId;
                              }
                            };

                            // Use the recordType passed from our filtered data
                            const recordTypeDisplay =
                              getRecordTypeDisplayName(recordType);

                            // Normalize stage value to handle case sensitivity and whitespace
                            const rawStage = stage;
                            console.log("Raw opportunity stage:", rawStage); // Debug the raw stage value

                            // Simply trim the stage name - now we're getting the actual values from the database
                            // If stage is undefined, use 'New Application' as a default
                            const normalizedStage = rawStage
                              ? rawStage.trim()
                              : "New Application";

                            console.log("Normalized stage:", normalizedStage);
                            return (
                              <Card
                                key={id}
                                className={
                                  isWon ? "border-l-4 border-l-green-500" : ""
                                }
                              >
                                <CardHeader>
                                  <CardTitle className="flex items-center justify-between">
                                    <span>
                                      {name
                                        ? extractStudentName(name)
                                        : "Unnamed Student"}
                                      {family.opportunity_school_years?.[
                                        index
                                      ] && (
                                        <Badge
                                          variant="outline"
                                          className="ml-2"
                                        >
                                          {
                                            family.opportunity_school_years[
                                              index
                                            ]
                                          }
                                        </Badge>
                                      )}
                                      {recordType && (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2"
                                        >
                                          {recordTypeDisplay}
                                        </Badge>
                                      )}
                                    </span>
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
                                    {/* Grade information is displayed as text rather than badge */}
                                    {grade && (
                                      <span className="text-sm ml-2 text-gray-600">
                                        Grade: {grade}
                                      </span>
                                    )}
                                    {/* Campus badge remains visible as it's a name, not an ID */}
                                    {campus && (
                                      <Badge
                                        variant="secondary"
                                        className="ml-2"
                                      >
                                        {campus}
                                      </Badge>
                                    )}
                                    {/* Record type badge removed */}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {family.opportunity_created_dates[index] && (
                                    <div className="flex items-center mb-2">
                                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                      <span>
                                        Created:{" "}
                                        {new Date(
                                          family.opportunity_created_dates[
                                            index
                                          ],
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                  {/* Display student name extracted from opportunity name */}
                                  {name && (
                                    <div className="mb-3">
                                      <h5 className="text-sm font-medium mb-1 flex items-center">
                                        <UserIcon className="h-4 w-4 mr-1" />{" "}
                                        Student
                                      </h5>
                                      <p className="text-sm font-medium text-primary">
                                        {extractStudentName(name)}
                                      </p>
                                    </div>
                                  )}

                                  {family.opportunity_lead_notes[index] && (
                                    <div className="mb-3">
                                      <h5 className="text-sm font-medium mb-1 flex items-center">
                                        <ClipboardList className="h-4 w-4 mr-1" />{" "}
                                        Lead Notes
                                      </h5>
                                      <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                                        {family.opportunity_lead_notes[index]}
                                      </p>
                                    </div>
                                  )}
                                  {family.opportunity_family_interview_notes[
                                    index
                                  ] && (
                                    <div>
                                      <h5 className="text-sm font-medium mb-1 flex items-center">
                                        <MessageSquare className="h-4 w-4 mr-1" />{" "}
                                        Family Interview Notes
                                      </h5>
                                      <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                                        {
                                          family
                                            .opportunity_family_interview_notes[
                                            index
                                          ]
                                        }
                                      </p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          },
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No opportunities found for this family.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tuition Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Tuition Offers</h2>
          <div className="space-y-4">
            {family.tuition_offer_count > 0 ? (
              family.tuition_offer_ids
                .map((id, index) => ({ id, index }))
                .filter((item) => {
                  const status = family.tuition_offer_statuses[item.index];
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
                            family.tuition_offer_statuses[index]
                              ?.toLowerCase()
                              .includes("accepted")
                              ? "default"
                              : family.tuition_offer_statuses[index]
                                ?.toLowerCase()
                                .includes("declined")
                                ? "destructive"
                                : "outline"
                          }
                        >
                          {family.tuition_offer_statuses[index] ||
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
                              family.tuition_offer_family_contributions[
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
                              family.tuition_offer_state_scholarships[index] ||
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
                            (family.tuition_offer_family_contributions[index] ||
                              0) +
                            (family.tuition_offer_state_scholarships[index] ||
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
    </div>
  );
};

export default FamilyDetail;
