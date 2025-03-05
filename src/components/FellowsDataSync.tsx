
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

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
        const mostRecent = new Date(Math.max(...data.map(f => new Date(f.updated_at).getTime())));
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
    try {
      const response = await supabase.functions.invoke('sync-fellows-data');
      
      if (response.error) throw new Error(response.error.message);
      
      toast.success('Fellows data synced successfully');
      fetchFellows(); // Refresh the data after sync
    } catch (error) {
      console.error('Error syncing fellows data:', error);
      toast.error('Error syncing fellows data');
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
            <div className="h-60 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
