
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SalesforceLead {
  id: string;
  lead_id: string;
  first_name: string;
  last_name: string;
  created_date: string;
  converted_date: string;
  converted: boolean;
  stage: string;
  lead_source: string;
  preferred_campus: string;
  campus_id: string;
  converted_opportunity_id: string;
  updated_at: string;
}

interface Campus {
  campus_id: string;
  campus_name: string;
}

const SalesforceLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<SalesforceLead[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);

  useEffect(() => {
    fetchCampuses();
    fetchLeads();
  }, []);

  const fetchCampuses = async () => {
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name');

      if (error) throw error;
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Failed to load campuses');
    }
  };

  const fetchLeads = async (campusId?: string) => {
    try {
      let query = supabase
        .from('salesforce_leads')
        .select('*')
        .order('created_date', { ascending: false });

      if (campusId) {
        query = query.eq('campus_id', campusId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);

      // Log data for debugging
      console.log("Leads with campus_id: ", data?.filter(lead => lead.campus_id));
      
      // Check opportunities with campus_id
      const { data: opportunities } = await supabase
        .from('salesforce_opportunities')
        .select('opportunity_id, campus_id')
        .not('campus_id', 'is', null);
      
      console.log("Opportunities with campus_id: ", opportunities || []);
      
      // Check fellows with campus_id
      const { data: fellows } = await supabase
        .from('fellows')
        .select('fellow_id, campus_id')
        .not('campus_id', 'is', null);
      
      console.log("Fellows with campus_id: ", fellows || []);
      
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads data');
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
      
      let successMessage = `Successfully synced ${response.data.synced || 0} leads, matched ${response.data.matched || 0} with campuses`;
      
      if (response.data.fixed && response.data.fixed > 0) {
        successMessage += `, fixed ${response.data.fixed} lead campus ID mappings`;
      }
      
      if (response.data.fixedOpportunities && response.data.fixedOpportunities > 0) {
        successMessage += `, fixed ${response.data.fixedOpportunities} opportunity campus ID mappings`;
      }
      
      if (response.data.fixedFellows && response.data.fixedFellows > 0) {
        successMessage += `, fixed ${response.data.fixedFellows} fellow campus ID mappings`;
      }
      
      if (response.data.cleaned && response.data.cleaned > 0) {
        successMessage += `, cleaned ${response.data.cleaned} invalid campus references`;
      }
      
      toast.success(successMessage);
      
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salesforce Leads</h1>
        <Button 
          onClick={syncSalesforceLeads} 
          disabled={syncLoading}
          className="flex items-center gap-2"
        >
          {syncLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncLoading ? 'Syncing...' : 'Sync Salesforce Data'}
        </Button>
      </div>

      {syncError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Syncing Data</AlertTitle>
          <AlertDescription>
            {syncError}
            {!showDetailedError && (
              <button 
                onClick={() => setShowDetailedError(true)}
                className="text-xs underline ml-2"
              >
                Show Details
              </button>
            )}
            {showDetailedError && (
              <pre className="mt-2 text-xs bg-black/10 p-2 rounded whitespace-pre-wrap">
                {syncError}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant={selectedCampusId === null ? "default" : "outline"}
            onClick={() => {
              setSelectedCampusId(null);
              fetchLeads();
            }}
          >
            All Campuses
          </Button>
          {campuses.map(campus => (
            <Button 
              key={campus.campus_id}
              variant={selectedCampusId === campus.campus_id ? "default" : "outline"}
              onClick={() => {
                setSelectedCampusId(campus.campus_id);
                fetchLeads(campus.campus_id);
              }}
            >
              {campus.campus_name}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Created</th>
              <th className="border px-4 py-2 text-left">Stage</th>
              <th className="border px-4 py-2 text-left">Source</th>
              <th className="border px-4 py-2 text-left">Preferred Campus</th>
              <th className="border px-4 py-2 text-left">Campus ID</th>
              <th className="border px-4 py-2 text-left">Converted</th>
              <th className="border px-4 py-2 text-left">Converted Date</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="border px-4 py-8 text-center text-gray-500">
                  No leads found. {selectedCampusId ? 'Try selecting a different campus or ' : ''}
                  <button 
                    onClick={syncSalesforceLeads} 
                    className="text-blue-500 underline"
                    disabled={syncLoading}
                  >
                    sync with Salesforce
                  </button>
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {lead.first_name} {lead.last_name}
                  </td>
                  <td className="border px-4 py-2">{lead.created_date}</td>
                  <td className="border px-4 py-2">{lead.stage}</td>
                  <td className="border px-4 py-2">{lead.lead_source}</td>
                  <td className="border px-4 py-2">{lead.preferred_campus}</td>
                  <td className="border px-4 py-2">{lead.campus_id}</td>
                  <td className="border px-4 py-2">
                    {lead.converted ? 'Yes' : 'No'}
                  </td>
                  <td className="border px-4 py-2">{lead.converted_date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesforceLeadsPage;
