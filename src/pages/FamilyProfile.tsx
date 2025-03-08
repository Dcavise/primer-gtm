import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PhoneIcon, MapPinIcon, DollarSignIcon, CalendarIcon, UserIcon, BookOpenIcon } from 'lucide-react';

// Student interface
interface Student {
  id: string;
  name: string;
  enrollmentDate: string;
  campus: string;
  teacher: string;
  grade: string;
}

// Family data interface
interface FamilyData {
  id: string;
  familyName: string;
  campus: string;
  phoneNumber: string;
  address: string;
  tuitionAmount: string;
  students: Student[];
}

// Mock data for testing - will be replaced with real data in production
const mockFamilyData: Record<string, FamilyData> = {
  "johnson": {
    id: "johnson",
    familyName: "Johnson Family",
    campus: "Riverdale Campus",
    phoneNumber: "(555) 123-4567",
    address: "123 Main Street, Riverdale, NY 10471",
    tuitionAmount: "$12,500",
    students: [
      {
        id: "s1",
        name: "Emma Johnson",
        enrollmentDate: "Sept 2023",
        campus: "Riverdale Campus",
        teacher: "Ms. Williams",
        grade: "3rd Grade"
      },
      {
        id: "s2",
        name: "Noah Johnson",
        enrollmentDate: "Sept 2022",
        campus: "Riverdale Campus",
        teacher: "Mr. Garcia",
        grade: "5th Grade"
      }
    ]
  },
  "martinez": {
    id: "martinez",
    familyName: "Martinez Family",
    campus: "Oakridge Campus",
    phoneNumber: "(555) 234-5678",
    address: "456 Oak Avenue, Oakridge, CA 94563",
    tuitionAmount: "$13,750",
    students: [
      {
        id: "s3",
        name: "Sofia Martinez",
        enrollmentDate: "Jan 2023",
        campus: "Oakridge Campus",
        teacher: "Mrs. Chen",
        grade: "2nd Grade"
      }
    ]
  },
  // Add other families from your mock data
};

const FamilyProfile: React.FC = () => {
  const { familyId } = useParams<{ familyId: string }>();
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchFamilyData = () => {
      setLoading(true);
      try {
        if (!familyId) {
          setError("No family ID provided");
          setLoading(false);
          return;
        }

        const data = mockFamilyData[familyId];
        if (!data) {
          setError(`Family with ID ${familyId} not found`);
          setLoading(false);
          return;
        }

        setFamilyData(data);
        setError(null);
      } catch (err) {
        setError("Error fetching family data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilyData();
  }, [familyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !familyData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <h2 className="text-lg font-medium text-red-800">Error</h2>
        <p className="text-red-700">{error || "Unknown error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{familyData.familyName}</h1>
        <div className="flex items-center mt-2">
          <Badge variant="outline" className="mr-2">{familyData.campus}</Badge>
          <Badge variant="secondary" className="mr-2">
            {familyData.students.length} Student{familyData.students.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Phone Number</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <PhoneIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p>{familyData.phoneNumber}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Address</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p className="truncate">{familyData.address}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tuition (Out of Pocket)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <DollarSignIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <p>{familyData.tuitionAmount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Students</h3>
        <div className="space-y-4">
          {familyData.students.map((student) => (
            <Card key={student.id}>
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <Avatar className="h-12 w-12 mr-4">
                    <div className="bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center">
                      {student.name.split(' ')[0][0]}{student.name.split(' ')[1][0]}
                    </div>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium">{student.name}</h4>
                    <div className="text-sm text-muted-foreground mb-2">{student.grade}</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center">
                        <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>Enrolled: {student.enrollmentDate}</span>
                      </div>
                      <div className="flex items-center">
                        <UserIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>Teacher: {student.teacher}</span>
                      </div>
                      <div className="flex items-center">
                        <BookOpenIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>{student.campus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator className="my-6" />

      <Tabs defaultValue="tuition">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tuition">Tuition & Billing</TabsTrigger>
          <TabsTrigger value="support">Customer Support</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tuition" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tuition & Billing Information</CardTitle>
              <CardDescription>Manage family tuition, payment plans, and billing details</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tuition content here */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Current Plan</h4>
                    <p className="text-muted-foreground">Annual Payment Plan</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Payment Status</h4>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Up to date</Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Last Payment</h4>
                    <p className="text-muted-foreground">$3,125 - March 1, 2025</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">Next Payment</h4>
                    <p className="text-muted-foreground">$3,125 - June 1, 2025</p>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline">Payment History</Button>
                  <Button>Manage Payments</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="support" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Support</CardTitle>
              <CardDescription>View support tickets and communication history</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Support content here */}
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-center">
                  <p className="text-yellow-700">No active support tickets for this family</p>
                </div>
                
                <h4 className="font-medium text-sm mb-2">Recent Communications</h4>
                <div className="border rounded-md divide-y">
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">Enrollment Confirmation</h5>
                        <p className="text-sm text-muted-foreground">Email sent regarding 2025-2026 enrollment</p>
                      </div>
                      <Badge variant="outline">Feb 15, 2025</Badge>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">Parent-Teacher Conference</h5>
                        <p className="text-sm text-muted-foreground">Email confirming spring conference schedule</p>
                      </div>
                      <Badge variant="outline">Jan 20, 2025</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attendance" className="space-y-4 mt-4">
          {/* Implement attendance tab content */}
        </TabsContent>
        
        <TabsContent value="academics" className="space-y-4 mt-4">
          {/* Implement academics tab content */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FamilyProfile;