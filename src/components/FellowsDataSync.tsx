
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertCircle } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";

interface Fellow {
  id: number;
  fellow_id: number;
  fellow_name: string;
  campus: string | null;
  cohort: number | null;
  grade_band: string | null;
  fte_employment_status: string | null;
  updated_at: string;
}

export function FellowsDataSync() {
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchFellows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .order('fellow_id', { ascending: true });
      
      if (error) throw error;
      
      setFellows(data || []);
      
      // Get the most recent updated_at timestamp
      if (data && data.length > 0) {
        const mostRecent = new Date(Math.max(...data.map(f => new Date(f.updated_at || '').getTime())));
        setLastUpdated(mostRecent.toLocaleString());
      }
    } catch (error) {
      console.error('Error fetching fellows:', error);
      toast.error('Error loading fellows data');
    } finally {
      setLoading(false);
    }
  };

  const syncFellowsData = async () => {
    setSyncLoading(true);
    setSyncError(null);
    
    try {
      console.log("Invoking sync-fellows-data function");
      const response = await supabase.functions.invoke('sync-fellows-data');
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || 'Unknown error occurred');
      }
      
      if (!response.data.success) {
        console.error("Sync operation failed:", response.data);
        throw new Error(response.data.error || 'Sync operation failed');
      }
      
      toast.success(`Successfully synced ${response.data.result?.inserted || 0} fellows records`);
      fetchFellows(); // Refresh the data after sync
    } catch (error: any) {
      console.error('Error syncing fellows data:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error syncing fellows data: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    fetchFellows();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fellows Data</CardTitle>
          <CardDescription>
            View and sync fellows data from Google Sheets
            {lastUpdated && (
              <span className="block text-sm mt-1">
                Last updated: {lastUpdated}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading fellows data..." />
          ) : (
            <>
              {syncError && (
                <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md text-red-800 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error syncing data</p>
                    <p className="text-sm mt-1">{syncError}</p>
                  </div>
                </div>
              )}
              
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableCaption>List of fellows from all campuses</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
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
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No fellows data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      fellows.map((fellow) => (
                        <TableRow key={fellow.id}>
                          <TableCell>{fellow.fellow_id}</TableCell>
                          <TableCell className="font-medium">{fellow.fellow_name}</TableCell>
                          <TableCell>{fellow.campus || '-'}</TableCell>
                          <TableCell>{fellow.cohort || '-'}</TableCell>
                          <TableCell>{fellow.grade_band || '-'}</TableCell>
                          <TableCell>{fellow.fte_employment_status || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={syncFellowsData} 
            disabled={syncLoading}
            className="ml-auto"
          >
            {syncLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync with Google Sheets
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
