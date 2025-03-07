import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, FileText, RefreshCw } from "lucide-react";
import { useCampuses } from "@/hooks/useCampuses";
import { LoadingState } from "@/components/LoadingState";
import { supabase } from "@/integrations/supabase-client";
import { Fellow } from "@/types";
import { toast } from "sonner";

interface FellowNote {
  id: string;
  fellow_id: number;
  content: string;
  created_at: string;
  created_by: string;
}

const PLHiring = () => {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<number, FellowNote[]>>({});
  const [newNote, setNewNote] = useState("");
  const [selectedFellow, setSelectedFellow] = useState<Fellow | null>(null);
  const { data: campuses, isLoading: campusesLoading, error: campusesError } = useCampuses();

  // Fetch fellows for the selected campus
  useEffect(() => {
    const fetchFellows = async () => {
      if (!selectedCampus) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('fellows')
          .select('*')
          .eq('campus_id', selectedCampus)
          .order('fellow_name', { ascending: true });
        
        if (error) throw error;
        
        setFellows(data || []);
        
        // Fetch notes for all fellows in this campus
        if (data && data.length > 0) {
          const fellowIds = data.map(f => f.fellow_id).filter(Boolean);
          await fetchNotesForFellows(fellowIds as number[]);
        }
      } catch (error) {
        console.error('Error fetching fellows:', error);
        toast.error('Failed to load fellows data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFellows();
  }, [selectedCampus]);

  // Fetch notes for a list of fellow IDs
  const fetchNotesForFellows = async (fellowIds: number[]) => {
    try {
      const { data, error } = await supabase
        .from('fellow_notes')
        .select('*')
        .in('fellow_id', fellowIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group notes by fellow_id
      const notesMap: Record<number, FellowNote[]> = {};
      (data || []).forEach(note => {
        if (!notesMap[note.fellow_id]) {
          notesMap[note.fellow_id] = [];
        }
        notesMap[note.fellow_id].push(note);
      });
      
      setNotes(notesMap);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load fellow notes');
    }
  };

  // Add a new note for the selected fellow
  const addNote = async () => {
    if (!selectedFellow || !newNote.trim() || !selectedFellow.fellow_id) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('fellow_notes')
        .insert([
          {
            fellow_id: selectedFellow.fellow_id,
            content: newNote.trim(),
            created_by: "current_user" // This should be replaced with the actual user ID
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update the notes state
      if (data && data.length > 0) {
        setNotes(prev => {
          const updatedNotes = { ...prev };
          if (!updatedNotes[selectedFellow.fellow_id!]) {
            updatedNotes[selectedFellow.fellow_id!] = [];
          }
          updatedNotes[selectedFellow.fellow_id!] = [
            data[0],
            ...updatedNotes[selectedFellow.fellow_id!]
          ];
          return updatedNotes;
        });
        
        setNewNote("");
        toast.success('Note added successfully');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If table doesn't exist, create it
  useEffect(() => {
    const createNotesTableIfNeeded = async () => {
      try {
        // Check if the table exists
        const { error } = await supabase
          .from('fellow_notes')
          .select('id')
          .limit(1);
        
        // If the table doesn't exist, the error will indicate that
        if (error && error.message.includes('does not exist')) {
          console.log('Notes table does not exist, will create it');
          
          // Create the table using SQL (requires SQL permissions)
          const { error: createError } = await supabase.rpc('create_fellow_notes_table');
          
          if (createError) throw createError;
          
          console.log('Created fellow_notes table successfully');
        }
      } catch (error) {
        console.error('Error checking/creating notes table:', error);
      }
    };
    
    createNotesTableIfNeeded();
  }, []);

  if (campusesLoading) {
    return <LoadingState message="Loading campuses..." />;
  }

  if (campusesError) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-800">
        <h2 className="text-lg font-semibold mb-2">Error loading campuses</h2>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">PL Hiring Dashboard</h1>
        <p className="text-gray-500 mt-2">Review and evaluate fellows for potential full-time offers</p>
      </div>
      
      <Tabs defaultValue="fellows" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="fellows">Fellows by Campus</TabsTrigger>
          <TabsTrigger value="stats">Hiring Stats</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fellows">
          {/* Campus selector */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {campuses?.map(campus => (
              <Card 
                key={campus.campus_id} 
                className={`cursor-pointer transition-all ${selectedCampus === campus.campus_id ? 'ring-2 ring-primary' : 'hover:bg-accent/50'}`}
                onClick={() => setSelectedCampus(campus.campus_id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{campus.campus_name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          {/* Fellows list */}
          {selectedCampus ? (
            loading ? (
              <LoadingState message="Loading fellows..." />
            ) : (
              <>
                <div className="bg-white rounded-md shadow overflow-hidden mb-8">
                  <Table>
                    <TableCaption>Fellows at selected campus</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Grade Band</TableHead>
                        <TableHead>Employment Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fellows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                            No fellows data available for this campus
                          </TableCell>
                        </TableRow>
                      ) : (
                        fellows.map((fellow) => (
                          <TableRow key={fellow.id}>
                            <TableCell className="font-medium">{fellow.fellow_name}</TableCell>
                            <TableCell>{fellow.cohort || '-'}</TableCell>
                            <TableCell>{fellow.grade_band || '-'}</TableCell>
                            <TableCell>
                              {fellow.fte_employment_status ? (
                                <Badge variant={fellow.fte_employment_status === 'PL Hire' ? 'success' : 'secondary'}>
                                  {fellow.fte_employment_status}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Not Set</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {(notes[fellow.fellow_id!]?.length || 0) > 0 ? (
                                <Badge variant="outline">
                                  {notes[fellow.fellow_id!]?.length} notes
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedFellow(fellow)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{fellow.fellow_name}</DialogTitle>
                                    <DialogDescription>
                                      {fellow.campus} • Cohort: {fellow.cohort || 'Unknown'} • Grade Band: {fellow.grade_band || 'Unknown'}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Fellow Information</h3>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">ID:</span> {fellow.fellow_id || 'Unknown'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Name:</span> {fellow.fellow_name}
                                        </div>
                                        <div>
                                          <span className="font-medium">Campus:</span> {fellow.campus || 'Unknown'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Cohort:</span> {fellow.cohort || 'Unknown'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Grade Band:</span> {fellow.grade_band || 'Unknown'}
                                        </div>
                                        <div>
                                          <span className="font-medium">Employment Status:</span> {fellow.fte_employment_status || 'Not Set'}
                                        </div>
                                      </div>
                                      
                                      <div className="mt-6">
                                        <h3 className="text-lg font-semibold mb-2">Hiring Status</h3>
                                        <div className="flex items-center gap-2 mb-4">
                                          {fellow.fte_employment_status === 'PL Hire' ? (
                                            <Badge variant="success" className="flex items-center gap-1">
                                              <CheckCircle2 className="h-3 w-3" />
                                              PL Hire
                                            </Badge>
                                          ) : fellow.fte_employment_status === 'Not Hired' ? (
                                            <Badge variant="destructive">Not Hired</Badge>
                                          ) : (
                                            <Badge variant="outline" className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              Pending Decision
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                          <Button 
                                            size="sm" 
                                            variant="success"
                                            onClick={() => {
                                              // Update fellow employment status to 'PL Hire'
                                              toast.success('Status updated to PL Hire');
                                            }}
                                          >
                                            Mark as PL Hire
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="destructive"
                                            onClick={() => {
                                              // Update fellow employment status to 'Not Hired'
                                              toast.success('Status updated to Not Hired');
                                            }}
                                          >
                                            Mark as Not Hired
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h3 className="text-lg font-semibold mb-2">Notes & Feedback</h3>
                                      <div className="mb-4">
                                        <Textarea
                                          placeholder="Add a new note..."
                                          value={newNote}
                                          onChange={(e) => setNewNote(e.target.value)}
                                          className="mb-2"
                                          rows={4}
                                        />
                                        <Button 
                                          onClick={addNote}
                                          disabled={!newNote.trim()}
                                        >
                                          Add Note
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                        {notes[fellow.fellow_id!]?.length > 0 ? (
                                          notes[fellow.fellow_id!].map((note) => (
                                            <div key={note.id} className="p-3 bg-muted rounded-md">
                                              <div className="text-sm text-muted-foreground mb-1">
                                                {formatDate(note.created_at)}
                                              </div>
                                              <p className="whitespace-pre-wrap">{note.content}</p>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-muted-foreground">No notes added yet.</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          ) : (
            <div className="text-center p-8 bg-muted/50 rounded-md">
              <h3 className="text-xl font-medium text-muted-foreground">
                Select a campus to view fellows
              </h3>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Fellows</CardTitle>
                <CardDescription>Across all campuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">--</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>PL Hires</CardTitle>
                <CardDescription>Fellows marked for hiring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">--</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Decision</CardTitle>
                <CardDescription>Fellows awaiting decision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">--</div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Hiring Progress by Campus</CardTitle>
              <CardDescription>
                Overview of hiring decisions across all campuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <RefreshCw className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Stats will be available once hiring decisions are recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PLHiring;