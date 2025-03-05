
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertCircle, Info } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";

interface Campus {
  id: string;
  campus_id: string;
  campus_name: string;
}

interface Fellow {
  id: number;
  fellow_id: number;
  fellow_name: string;
  campus: string | null;
  campus_id: string | null; // New field to store the campus_id reference
  campus_name: string | null; // For display purposes
  cohort: number | null;
  grade_band: string | null;
  fte_employment_status: string | null;
  updated_at: string;
}

export function FellowsDataSync() {
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showDetailedError, setShowDetailedError] = useState(false);

  const fetchCampuses = async () => {
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*');
      
      if (error) throw error;
      
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };

  const fetchFellows = async () => {
    setLoading(true);
    try {
      // First, make sure we have the campuses data
      if (campuses.length === 0) {
        await fetchCampuses();
      }
      
      const { data, error } = await supabase
        .from('fellows')
        .select('*')
        .order('fellow_id', { ascending: true });
      
      if (error) throw error;
      
      // Map the fellows data to include campus_name from the campuses array
      const mappedFellows = (data || []).map(fellow => {
        // If the fellow has a campus field but no campus_id, try to match it with a campus
        if (fellow.campus && !fellow.campus_id) {
          const matchedCampus = campuses.find(
            c => c.campus_name.toLowerCase() === fellow.campus?.toLowerCase()
          );
          if (matchedCampus) {
            return {
              ...fellow,
              campus_name: matchedCampus.campus_name,
              campus_id: matchedCampus.campus_id
            };
          }
        } 
        // If the fellow has a campus_id, get the campus_name
        else if (fellow.campus_id) {
          const matchedCampus = campuses.find(c => c.campus_id === fellow.campus_id);
          if (matchedCampus) {
            return {
              ...fellow,
              campus_name: matchedCampus.campus_name
            };
          }
        }
        
        // Default case, just return the fellow as is
        return {
          ...fellow,
          campus_name: fellow.campus // Use the campus field as campus_name if no match
        };
      });
      
      setFellows(mappedFellows);
      
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
    setShowDetailedError(false);
    
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

      // After sync, link fellows to campuses
      await linkFellowsToCampuses();
      
      // Then refresh the data
      await fetchFellows();
    } catch (error: any) {
      console.error('Error syncing fellows data:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setSyncError(errorMessage);
      toast.error(`Error syncing fellows data: ${errorMessage}`);
    } finally {
      setSyncLoading(false);
    }
  };

  // New function to link fellows to campuses based on campus name
  const linkFellowsToCampuses = async () => {
    try {
      // Make sure we have the campuses data
      if (campuses.length === 0) {
        await fetchCampuses();
      }
      
      // Get all fellows
      const { data: fellowsData, error: fellowsError } = await supabase
        .from('fellows')
        .select('*');
      
      if (fellowsError) throw fellowsError;
      
      // Process each fellow that has a campus but no campus_id
      for (const fellow of fellowsData || []) {
        if (fellow.campus && !fellow.campus_id) {
          // Try to find a matching campus
          const matchedCampus = campuses.find(
            c => c.campus_name.toLowerCase() === fellow.campus?.toLowerCase()
          );
          
          if (matchedCampus) {
            // Update the fellow with the campus_id
            const { error: updateError } = await supabase
              .from('fellows')
              .update({ campus_id: matchedCampus.campus_id })
              .eq('id', fellow.id);
            
            if (updateError) {
              console.error(`Error updating fellow ${fellow.id}:`, updateError);
            }
          }
        }
      }
      
      console.log("Fellows linked to campuses successfully");
    } catch (error) {
      console.error('Error linking fellows to campuses:', error);
    }
  };

  useEffect(() => {
    fetchCampuses();
    fetchFellows();
  }, []);

  const toggleDetailedError = () => {
    setShowDetailedError(!showDetailedError);
  };

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
                          <li>Ensure the Google service account credentials are properly formatted JSON</li>
                          <li>Make sure the service account has "Viewer" access to the Google Sheet</li>
                          <li>Verify that the spreadsheet ID is correct</li>
                          <li>Check that all required scopes are enabled for the service account</li>
                          <li>Review Edge Function logs for more detailed error information</li>
                        </ol>
                      </div>
                    )}
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
                          <TableCell>{fellow.campus_name || fellow.campus || '-'}</TableCell>
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
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline"
            onClick={linkFellowsToCampuses}
            disabled={loading || syncLoading}
          >
            Update Campus Links
          </Button>
          <Button 
            onClick={syncFellowsData} 
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
                Sync with Google Sheets
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
