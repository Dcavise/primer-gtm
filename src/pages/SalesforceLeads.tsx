import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, Info, ArrowDown, ArrowUp, DollarSign } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesforceOpportunity, SalesforceAccount, SalesforceContact, SalesforceLead } from "@/types";

export function SalesforceLeadsPage() {
  const [leads, setLeads] = useState<SalesforceLead[]>([]);
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([]);
  const [accounts, setAccounts] = useState<SalesforceAccount[]>([]);
  const [contacts, setContacts] = useState<SalesforceContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [opportunitiesSyncLoading, setOpportunitiesSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [opportunitiesSyncError, setOpportunitiesSyncError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [opportunitiesLastUpdated, setOpportunitiesLastUpdated] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);
  const [showOpportunitiesDetailedError, setShowOpportunitiesDetailedError] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salesforce_leads')
        .select('*')
        .not('campus_id', 'is', null)
        .order('created_date', { ascending: false });
      
      if (error) throw error;
      
      const typedLeads: SalesforceLead[] = data.map(lead => ({
        ...lead,
        is_converted: lead.converted
      }));
      
      setLeads(typedLeads);
      
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

  const fetchOpportunities = async () => {
    setOpportunitiesLoading(true);
    try {
      const { data: oppsData, error: oppsError } = await supabase
        .from('salesforce_opportunities')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (oppsError) throw oppsError;
      
      setOpportunities(oppsData || []);
      
      try {
        const { data: accountsData, error: accountsError } = await supabase
          .from('salesforce_accounts')
          .select('*');
        
        if (!accountsError && accountsData) {
          setAccounts(accountsData);
        }
      } catch (e) {
        console.log('salesforce_accounts table may not exist yet');
      }
      
      try {
        const { data: contactsData, error: contactsError } = await supabase
          .from('salesforce_contacts')
          .select('*');
        
        if (!contactsError && contactsData) {
          setContacts(contactsData);
        }
      } catch (e) {
        console.log('salesforce_contacts table may not exist yet');
      }
      
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
      
      await fetchLeads();
      await fetchOpportunities();
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
      
      await fetchOpportunities();
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
    fetchLeads();
    fetchOpportunities();
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

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getAccountName = (accountId: string | null) => {
    if (!accountId) return '-';
    const account = accounts.find(a => a.account_id === accountId);
    return account ? account.account_name : accountId;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Data</h1>
          <p className="text-white/80 mt-2">
            View Salesforce leads, accounts, contacts, and opportunities that correspond to a campus
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
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="leads">Matched Leads</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Matched Salesforce Leads</CardTitle>
                  <CardDescription>
                    Leads from Salesforce that have been matched to a campus
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
                  <LoadingState message="Loading matched leads data..." />
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
                        <TableCaption>List of matched leads from Salesforce</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Lead Source</TableHead>
                            <TableHead>Preferred Campus</TableHead>
                            <TableHead>Matched Campus</TableHead>
                            <TableHead>Converted</TableHead>
                            <TableHead>Opportunity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leads.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                No matched leads data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            leads.map((lead) => {
                              const opportunity = opportunities.find(
                                o => o.opportunity_id === lead.converted_opportunity_id
                              );

                              return (
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
                                  <TableCell>
                                    {lead.converted_opportunity_id ? (
                                      <div>
                                        {opportunity ? (
                                          <div className="text-xs">
                                            <div className="font-medium">{opportunity.opportunity_name || 'Unnamed'}</div>
                                            <div className="text-muted-foreground">
                                              {opportunity.stage} {opportunity.actualized_tuition ? 
                                                <span className="text-green-600 font-medium">
                                                  ({formatCurrency(opportunity.actualized_tuition)})
                                                </span> : ''}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            {lead.converted_opportunity_id.substring(0, 10)}...
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
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
                  onClick={fetchLeads}
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
                    Opportunities from Salesforce connected to our leads
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
                                <li>Verify that the Lead_ID__c field exists on Opportunity objects</li>
                                <li>Review Edge Function logs for more detailed error information</li>
                              </ol>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-md border overflow-auto max-h-[600px]">
                      <Table>
                        <TableCaption>List of opportunities linked to leads</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opportunity Name</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Close Date</TableHead>
                            <TableHead>Actualized Tuition</TableHead>
                            <TableHead>Lead ID</TableHead>
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {opportunities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                No opportunities data available
                              </TableCell>
                            </TableRow>
                          ) : (
                            opportunities.map((opportunity) => (
                              <TableRow key={opportunity.id}>
                                <TableCell className="font-medium">
                                  {opportunity.opportunity_name || 'Unnamed'}
                                </TableCell>
                                <TableCell>{getAccountName(opportunity.account_id)}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {opportunity.stage || 'Unknown'}
                                  </span>
                                </TableCell>
                                <TableCell>{formatDate(opportunity.close_date)}</TableCell>
                                <TableCell>
                                  {opportunity.actualized_tuition ? (
                                    <span className="flex items-center text-green-600 font-medium">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {formatCurrency(opportunity.actualized_tuition)}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{opportunity.lead_id}</TableCell>
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
                  onClick={fetchOpportunities}
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
        </Tabs>
      </main>
    </div>
  );
}

export default SalesforceLeadsPage;
