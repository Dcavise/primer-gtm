import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, Info, Filter } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesforceOpportunity, SalesforceAccount, SalesforceContact, SalesforceLead, Campus, Fellow } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SalesforceLeadsPage() {
  const [leads, setLeads] = useState<SalesforceLead[]>([]);
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([]);
  const [accounts, setAccounts] = useState<SalesforceAccount[]>([]);
  const [contacts, setContacts] = useState<SalesforceContact[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [fellowsLoading, setFellowsLoading] = useState(false);
  const [campusesLoading, setCampusesLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [opportunitiesSyncLoading, setOpportunitiesSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [opportunitiesSyncError, setOpportunitiesSyncError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [opportunitiesLastUpdated, setOpportunitiesLastUpdated] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [showOpportunitiesDetailedError, setShowOpportunitiesDetailedError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    leadsQuery: string | null;
    opportunitiesQuery: string | null;
    fellowsQuery: string | null;
    leadsCount: number;
    opportunitiesCount: number;
    fellowsCount: number;
  }>({
    leadsQuery: null,
    opportunitiesQuery: null,
    fellowsQuery: null,
    leadsCount: 0,
    opportunitiesCount: 0,
    fellowsCount: 0
  });

  const fetchCampuses = async () => {
    setCampusesLoading(true);
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name', { ascending: true });
      
      if (error) throw error;
      setCampuses(data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Error loading campuses data');
    } finally {
      setCampusesLoading(false);
    }
  };

  const fetchLeads = async (campusId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('salesforce_leads')
        .select('*')
        .order('created_date', { ascending: false });
      
      if (campusId) {
        query = query.eq('campus_id', campusId);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        leadsQuery: `Fetching leads with campus_id: ${campusId || 'all'}`
      }));
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const typedLeads: SalesforceLead[] = data.map(lead => ({
        ...lead,
        is_converted: lead.converted,
        converted_opportunity_id: lead.converted_opportunity_id || null
      }));
      
      setLeads(typedLeads);
      setDebugInfo(prev => ({
        ...prev,
        leadsCount: typedLeads.length
      }));
      
      if (data && data.length > 0) {
        const mostRecent = new Date(Math.max(...data.map(l => new Date(l.updated_at).getTime())));
        setLastUpdated(mostRecent.toLocaleString());
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Error loading leads data');
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunities = async (campusId?: string) => {
    setOpportunitiesLoading(true);
    try {
      let query = supabase
        .from('salesforce_opportunities')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (campusId) {
        query = query.eq('campus_id', campusId);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        opportunitiesQuery: `Fetching opportunities with campus_id: ${campusId || 'all'}`
      }));
      
      const { data: oppsData, error: oppsError } = await query;
      
      if (oppsError) throw oppsError;
      
      const typedOpportunities: SalesforceOpportunity[] = oppsData ? oppsData.map(opp => ({
        ...opp,
        preferred_campus: opp.preferred_campus || null,
        campus_id: opp.campus_id || null
      })) : [];
      
      setOpportunities(typedOpportunities);
      setDebugInfo(prev => ({
        ...prev,
        opportunitiesCount: typedOpportunities.length
      }));
      
      if (oppsData && oppsData.length > 0) {
        const mostRecent = new Date(Math.max(...oppsData.map(o => new Date(o.updated_at).getTime())));
        setOpportunitiesLastUpdated(mostRecent.toLocaleString());
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Error loading opportunities data');
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  const fetchFellows = async (campusId?: string) => {
    setFellowsLoading(true);
    try {
      let query = supabase
        .from('fellows')
        .select('*')
        .order('fellow_name', { ascending: true });
      
      if (campusId) {
        query = query.eq('campus_id', campusId);
      }
      
      setDebugInfo(prev => ({
        ...prev,
        fellowsQuery: `Fetching fellows with campus_id: ${campusId || 'all'}`
      }));
      
      const { data, error } = await query;
      
      if (error) throw error;
      setFellows(data);
      setDebugInfo(prev => ({
        ...prev,
        fellowsCount: data.length
      }));
    } catch (error) {
      console.error('Error fetching fellows:', error);
      toast.error('Error loading fellows data');
    } finally {
      setFellowsLoading(false);
    }
  };

  const handleCampusChange = (campusId: string) => {
    setSelectedCampusId(campusId);
    fetchLeads(campusId);
    fetchOpportunities(campusId);
    fetchFellows(campusId);
  };

  const clearCampusFilter = () => {
    setSelectedCampusId(null);
    fetchLeads();
    fetchOpportunities();
    fetchFellows();
  };

  const syncSalesforceLeads = async () => {
    setSyncLoading(true);
    setSyncError(null);
    setShowDetailedError(false);
    
    try {
      console.log("Invoking sync-salesforce-leads function");
      const response = await supabase.functions.invoke('sync-salesforce-leads');
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || 'Unknown error occurred');
      }
      
      if (!response.data.success) {
        console.error("Sync operation failed:", response.data);
        throw new Error(response.data.error || 'Sync operation failed');
      }
      
      const syncedAccounts = response.data.accounts || 0;
      const syncedContacts = response.data.contacts || 0;
      
      toast.success(`Successfully synced ${response.data.synced || 0} leads, matched ${response.data.matched || 0} with campuses, and synced ${syncedAccounts} accounts and ${syncedContacts} contacts`);
      
      fetchLeads(selectedCampusId || undefined);
      fetchCampuses();
    } catch (error: any) {
      console.error('Error syncing Salesforce leads:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error syncing leads data: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const syncSalesforceOpportunities = async () => {
    setOpportunitiesSyncLoading(true);
    setOpportunitiesSyncError(null);
    setShowOpportunitiesDetailedError(false);
    
    try {
      console.log("Invoking sync-salesforce-opportunities function");
      const response = await supabase.functions.invoke('sync-salesforce-opportunities');
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || 'Unknown error occurred');
      }
      
      if (!response.data.success) {
        console.error("Sync operation failed:", response.data);
        throw new Error(response.data.error || 'Sync operation failed');
      }
      
      toast.success(`Successfully synced ${response.data.synced || 0} opportunities`);
      
      fetchOpportunities(selectedCampusId || undefined);
    } catch (error: any) {
      console.error('Error syncing Salesforce opportunities:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setOpportunitiesSyncError(errorMessage);
      toast.error(`Error syncing opportunities data: ${errorMessage}`);
    } finally {
      setOpportunitiesSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
    fetchLeads();
    fetchOpportunities();
    fetchFellows();
  }, []);

  const toggleDetailedError = () => {
    setShowDetailedError(!showDetailedError);
  };

  const toggleOpportunitiesDetailedError = () => {
    setShowOpportunitiesDetailedError(!showOpportunitiesDetailedError);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Data</h1>
          <p className="text-white/80 mt-2">
            View Salesforce leads and opportunities that correspond to a campus
          </p>
          <div className="mt-4">
            <Button asChild variant="secondary" className="mr-2">
              <Link to="/fellows">Back to Fellows</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/campuses">Manage Campuses</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-8 py-8 max-w-5xl">
        <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="w-full sm:w-72">
            <Select
              value={selectedCampusId || ""}
              onValueChange={handleCampusChange}
              disabled={campusesLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by campus..." />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.campus_id} value={campus.campus_id}>
                    {campus.campus_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedCampusId && (
            <Button 
              variant="outline" 
              onClick={clearCampusFilter}
              className="flex items-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear filter
            </Button>
          )}
        </div>

        <Card className="mb-6 bg-gray-50">
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Query and result information to help diagnose filtering issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">Leads:</h3>
                <p className="text-sm text-muted-foreground">{debugInfo.leadsQuery}</p>
                <p className="text-sm">Results: {debugInfo.leadsCount}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Opportunities:</h3>
                <p className="text-sm text-muted-foreground">{debugInfo.opportunitiesQuery}</p>
                <p className="text-sm">Results: {debugInfo.opportunitiesCount}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1">Fellows:</h3>
                <p className="text-sm text-muted-foreground">{debugInfo.fellowsQuery}</p>
                <p className="text-sm">Results: {debugInfo.fellowsCount}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={() => {
              const inspectCampusIds = async () => {
                const { data: leadsData } = await supabase.from('salesforce_leads').select('lead_id, campus_id').eq('campus_id', selectedCampusId || '');
                const { data: oppsData } = await supabase.from('salesforce_opportunities').select('opportunity_id, campus_id').eq('campus_id', selectedCampusId || '');
                const { data: fellowsData } = await supabase.from('fellows').select('fellow_id, campus_id').eq('campus_id', selectedCampusId || '');
                
                console.log('Leads with campus_id:', leadsData);
                console.log('Opportunities with campus_id:', oppsData);
                console.log('Fellows with campus_id:', fellowsData);
                
                toast.info(`Inspection complete. Check console for details.`);
              };
              
              inspectCampusIds();
            }}>
              Inspect Campus IDs
            </Button>
          </CardFooter>
        </Card>

        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="fellows">Fellows</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Salesforce Leads</CardTitle>
                  <CardDescription>
                    {selectedCampusId 
                      ? `Showing leads for campus: ${campuses.find(c => c.campus_id === selectedCampusId)?.campus_name || selectedCampusId}`
                      : "Showing all leads from Salesforce"}
                    {lastUpdated && (
                      <span className="block text-sm mt-1">
                        Last updated: {lastUpdated}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoadingState message="Loading leads data..." />
                ) : (
                  <>
                    {syncError && (
                      <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="w-full">
                          <p className="font-medium flex items-center justify-between">
                            <span>Error syncing data</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={toggleDetailedError}
                              className="text-red-800 h-6 px-2 -mr-2"
                            >
                              <Info className="h-4 w-4 mr-1" />
                              {showDetailedError ? 'Hide details' : 'Show details'}
                            </Button>
                          </p>
                          <p className="text-sm mt-1">{syncError}</p>
                          {showDetailedError && (
                            <div className="mt-3 p-2 bg-red-100 rounded text-xs font-mono overflow-auto max-h-48">
                              <p>Troubleshooting steps:</p>
                              <ol className="list-decimal pl-5 space-y-1 mt-2">
                                <li>Ensure Salesforce API credentials are correct</li>
                                <li>Check that your Salesforce user has API access enabled</li>
                                <li>Verify that the required fields exist in your Salesforce org</li>
                                <li>Review Edge Function logs for more detailed error information</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-md border overflow-auto max-h-[600px]">
                      <Table>
                        <TableCaption>List of leads from Salesforce</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Lead Source</TableHead>
                            <TableHead>Preferred Campus</TableHead>
                            <TableHead>Campus ID</TableHead>
                            <TableHead>Converted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No leads data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            leads.map((lead) => (
                              <TableRow key={lead.id}>
                                <TableCell className="font-medium">
                                  {lead.first_name ? `${lead.first_name} ${lead.last_name}` : lead.last_name}
                                </TableCell>
                                <TableCell>{formatDate(lead.created_date)}</TableCell>
                                <TableCell>{lead.stage || '-'}</TableCell>
                                <TableCell>{lead.lead_source || '-'}</TableCell>
                                <TableCell>{lead.preferred_campus || '-'}</TableCell>
                                <TableCell>
                                  {lead.campus_id ? (
                                    <span className="font-medium text-blue-600">{lead.campus_id}</span>
                                  ) : (
                                    <span className="text-muted-foreground">Not matched</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {lead.converted || lead.is_converted ? (
                                    <div className="flex items-center">
                                      <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                      {formatDate(lead.converted_date)}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">No</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => fetchLeads(selectedCampusId || undefined)}
                  disabled={loading || syncLoading}
                >
                  Refresh List
                </Button>
                <Button 
                  onClick={syncSalesforceLeads} 
                  disabled={syncLoading}
                >
                  {syncLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync from Salesforce
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="opportunities">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Salesforce Opportunities</CardTitle>
                  <CardDescription>
                    {selectedCampusId 
                      ? `Showing opportunities for campus: ${campuses.find(c => c.campus_id === selectedCampusId)?.campus_name || selectedCampusId}`
                      : "Showing all opportunities from Salesforce"}
                    {opportunitiesLastUpdated && (
                      <span className="block text-sm mt-1">
                        Last updated: {opportunitiesLastUpdated}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {opportunitiesLoading ? (
                  <LoadingState message="Loading opportunities data..." />
                ) : (
                  <>
                    {opportunitiesSyncError && (
                      <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-start">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div className="w-full">
                          <p className="font-medium flex items-center justify-between">
                            <span>Error syncing opportunities</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={toggleOpportunitiesDetailedError}
                              className="text-red-800 h-6 px-2 -mr-2"
                            >
                              <Info className="h-4 w-4 mr-1" />
                              {showOpportunitiesDetailedError ? 'Hide details' : 'Show details'}
                            </Button>
                          </p>
                          <p className="text-sm mt-1">{opportunitiesSyncError}</p>
                          {showOpportunitiesDetailedError && (
                            <div className="mt-3 p-2 bg-red-100 rounded text-xs font-mono overflow-auto max-h-48">
                              <p>Troubleshooting steps:</p>
                              <ol className="list-decimal pl-5 space-y-1 mt-2">
                                <li>Ensure Salesforce API credentials are correct</li>
                                <li>Check that your Salesforce user has API access enabled</li>
                                <li>Verify that the Preferred_Campus__c field exists on Opportunity objects</li>
                                <li>Review Edge Function logs for more detailed error information</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-md border overflow-auto max-h-[600px]">
                      <Table>
                        <TableCaption>List of opportunities from Salesforce</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opportunity Name</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Close Date</TableHead>
                            <TableHead>Preferred Campus</TableHead>
                            <TableHead>Campus ID</TableHead>
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                No opportunities data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            opportunities.map((opportunity) => (
                              <TableRow key={opportunity.id}>
                                <TableCell className="font-medium">
                                  {opportunity.opportunity_name || 'Unnamed'}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {opportunity.stage || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>{formatDate(opportunity.close_date)}</TableCell>
                                <TableCell>{opportunity.preferred_campus || '-'}</TableCell>
                                <TableCell>
                                  {opportunity.campus_id ? (
                                    <span className="font-medium text-blue-600">{opportunity.campus_id}</span>
                                  ) : (
                                    <span className="text-muted-foreground">Not matched</span>
                                  )}
                                </TableCell>
                                <TableCell>{formatDate(opportunity.updated_at)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => fetchOpportunities(selectedCampusId || undefined)}
                  disabled={opportunitiesLoading || opportunitiesSyncLoading}
                >
                  Refresh List
                </Button>
                <Button 
                  onClick={syncSalesforceOpportunities} 
                  disabled={opportunitiesSyncLoading}
                >
                  {opportunitiesSyncLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Opportunities
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="fellows">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Fellows</CardTitle>
                  <CardDescription>
                    {selectedCampusId 
                      ? `Showing fellows for campus: ${campuses.find(c => c.campus_id === selectedCampusId)?.campus_name || selectedCampusId}`
                      : "Showing all fellows"}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {fellowsLoading ? (
                  <LoadingState message="Loading fellows data..." />
                ) : (
                  <div className="rounded-md border overflow-auto max-h-[600px]">
                    <Table>
                      <TableCaption>List of fellows</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Campus</TableHead>
                          <TableHead>Cohort</TableHead>
                          <TableHead>Grade Band</TableHead>
                          <TableHead>Employment Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fellows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                              No fellows data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          fellows.map((fellow) => (
                            <TableRow key={fellow.id}>
                              <TableCell className="font-medium">
                                {fellow.fellow_name}
                              </TableCell>
                              <TableCell>
                                {fellow.campus || (fellow.campus_id ? campuses.find(c => c.campus_id === fellow.campus_id)?.campus_name : '-')}
                              </TableCell>
                              <TableCell>{fellow.cohort || '-'}</TableCell>
                              <TableCell>{fellow.grade_band || '-'}</TableCell>
                              <TableCell>{fellow.fte_employment_status || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => fetchFellows(selectedCampusId || undefined)}
                  disabled={fellowsLoading}
                >
                  Refresh List
                </Button>
                <Button asChild variant="outline">
                  <Link to="/fellows">Manage Fellows</Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default SalesforceLeadsPage;
