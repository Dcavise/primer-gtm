
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { Link } from "react-router-dom";

interface Lead {
  id: string;
  lead_id: string;
  first_name: string | null;
  last_name: string;
  created_date: string | null;
  converted_date: string | null;
  converted: boolean | null;
  stage: string | null;
  lead_source: string | null;
  preferred_campus: string | null;
  campus_id: string | null;
  updated_at: string;
}

export function SalesforceLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salesforce_leads')
        .select('*')
        .order('created_date', { ascending: false });
      
      if (error) throw error;
      
      setLeads(data || []);
      
      // Get the most recent updated_at timestamp
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
      
      toast.success(`Successfully synced ${response.data.synced || 0} leads`);
      
      // Refresh the data
      await fetchLeads();
    } catch (error: any) {
      console.error('Error syncing Salesforce leads:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error syncing leads data: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const toggleDetailedError = () => {
    setShowDetailedError(!showDetailedError);
  };

  // Format date string for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Leads</h1>
          <p className="text-white/80 mt-2">
            View and synchronize leads from Salesforce
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
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Salesforce Leads</CardTitle>
                <CardDescription>
                  View and sync leads from Salesforce CRM
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
                          <TableHead>Campus</TableHead>
                          <TableHead>Converted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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
                                {lead.converted ? (
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
        </div>
      </main>
    </div>
  );
}

export default SalesforceLeadsPage;
