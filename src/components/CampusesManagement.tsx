
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LoadingState } from "@/components/LoadingState";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, ArrowLeft } from "lucide-react";

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
  const [showNewCampusDialog, setShowNewCampusDialog] = useState(false);
  const [showEditCampusDialog, setShowEditCampusDialog] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
  const [newCampusName, setNewCampusName] = useState('');
  const [newCampusId, setNewCampusId] = useState('');
  const [editCampusName, setEditCampusName] = useState('');
  const [editCampusId, setEditCampusId] = useState('');
  const [savingCampus, setSavingCampus] = useState(false);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name', { ascending: true });
      
      if (error) throw error;
      
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Error loading campuses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampus = async () => {
    if (!newCampusName.trim() || !newCampusId.trim()) {
      toast.error('Campus name and ID are required');
      return;
    }

    try {
      setSavingCampus(true);
      
      // Convert the campus ID to a slug format (lowercase, dashes instead of spaces)
      const formattedCampusId = newCampusId.trim().toLowerCase().replace(/\s+/g, '-');
      
      const { data, error } = await supabase
        .from('campuses')
        .insert({
          campus_name: newCampusName.trim(),
          campus_id: formattedCampusId
        })
        .select();
      
      if (error) throw error;
      
      toast.success('Campus created successfully');
      setShowNewCampusDialog(false);
      setNewCampusName('');
      setNewCampusId('');
      fetchCampuses();
    } catch (error: any) {
      console.error('Error creating campus:', error);
      if (error.code === '23505') {
        toast.error('A campus with this ID already exists');
      } else {
        toast.error('Error creating campus');
      }
    } finally {
      setSavingCampus(false);
    }
  };

  const handleEditCampus = (campus: Campus) => {
    setSelectedCampus(campus);
    setEditCampusName(campus.campus_name);
    setEditCampusId(campus.campus_id);
    setShowEditCampusDialog(true);
  };

  const handleUpdateCampus = async () => {
    if (!selectedCampus || !editCampusName.trim()) {
      toast.error('Campus name is required');
      return;
    }

    try {
      setSavingCampus(true);
      
      // Only update what has changed
      const updates: { campus_name?: string; campus_id?: string } = {};
      
      if (editCampusName !== selectedCampus.campus_name) {
        updates.campus_name = editCampusName.trim();
      }
      
      if (editCampusId !== selectedCampus.campus_id) {
        updates.campus_id = editCampusId.trim().toLowerCase().replace(/\s+/g, '-');
      }
      
      // If nothing changed, just close the dialog
      if (Object.keys(updates).length === 0) {
        setShowEditCampusDialog(false);
        return;
      }
      
      const { error } = await supabase
        .from('campuses')
        .update(updates)
        .eq('id', selectedCampus.id);
      
      if (error) throw error;
      
      toast.success('Campus updated successfully');
      setShowEditCampusDialog(false);
      fetchCampuses();
    } catch (error: any) {
      console.error('Error updating campus:', error);
      if (error.code === '23505') {
        toast.error('A campus with this ID already exists');
      } else {
        toast.error('Error updating campus');
      }
    } finally {
      setSavingCampus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="outline" className="mb-4">
          <Link to="/fellows">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fellows
          </Link>
        </Button>
        
        <Button onClick={() => setShowNewCampusDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Campus
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Campuses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Loading campuses..." />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableCaption>List of all campuses</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campus Name</TableHead>
                    <TableHead>Campus ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campuses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                        No campuses found
                      </TableCell>
                    </TableRow>
                  ) : (
                    campuses.map((campus) => (
                      <TableRow key={campus.id}>
                        <TableCell className="font-medium">{campus.campus_name}</TableCell>
                        <TableCell>{campus.campus_id}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCampus(campus)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
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
      </Card>

      {/* New Campus Dialog */}
      <Dialog open={showNewCampusDialog} onOpenChange={setShowNewCampusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Campus</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campusName" className="text-right">
                Campus Name
              </Label>
              <Input
                id="campusName"
                value={newCampusName}
                onChange={(e) => setNewCampusName(e.target.value)}
                className="col-span-3"
                placeholder="e.g. Miami Gardens"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campusId" className="text-right">
                Campus ID
              </Label>
              <Input
                id="campusId"
                value={newCampusId}
                onChange={(e) => setNewCampusId(e.target.value)}
                className="col-span-3"
                placeholder="e.g. miami-gardens"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNewCampusDialog(false)}
              disabled={savingCampus}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampus}
              disabled={savingCampus || !newCampusName.trim() || !newCampusId.trim()}
            >
              {savingCampus ? 'Saving...' : 'Create Campus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campus Dialog */}
      <Dialog open={showEditCampusDialog} onOpenChange={setShowEditCampusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campus</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCampusName" className="text-right">
                Campus Name
              </Label>
              <Input
                id="editCampusName"
                value={editCampusName}
                onChange={(e) => setEditCampusName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editCampusId" className="text-right">
                Campus ID
              </Label>
              <Input
                id="editCampusId"
                value={editCampusId}
                onChange={(e) => setEditCampusId(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditCampusDialog(false)}
              disabled={savingCampus}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCampus}
              disabled={savingCampus || !editCampusName.trim()}
            >
              {savingCampus ? 'Saving...' : 'Update Campus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
