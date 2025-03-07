import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const ATSTracker: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applicant Tracking System</h1>
        <Button>Add New Candidate</Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Filter by Role</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="developer">Developer</SelectItem>
              <SelectItem value="designer">Designer</SelectItem>
              <SelectItem value="manager">Project Manager</SelectItem>
              <SelectItem value="marketing">Marketing Specialist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Filter by Location</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="newyork">New York</SelectItem>
              <SelectItem value="sanfrancisco">San Francisco</SelectItem>
              <SelectItem value="chicago">Chicago</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Filter by Status</label>
          <Select defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Applied Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Applied</CardTitle>
                <CardDescription>15 candidates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">John Smith</div>
                  <div className="text-sm text-gray-500">Developer - Remote</div>
                  <div className="text-xs text-gray-400">Applied: 2025-03-05</div>
                </Card>
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">Sarah Johnson</div>
                  <div className="text-sm text-gray-500">Designer - New York</div>
                  <div className="text-xs text-gray-400">Applied: 2025-03-04</div>
                </Card>
              </CardContent>
            </Card>

            {/* Screening Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Screening</CardTitle>
                <CardDescription>8 candidates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">Michael Brown</div>
                  <div className="text-sm text-gray-500">Developer - Chicago</div>
                  <div className="text-xs text-gray-400">Screening: 2025-03-10</div>
                </Card>
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">Emily Davis</div>
                  <div className="text-sm text-gray-500">Marketing - Remote</div>
                  <div className="text-xs text-gray-400">Screening: 2025-03-12</div>
                </Card>
              </CardContent>
            </Card>
            
            {/* Interview Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Interview</CardTitle>
                <CardDescription>5 candidates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">David Wilson</div>
                  <div className="text-sm text-gray-500">Manager - San Francisco</div>
                  <div className="text-xs text-gray-400">Interview: 2025-03-15</div>
                </Card>
              </CardContent>
            </Card>
            
            {/* Offer Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Offer</CardTitle>
                <CardDescription>2 candidates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">Jennifer Lee</div>
                  <div className="text-sm text-gray-500">Developer - Remote</div>
                  <div className="text-xs text-gray-400">Offer sent: 2025-03-03</div>
                </Card>
              </CardContent>
            </Card>
            
            {/* Hired Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Hired</CardTitle>
                <CardDescription>3 candidates</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">Robert Garcia</div>
                  <div className="text-sm text-gray-500">Designer - New York</div>
                  <div className="text-xs text-gray-400">Hired: 2025-02-28</div>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Applied Date</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">John Smith</td>
                    <td className="py-2">Developer</td>
                    <td className="py-2">Remote</td>
                    <td className="py-2">Applied</td>
                    <td className="py-2">2025-03-05</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Sarah Johnson</td>
                    <td className="py-2">Designer</td>
                    <td className="py-2">New York</td>
                    <td className="py-2">Applied</td>
                    <td className="py-2">2025-03-04</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Michael Brown</td>
                    <td className="py-2">Developer</td>
                    <td className="py-2">Chicago</td>
                    <td className="py-2">Screening</td>
                    <td className="py-2">2025-03-01</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Emily Davis</td>
                    <td className="py-2">Marketing</td>
                    <td className="py-2">Remote</td>
                    <td className="py-2">Screening</td>
                    <td className="py-2">2025-03-02</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">David Wilson</td>
                    <td className="py-2">Manager</td>
                    <td className="py-2">San Francisco</td>
                    <td className="py-2">Interview</td>
                    <td className="py-2">2025-02-25</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ATSTracker;
