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
import { LoadingState } from "@/components/LoadingState";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

interface Fellow {
  id: string;
  fellow_id: number;
  fellow_name: string;
  campus_id: string;
  cohort: string;
  grade_band: string;
  fte_employment_status: string;
  interview_status: string;
}

interface Campus {
  campus_id: string;
  campus_name: string;
}

interface FellowNote {
  id: string;
  fellow_id: number;
  content: string;
  created_at: string;
  created_by: string;
}

// Mock data for campuses
const MOCK_CAMPUSES: Campus[] = [
  { campus_id: "1", campus_name: "San Francisco" },
  { campus_id: "2", campus_name: "New York" },
  { campus_id: "3", campus_name: "Chicago" },
  { campus_id: "4", campus_name: "Austin" }
];

// Mock data for fellows
const MOCK_FELLOWS: Record<string, Fellow[]> = {
  "1": [
    { id: "1", fellow_id: 101, fellow_name: "Alex Johnson", campus_id: "1", cohort: "Spring 2023", grade_band: "A", fte_employment_status: "Hired", interview_status: "Completed" },
    { id: "2", fellow_id: 102, fellow_name: "Jamie Smith", campus_id: "1", cohort: "Spring 2023", grade_band: "B+", fte_employment_status: "In Progress", interview_status: "Scheduled" },
    { id: "3", fellow_id: 103, fellow_name: "Taylor Brown", campus_id: "1", cohort: "Fall 2022", grade_band: "A-", fte_employment_status: "Not Started", interview_status: "Not Started" }
  ],
  "2": [
    { id: "4", fellow_id: 201, fellow_name: "Morgan Lee", campus_id: "2", cohort: "Spring 2023", grade_band: "A+", fte_employment_status: "Hired", interview_status: "Completed" },
    { id: "5", fellow_id: 202, fellow_name: "Casey Wilson", campus_id: "2", cohort: "Fall 2022", grade_band: "B", fte_employment_status: "Not Started", interview_status: "Not Started" }
  ],
  "3": [
    { id: "6", fellow_id: 301, fellow_name: "Jordan Miller", campus_id: "3", cohort: "Spring 2023", grade_band: "A-", fte_employment_status: "In Progress", interview_status: "Scheduled" },
    { id: "7", fellow_id: 302, fellow_name: "Riley Davis", campus_id: "3", cohort: "Fall 2022", grade_band: "B+", fte_employment_status: "Not Started", interview_status: "Not Started" }
  ],
  "4": [
    { id: "8", fellow_id: 401, fellow_name: "Quinn Martinez", campus_id: "4", cohort: "Spring 2023", grade_band: "A", fte_employment_status: "Hired", interview_status: "Completed" }
  ]
};

// Mock data for notes
const MOCK_NOTES: Record<number, FellowNote[]> = {
  101: [
    { id: "n1", fellow_id: 101, content: "Excellent performance in technical interviews", created_at: "2023-05-15T14:30:00Z", created_by: "Admin" },
    { id: "n2", fellow_id: 101, content: "Strong leadership skills demonstrated during group project", created_at: "2023-04-20T10:15:00Z", created_by: "Admin" }
  ],
  201: [
    { id: "n3", fellow_id: 201, content: "Outstanding problem-solving abilities", created_at: "2023-05-10T09:45:00Z", created_by: "Admin" }
  ],
  301: [
    { id: "n4", fellow_id: 301, content: "Good communication skills, needs improvement in technical areas", created_at: "2023-05-05T16:20:00Z", created_by: "Admin" }
  ],
  401: [
    { id: "n5", fellow_id: 401, content: "Exceptional project work, highly recommended", created_at: "2023-05-12T11:30:00Z", created_by: "Admin" }
  ]
};

const PLHiring = () => {
  const [selectedCampus, setSelectedCampus] = useState<string | null>(null);
  const [fellows, setFellows] = useState<Fellow[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Record<number, FellowNote[]>>(MOCK_NOTES);
  const [newNote, setNewNote] = useState("");
  const [selectedFellow, setSelectedFellow] = useState<Fellow | null>(null);

  // Fetch fellows for the selected campus (using mock data)
  useEffect(() => {
    if (!selectedCampus) return;
    
    // Simulate loading
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      setFellows(MOCK_FELLOWS[selectedCampus] || []);
      setLoading(false);
    }, 500);
    
  }, [selectedCampus]);

  // Add a new note for the selected fellow
  const addNote = async () => {
    if (!selectedFellow || !newNote.trim() || !selectedFellow.fellow_id) {
      return;
    }
    
    // Create a new note with mock data
    const newNoteObj: FellowNote = {
      id: uuidv4(),
      fellow_id: selectedFellow.fellow_id,
      content: newNote.trim(),
      created_at: new Date().toISOString(),
      created_by: "current_user"
    };
    
    // Update the notes state
    setNotes(prev => {
      const updatedNotes = { ...prev };
      if (!updatedNotes[selectedFellow.fellow_id!]) {
        updatedNotes[selectedFellow.fellow_id!] = [];
      }
      updatedNotes[selectedFellow.fellow_id!] = [
        newNoteObj,
        ...(updatedNotes[selectedFellow.fellow_id!] || [])
      ];
      return updatedNotes;
    });
    
    setNewNote("");
    toast.success('Note added successfully');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <LoadingState message="Loading fellows..." />;
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
            {MOCK_CAMPUSES.map(campus => (
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
                            {fellow.fte_employment_status === 'Hired' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Hired
                              </Badge>
                            ) : fellow.fte_employment_status === 'In Progress' ? (
                              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                <Clock className="h-3 w-3 mr-1" />
                                In Progress
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                                Not Started
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {notes[fellow.fellow_id!]?.length || 0} notes
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
                                  View Notes
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Notes for {fellow.fellow_name}</DialogTitle>
                                  <DialogDescription>
                                    Review and add notes for this fellow
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="mt-4 space-y-4">
                                  {/* Add note form */}
                                  <div className="space-y-2">
                                    <h3 className="text-sm font-medium">Add a new note</h3>
                                    <Textarea 
                                      placeholder="Enter your note here..." 
                                      value={newNote}
                                      onChange={(e) => setNewNote(e.target.value)}
                                      className="min-h-[100px]"
                                    />
                                    <Button 
                                      onClick={addNote}
                                      disabled={!newNote.trim()}
                                    >
                                      Add Note
                                    </Button>
                                  </div>
                                  
                                  <Separator />
                                  
                                  {/* Notes list */}
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Previous Notes</h3>
                                    
                                    {!notes[fellow.fellow_id!] || notes[fellow.fellow_id!].length === 0 ? (
                                      <p className="text-sm text-muted-foreground">No notes available for this fellow.</p>
                                    ) : (
                                      <div className="space-y-3">
                                        {notes[fellow.fellow_id!].map((note) => (
                                          <div key={note.id} className="bg-muted p-3 rounded-md">
                                            <p className="text-sm mb-2">{note.content}</p>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                              <span>Added by: {note.created_by}</span>
                                              <span>{formatDate(note.created_at)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
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
          ) : (
            <div className="text-center p-8 bg-muted rounded-md">
              <h3 className="text-lg font-medium mb-2">Select a Campus</h3>
              <p className="text-muted-foreground">Choose a campus from above to view fellows</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Progress</CardTitle>
                <CardDescription>Overall hiring status across all campuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Hired</span>
                      <span>3 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>In Progress</span>
                      <span>2 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Not Started</span>
                      <span>5 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-gray-400 h-2.5 rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Fellow grades across all cohorts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>A+/A</span>
                      <span>4 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>A-/B+</span>
                      <span>3 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>B/B-</span>
                      <span>3 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cohort Breakdown</CardTitle>
                <CardDescription>Fellows by cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Spring 2023</span>
                      <span>6 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Fall 2022</span>
                      <span>4 fellows</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PLHiring;