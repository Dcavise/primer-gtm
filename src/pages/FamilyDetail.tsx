import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useFamilyData } from '@/hooks/useFamilyData';
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
  GraduationCap
} from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

// Importing the FamilyRecord type from our hook

const FamilyDetail: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  // Use our custom hook for family data retrieval
  const { 
    loading, 
    error, 
    familyRecord: family,
    fetchFamilyRecord 
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{family.family_name}</h1>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">{family.current_campus_c || 'No Campus Assigned'}</Badge>
            <Badge variant="secondary" className="mr-2">
              <span>{family.contact_count} Contact{family.contact_count !== 1 ? 's' : ''}</span>
            </Badge>
            <Badge variant="secondary" className="mr-2">
              <span>{family.opportunity_count} Opportunit{family.opportunity_count !== 1 ? 'ies' : 'y'}</span>
            </Badge>
          </div>
        </div>
        <div>
          <Button variant="outline" asChild className="mr-2">
            <Link to="/search">Back to Search</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="tuition">Tuition Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Family ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{family.pdc_family_id_c || 'N/A'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Campus</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-lg">{family.current_campus_c || 'Not Assigned'}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Contact Count</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-lg">{family.contact_count}</span>
              </CardContent>
            </Card>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">Recent Activity</h3>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {family.opportunity_count > 0 && (
                    <li className="flex items-start">
                      <Briefcase className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Latest Opportunity</p>
                        <p className="text-muted-foreground">
                          {family.opportunity_names[0] || 'Unnamed Opportunity'} - {family.opportunity_stages[0] || 'Unknown Stage'}
                        </p>
                      </div>
                    </li>
                  )}
                  {family.tuition_offer_count > 0 && (
                    <li className="flex items-start">
                      <DollarSignIcon className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Latest Tuition Offer</p>
                        <p className="text-muted-foreground">
                          Status: {family.tuition_offer_statuses[0] || 'Unknown'} - 
                          Amount: ${(family.tuition_offer_family_contributions[0] || 0).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="space-y-4">
            {family.contact_count > 0 ? (
              family.contact_ids.map((id, index) => (
                <Card key={id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start">
                      <Avatar className="h-12 w-12 mr-4">
                        <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
                          {family.contact_first_names[index]?.[0] || '?'}
                          {family.contact_last_names[index]?.[0] || '?'}
                        </div>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {family.contact_first_names[index]} {family.contact_last_names[index]}
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
                              <span>Last Activity: {new Date(family.contact_last_activity_dates[index]).toLocaleDateString()}</span>
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
                <p className="text-muted-foreground">No contacts found for this family.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6">
          <div className="space-y-4">
            {family.opportunity_count > 0 ? (
              family.opportunity_ids.map((id, index) => (
                <Card key={id}>
                  <CardHeader>
                    <CardTitle>{family.opportunity_names[index] || 'Unnamed Opportunity'}</CardTitle>
                    <CardDescription>
                      <Badge variant={family.opportunity_stages[index]?.toLowerCase().includes('closed') ? 'destructive' : 'default'}>
                        {family.opportunity_stages[index] || 'Unknown Stage'}
                      </Badge>
                      {family.opportunity_grades[index] && (
                        <Badge variant="outline" className="ml-2">
                          Grade: {family.opportunity_grades[index]}
                        </Badge>
                      )}
                      {family.opportunity_campuses[index] && (
                        <Badge variant="secondary" className="ml-2">
                          {family.opportunity_campuses[index]}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {family.opportunity_created_dates[index] && (
                      <div className="flex items-center mb-2">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Created: {new Date(family.opportunity_created_dates[index]).toLocaleDateString()}</span>
                      </div>
                    )}
                    {family.opportunity_lead_notes[index] && (
                      <div className="mb-3">
                        <h5 className="text-sm font-medium mb-1 flex items-center">
                          <ClipboardList className="h-4 w-4 mr-1" /> Lead Notes
                        </h5>
                        <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                          {family.opportunity_lead_notes[index]}
                        </p>
                      </div>
                    )}
                    {family.opportunity_family_interview_notes[index] && (
                      <div>
                        <h5 className="text-sm font-medium mb-1 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" /> Family Interview Notes
                        </h5>
                        <p className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
                          {family.opportunity_family_interview_notes[index]}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No opportunities found for this family.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tuition" className="mt-6">
          <div className="space-y-4">
            {family.tuition_offer_count > 0 ? (
              family.tuition_offer_ids.map((id, index) => (
                <Card key={id}>
                  <CardHeader>
                    <CardTitle className="text-lg">Tuition Offer #{index + 1}</CardTitle>
                    <CardDescription>
                      <Badge variant={
                        family.tuition_offer_statuses[index]?.toLowerCase().includes('accepted') 
                          ? 'default' 
                          : family.tuition_offer_statuses[index]?.toLowerCase().includes('declined')
                            ? 'destructive'
                            : 'outline'
                      }>
                        {family.tuition_offer_statuses[index] || 'Unknown Status'}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Family Contribution</h5>
                        <p className="text-2xl font-semibold text-primary">
                          ${(family.tuition_offer_family_contributions[index] || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">State Scholarship</h5>
                        <p className="text-2xl font-semibold text-accent-foreground">
                          ${(family.tuition_offer_state_scholarships[index] || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <span>Total Package: ${((family.tuition_offer_family_contributions[index] || 0) + (family.tuition_offer_state_scholarships[index] || 0)).toLocaleString()}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyDetail;
