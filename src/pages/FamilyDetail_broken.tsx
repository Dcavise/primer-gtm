import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase-client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FamilyRecord, useFamilyData } from "@/hooks/useFamilyData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { 
  Loader2, 
  FileText, 
  DollarSign as DollarSignIcon, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  User as UserIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  ClipboardList,
  MessageSquare,
  Building,
  Circle,
  AlertCircle
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import { metricCard, metricLabel, metricValue, metricDescription } from "@/components/ui/metric-card-variants";

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
const extractSchoolYear = (opportunityName: string, schoolYearField?: string): string => {
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

const StudentTimeline: React.FC<TimelineProps> = ({ studentName, opportunities }) => {
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
    {} as Record<string, typeof wonOpportunities>
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

export default function FamilyDetail() {
  const { familyId } = useParams<{ familyId: string }>();

  // Use our custom hook for family data retrieval
  const { loading, error, familyRecord, fetchFamilyRecord } = useFamilyData();
  
  // State to store campus names
  const [campusNames, setCampusNames] = useState<Record<string, string>>({});
  
  // Fetch family data when the component mounts or familyId changes
  useEffect(() => {
    if (familyId) {
      fetchFamilyRecord(familyId);
    }
  }, [familyId, fetchFamilyRecord]);

  // Load campus names when familyRecord is available
  useEffect(() => {
    const loadCampusNames = async () => {
      if (!familyRecord) return;
      
      // Get unique campus IDs from opportunities and include current_campus_c
      const campusIdsFromOpportunities = familyRecord.opportunity_campuses ? 
        [...new Set(familyRecord.opportunity_campuses.filter(id => id))] : [];
      
      // Make sure to include the current_campus_c
      const allCampusIds = familyRecord.current_campus_c ? 
        [...campusIdsFromOpportunities, familyRecord.current_campus_c] : campusIdsFromOpportunities;
      
      // Get unique campus IDs
      const uniqueCampusIds = [...new Set(allCampusIds)];
      
      console.log('Family current_campus_c:', familyRecord.current_campus_c);
      console.log('All campus IDs to fetch:', uniqueCampusIds);
      
      if (uniqueCampusIds.length === 0) return;
      
      try {
        const { data, error } = await supabase.rpc('get_campus_names', {
          campus_ids: uniqueCampusIds
        });

        if (error) {
          console.error('Error fetching campus names:', error);
          return;
        }

        const campusMap: Record<string, string> = {};
        if (data) {
          data.forEach((campus: { id: string; name: string }) => {
            campusMap[campus.id] = campus.name;
          });
          setCampusNames(campusMap);
        }
      } catch (err) {
        console.error('Failed to fetch campus names:', err);
      }
    };
    
    loadCampusNames();
  }, [familyRecord]);

  // Handle loading state
  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Handle error state
  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Handle case where family record is not found
  if (!familyRecord) {
    return (
      <div className="p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Family Not Found</AlertTitle>
          <AlertDescription>The requested family record could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate lifetime value
  const lifetimeValue = familyRecord.tuition_offer_family_contributions ? 
    familyRecord.tuition_offer_family_contributions.reduce((sum, val) => sum + (val || 0), 0) : 0;

  // Get the latest activity date
  const lastActivityDate = familyRecord.contact_last_activity_dates && 
    familyRecord.contact_last_activity_dates.filter(date => date).length > 0 ?
    new Date(Math.max(...familyRecord.contact_last_activity_dates
      .filter(date => date)
      .map(date => new Date(date).getTime())))
      .toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : 'No activity';

  // Count open tuition offers
  const openTuitionOffers = familyRecord.tuition_offer_statuses ? 
    familyRecord.tuition_offer_statuses.filter(status => 
      status === 'Open' || status === 'Pending').length : 0;
  const totalTuitionOffers = familyRecord.tuition_offer_ids ? 
    familyRecord.tuition_offer_ids.length : 0;

  // Get the earliest opportunity date (Family Since)
  const familySinceDate = familyRecord.opportunity_created_dates && 
    familyRecord.opportunity_created_dates.filter(date => date).length > 0 ?
    new Date(Math.min(...familyRecord.opportunity_created_dates
      .filter(date => date)
      .map(date => new Date(date).getTime())))
      .toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) : 'N/A';
      
      try {
        const { data, error } = await supabase.rpc('get_campus_names', {
          campus_ids: uniqueCampusIds
        });

        if (error) {
          console.error('Error fetching campus names:', error);
          return;
        }

        const campusMap: Record<string, string> = {};
        if (data) {
          data.forEach((campus: { id: string; name: string }) => {
            campusMap[campus.id] = campus.name;
          });
          setCampusNames(campusMap);
        }
      } catch (err) {
        console.error('Failed to fetch campus names:', err);
      }
    };
    
    loadCampusNames();
  }, [familyRecord]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header / Summary Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex flex-1 items-center gap-4">
            {/* Left side: Household Name */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {familyRecord.family_name}
              </h1>
            </div>
            
            {/* Center section: Badges/tags */}
            <div className="flex items-center gap-3 ml-6">
              {/* Check if family has any won opportunities */}
              {familyRecord.opportunity_is_won && 
               familyRecord.opportunity_is_won.some(isWon => isWon === true) && (
                <Badge
                  variant="success"
                  className="flex items-center gap-1 py-1.5 pl-2 pr-3 bg-green-100 text-green-800 border-green-200"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">Active</span>
                </Badge>
              )}
              
              {/* Campus Badge with Icon */}
              <Badge
                variant="outline"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3 border-muted/40"
              >
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {familyRecord.current_campus_c ? (campusNames[familyRecord.current_campus_c] || familyRecord.current_campus_c) : "Not Assigned"}
                </span>
              </Badge>

              {/* Student Count Badge */}
              <Badge
                variant="secondary"
                className="flex items-center gap-1 py-1.5 pl-2 pr-3"
              >
                <GraduationCap className="h-3.5 w-3.5" />
                <span>
                  {(() => {
                    // Helper function to calculate string similarity (Levenshtein distance)
                    const calculateSimilarity = (str1: string, str2: string): number => {
                      const track = Array(str2.length + 1).fill(null).map(() => 
                        Array(str1.length + 1).fill(null));
                      
                      for (let i = 0; i <= str1.length; i += 1) {
                        track[0][i] = i;
                      }
                      
                      for (let j = 0; j <= str2.length; j += 1) {
                        track[j][0] = j;
                      }
                      
                      for (let j = 1; j <= str2.length; j += 1) {
                        for (let i = 1; i <= str1.length; i += 1) {
                          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                          track[j][i] = Math.min(
                            track[j][i - 1] + 1, // deletion
                            track[j - 1][i] + 1, // insertion
                            track[j - 1][i - 1] + indicator, // substitution
                          );
                        }
                      }
                      
                      // Calculate similarity as a percentage (0-1)
                      // Higher values mean more similar strings
                      const maxLength = Math.max(str1.length, str2.length);
                      return maxLength === 0 ? 1 : 1 - (track[str2.length][str1.length] / maxLength);
                    };
                    
                    // Normalize student name for more accurate comparison
                    const normalizeStudentName = (name: string): string => {
                      return name
                        .toLowerCase()
                        .replace(/\s+/g, ' ') // normalize whitespace
                        .trim();
                    };
                    
                    // Extract and clean student names
                    const rawStudentNames = familyRecord.opportunity_names
                      ? familyRecord.opportunity_names
                          .map(name => name ? extractStudentName(name) : null)
                          .filter(Boolean) as string[]
                      : [];
                    
                    // Deduplicate similar names using fuzzy matching
                    const uniqueStudentNames: string[] = [];
                    
                    // Similarity threshold (0.85 = 85% similar)
                    const SIMILARITY_THRESHOLD = 0.85;
                    
                    // Identify similar student names
                    rawStudentNames.forEach((currentName) => {
                      const normalizedCurrentName = normalizeStudentName(currentName);
                      
                      // Skip already processed names
                      if (uniqueStudentNames.includes(normalizedCurrentName)) return;
                      
                      // Find if this name is similar to any we've already seen
                      const existingSimilarName = uniqueStudentNames.find((existingName) => {
                        const normalizedExistingName = normalizeStudentName(existingName);
                        const similarity = calculateSimilarity(normalizedCurrentName, normalizedExistingName);
                        return similarity >= SIMILARITY_THRESHOLD;
                      });
                      
                      // If similar enough, map to the first name we saw
                      if (existingSimilarName) {
                        const normalizedExistingName = normalizeStudentName(existingSimilarName);
                        const similarity = calculateSimilarity(normalizedCurrentName, normalizedExistingName);
                        console.log(`Grouping similar names: ${currentName} -> ${existingSimilarName} (${Math.round(similarity * 100)}% similar)`);
                      } else {
                        // If no similar name found, add this one to our list
                        uniqueStudentNames.push(currentName);
                      }
                    });
                    
                    const studentCount = uniqueStudentNames.length;
                    return `${studentCount} ${studentCount !== 1 ? 'Students' : 'Student'}`;
                  })()}
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
                              {familyRecord.contact_first_names[index]} {familyRecord.contact_last_names[index]}
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
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-card border border-muted/20 hover:border-muted/50 transition-colors">
                    <div>
                      <div className="space-y-2">
                        {/* Lifetime Value */}
                        <div className="flex items-center">
                          <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Lifetime Value: </span>
                          <span className="font-medium ml-1">${lifetimeValue.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">Total family contribution</div>

                        {/* Last Activity */}
                        <div className="flex items-center mt-2">
                          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Last Activity: </span>
                          <span className="font-medium ml-1">{lastActivityDate}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">Most recent contact interaction</div>

                        {/* Open Tuition Offers */}
                        <div className="flex items-center mt-2">
                          <GraduationCap className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Open Tuition Offers: </span>
                          <span className="font-medium ml-1">{openTuitionOffers}/{totalTuitionOffers}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">Active out of total offers</div>

                        {/* Family Since */}
                        <div className="flex items-center mt-2">
                          <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Family Since: </span>
                          <span className="font-medium ml-1">{familySinceDate}</span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-6">First opportunity created</div>

                        {/* Current Campus */}
                        {familyRecord.current_campus_c && (
                          <>
                            <div className="flex items-center mt-2">
                              <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Current Campus: </span>
                              <span className="font-medium ml-1">{familyRecord.current_campus_c}</span>
                            </div>
                            <div className="text-xs text-muted-foreground ml-6">Primary school location</div>
                          </>
                        )}
                      </div>
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
                {familyRecord.tuition_offer_count > 0
                  ? `$${(familyRecord.tuition_offer_family_contributions.reduce((sum, val) => sum + (val || 0), 0) || 0).toLocaleString()}`
                  : "$0"}
              </div>
              <p className={metricDescription()}>Total family contribution</p>
            </CardContent>
          </Card>

          {/* Last Activity Date Card */}
          <Card
            className={metricCard({
              importance: "secondary",
              status:
                familyRecord.contact_count > 0 && familyRecord.contact_last_activity_dates.some((date) => date)
                  ? "positive"
                  : "neutral",
            })}
          >
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Last Activity
                </h4>
              </div>
              <div className={metricValue()}>
                {familyRecord.contact_count > 0 && familyRecord.contact_last_activity_dates.some((date) => date)
                  ? new Date(
                      Math.max(
                        ...familyRecord.contact_last_activity_dates
                          .filter((date) => date)
                          .map((date) => new Date(date).getTime())
                      )
                    ).toLocaleDateString()
                  : "No activity"}
              </div>
              <p className={metricDescription()}>Most recent contact interaction</p>
            </CardContent>
          </Card>

          {/* Open Tuition Offers Card */}
          <Card
            className={metricCard({
              importance: "secondary",
              status: familyRecord.tuition_offer_count > 0 ? "positive" : "neutral",
              interactive: true,
            })}
          >
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Open Tuition Offers
                </h4>
              </div>
              <div className={metricValue()}>
                {familyRecord.tuition_offer_count > 0
                  ? familyRecord.tuition_offer_statuses.filter(
                      (status) => status && (status.includes("Active") || status.includes("Open"))
                    ).length
                  : 0}
              </div>
              <p className={metricDescription()}>
                {familyRecord.tuition_offer_count > 0
                  ? `Out of ${familyRecord.tuition_offer_count} total offers`
                  : "No tuition offers"}
              </p>
            </CardContent>
          </Card>

          {/* Family Since Card */}
          <Card
            className={metricCard({
              importance: "secondary",
              interactive: true,
            })}
          >
            <CardContent className="p-6">
              <div className="mb-2">
                <h4 className={metricLabel({ withIcon: true })}>
                  <UserIcon className="h-5 w-5 text-primary" />
                  Family Since
                </h4>
              </div>
              <div className={metricValue()}>
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
              <p className={metricDescription()}>First opportunity created</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All content is now displayed on a single page */}
      <div className="space-y-8">
        {/* Students Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Students</h2>
          {family.opportunity_count > 0 ? (
            (() => {
              // Helper function to calculate string similarity (Levenshtein distance)
              const calculateSimilarity = (str1: string, str2: string): number => {
                const track = Array(str2.length + 1).fill(null).map(() => 
                  Array(str1.length + 1).fill(null));
                
                for (let i = 0; i <= str1.length; i += 1) {
                  track[0][i] = i;
                }
                
                for (let j = 0; j <= str2.length; j += 1) {
                  track[j][0] = j;
                }
                
                for (let j = 1; j <= str2.length; j += 1) {
                  for (let i = 1; i <= str1.length; i += 1) {
                    const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                    track[j][i] = Math.min(
                      track[j][i - 1] + 1, // deletion
                      track[j - 1][i] + 1, // insertion
                      track[j - 1][i - 1] + indicator, // substitution
                    );
                  }
                }
                
                // Calculate similarity as a percentage (0-1)
                // Higher values mean more similar strings
                const maxLength = Math.max(str1.length, str2.length);
                return maxLength === 0 ? 1 : 1 - (track[str2.length][str1.length] / maxLength);
              };
              
              // Normalize student name for more accurate comparison
              const normalizeStudentName = (name: string): string => {
                return name
                  .toLowerCase()
                  .replace(/\s+/g, ' ') // normalize whitespace
                  .trim();
              };

              // Process opportunity data and provide defaults for missing values
              const opportunitiesData = familyRecord.opportunity_ids.map((id, index) => ({
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
              }));

              // Create a similarity map to group student names
              const similarStudentGroups: Record<string, string> = {};
              
              // Similarity threshold (0.85 = 85% similar)
              const SIMILARITY_THRESHOLD = 0.85;
              
              // Identify similar student names
              opportunitiesData.forEach((opp) => {
                const currentName = opp.studentName;
                
                // Skip already processed names
                if (similarStudentGroups[currentName]) return;
                
                // Find if this name is similar to any previously seen name
                const existingSimilarName = opportunitiesData.find((otherOpp) => {
                  if (currentName === otherOpp.studentName) return false;
                  const normalizedCurrentName = normalizeStudentName(currentName);
                  const normalizedOtherName = normalizeStudentName(otherOpp.studentName);
                  const similarity = calculateSimilarity(normalizedCurrentName, normalizedOtherName);
                  return similarity >= SIMILARITY_THRESHOLD;
                });
                
                // If similar enough, map to the first name we saw
                if (existingSimilarName) {
                  const normalizedCurrentName = normalizeStudentName(currentName);
                  const normalizedOtherName = normalizeStudentName(existingSimilarName.studentName);
                  const similarity = calculateSimilarity(normalizedCurrentName, normalizedOtherName);
                  console.log(`Grouping similar names: ${currentName} -> ${existingSimilarName.studentName} (${Math.round(similarity * 100)}% similar)`);
                  similarStudentGroups[currentName] = existingSimilarName.studentName;
                } else {
                  // If no similar name found, add this one to our list
                  similarStudentGroups[currentName] = currentName;
                }
              });

              // Group opportunities by canonical student name (using the similarity map)
              const opportunitiesByStudent = opportunitiesData.reduce(
                (acc, opp) => {
                  // Use the canonical name from the similarity map, or the original name if no mapping
                  const canonicalName = similarStudentGroups[opp.studentName] || opp.studentName;
                  
                  if (!acc[canonicalName]) {
                    acc[canonicalName] = [];
                  }
                  acc[canonicalName].push(opp);
                  return acc;
                },
                {} as Record<string, typeof opportunitiesData>
              );

              // Convert to array of student groups
              const studentGroups = Object.entries(opportunitiesByStudent).map(
                ([studentName, opportunities]) => ({
                  studentName,
                  opportunities,
                })
              );

              // If there are multiple students, create tabs
              if (studentGroups.length > 1) {
                return (
                  <Tabs defaultValue={studentGroups[0].studentName} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      {studentGroups.map(({ studentName }) => (
                        <TabsTrigger key={`tab-${studentName}`} value={studentName}>
                          {studentName}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {studentGroups.map(({ studentName, opportunities }) => (
                      <TabsContent
                        key={`content-${studentName}`}
                        value={studentName}
                        className="mt-4"
                      >
                        <Card>
                          <CardHeader className="pb-0">
                            <CardTitle className="text-xl font-semibold">
                              {studentName}
                              {opportunities.some((opp) => opp.isWon) && (
                                <Badge variant="success" className="ml-2">
                                  Closed Won
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {opportunities[0]?.campus && campusNames[opportunities[0].campus] ? campusNames[opportunities[0].campus] : ""}
                              {opportunities[0]?.grade ? ` • Grade ${opportunities[0].grade}` : ""}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {/* Timeline directly under student name */}
                            <StudentTimeline
                              studentName={studentName}
                              opportunities={opportunities}
                            />

                            {/* Individual opportunity cards */}
                            <div className="space-y-4 mt-4">
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
                                  schoolYear,
                                }) => {
                                  // Map record type IDs to display names
                                  const getRecordTypeDisplayName = (
                                    recordTypeId: string | undefined
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
                                  const recordTypeDisplay = getRecordTypeDisplayName(recordType);

                                  // Normalize stage value to handle case sensitivity and whitespace
                                  const normalizedStage = stage ? stage.trim() : "New Application";

                                  return (
                                    <Card
                                      key={id}
                                      className={isWon ? "border-l-4 border-l-green-500" : ""}
                                    >
                                      <CardHeader>
                                        <CardTitle>Opportunity {index + 1}</CardTitle>
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
                                              <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">
                                                Student Information
                                              </h3>

                                              <div className="space-y-3">
                                                <div>
                                                  <h5 className="text-sm font-medium text-muted-foreground">
                                                    Name
                                                  </h5>
                                                  <p className="text-sm font-medium">
                                                    {name ? extractStudentName(name) : "Unknown"}
                                                  </p>
                                                </div>

                                                {grade && (
                                                  <div>
                                                    <h5 className="text-sm font-medium text-muted-foreground">
                                                      Grade
                                                    </h5>
                                                    <p className="text-sm font-medium">{grade}</p>
                                                  </div>
                                                )}

                                                {campus && (
                                                  <div>
                                                    <h5 className="text-sm font-medium text-muted-foreground">
                                                      Campus
                                                    </h5>
                                                    <p className="text-sm font-medium">{campusNames[campus] || campus}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Right column - Opportunity Details */}
                                          <div className="space-y-4">
                                            <div>
                                              <h3 className="font-medium text-base mb-2 pb-1 border-b border-gray-200">
                                                Opportunity Details
                                              </h3>

                                              <div className="space-y-3">
                                                <div>
                                                  <h5 className="text-sm font-medium text-muted-foreground">
                                                    School Year
                                                  </h5>
                                                  <p className="text-sm font-medium">
                                                    {family.opportunity_school_years?.[index] ||
                                                      (name ? extractSchoolYear(name) : "Unknown")}
                                                  </p>
                                                </div>

                                                {recordType && (
                                                  <div>
                                                    <h5 className="text-sm font-medium text-muted-foreground">
                                                      Opportunity Type
                                                    </h5>
                                                    <p className="text-sm font-medium">
                                                      {recordTypeDisplay}
                                                    </p>
                                                  </div>
                                                )}

                                                {family.opportunity_created_dates[index] && (
                                                  <div>
                                                    <h5 className="text-sm font-medium text-muted-foreground">
                                                      Created Date
                                                    </h5>
                                                    <p className="text-sm font-medium">
                                                      {new Date(
                                                        family.opportunity_created_dates[index]
                                                      ).toLocaleDateString()}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Placeholder for financial info - This would need actual data from the family object */}
                                                {family.tuition_offer_family_contributions &&
                                                  family.tuition_offer_family_contributions[
                                                    index
                                                  ] !== undefined && (
                                                    <div>
                                                      <h5 className="text-sm font-medium text-muted-foreground">
                                                        Family Contribution
                                                      </h5>
                                                      <p className="text-sm font-medium">
                                                        $
                                                        {family.tuition_offer_family_contributions[
                                                          index
                                                        ].toLocaleString()}
                                                      </p>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                }
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                );
              } else {
                // Single student case - no tabs needed
                const studentGroup = studentGroups[0];
                return (
                  <Card>
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xl font-semibold">
                        {studentGroup.studentName}
                        {studentGroup.opportunities.some((opp) => opp.isWon) && (
                          <Badge variant="success" className="ml-2">
                            Closed Won
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {studentGroup.opportunities[0]?.campus ? `${campusNames[studentGroup.opportunities[0].campus] || studentGroup.opportunities[0].campus}: ` : ""}
                        {studentGroup.opportunities[0]?.grade || ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <StudentTimeline
                        studentName={studentGroup.studentName}
                        opportunities={studentGroup.opportunities}
                      />

                      <div className="space-y-4 mt-4">
                        {studentGroup.opportunities.map((opp) => (
                          <Card
                            key={opp.id}
                            className={opp.isWon ? "border-l-4 border-l-green-500" : ""}
                          >
                            {/* Card content would be similar to the tabbed version */}
                            <CardHeader>
                              <CardTitle>Opportunity {opp.index + 1}</CardTitle>
                              <CardDescription>
                                <Badge
                                  variant={
                                    opp.stage === "Closed Won"
                                      ? "success"
                                      : opp.stage === "Closed Lost"
                                        ? "destructive"
                                        : opp.stage === "Family Interview"
                                          ? "secondary"
                                          : opp.stage === "Awaiting Documents"
                                            ? "default"
                                            : opp.stage === "Education Review"
                                              ? "secondary"
                                              : opp.stage === "Admission Offered"
                                                ? "default"
                                                : "outline"
                                  }
                                >
                                  {opp.stage || "New Application"}
                                </Badge>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Card content would continue... */}
                                <div className="space-y-4">
                                  <p>Student Details</p>
                                </div>
                                <div className="space-y-4">
                                  <p>Opportunity Details</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              }
            })()
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No opportunities found for this family.</p>
            </div>
          )}
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
                            familyRecord.tuition_offer_statuses[index]?.toLowerCase().includes("accepted")
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
                            {(familyRecord.tuition_offer_state_scholarships[index] || 0).toLocaleString()}
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
