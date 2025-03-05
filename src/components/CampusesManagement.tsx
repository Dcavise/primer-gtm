
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LoadingState } from "@/components/LoadingState";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

interface Campus {
  id: string;
  campus_id: string;
  campus_name: string;
  created_at: string;
  updated_at: string;
}

export function CampusesManagement() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name', { ascending: true });
      
      if (error) throw error;
      
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Error loading campuses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const viewCampusDetails = (campus: Campus) => {
    setSelectedCampus(campus);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Campuses Management</CardTitle>
          <CardDescription>
            View and manage campus information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading campuses data..." />
          ) : (
            <div className="rounded-md border overflow-auto max-h-[600px]">
              <Table>
                <TableCaption>List of all campuses</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campus ID</TableHead>
                    <TableHead>Campus Name</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        No campuses data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    campuses.map((campus) => (
                      <TableRow key={campus.id}>
                        <TableCell className="font-mono">{campus.campus_id}</TableCell>
                        <TableCell className="font-medium">{campus.campus_name}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewCampusDetails(campus)}
                          >
                            View Details
                          </Button>
                        </TableCell>
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
            onClick={fetchCampuses} 
            disabled={loading}
            className="ml-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {selectedCampus && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedCampus.campus_name}</DialogTitle>
              <DialogDescription>
                Campus details and information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="font-medium">Campus ID:</div>
                <div className="col-span-2 font-mono">{selectedCampus.campus_id}</div>
                
                <div className="font-medium">Created:</div>
                <div className="col-span-2">
                  {new Date(selectedCampus.created_at).toLocaleString()}
                </div>
                
                <div className="font-medium">Last Updated:</div>
                <div className="col-span-2">
                  {new Date(selectedCampus.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
