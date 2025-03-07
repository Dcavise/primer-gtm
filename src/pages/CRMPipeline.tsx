import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const CRMPipeline: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">CRM Pipeline Management</h1>
        <Button>Add New Deal</Button>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Lead Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Leads</CardTitle>
                <CardDescription>New opportunities</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                {/* Sample Cards */}
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">123 Main Street Property</div>
                  <div className="text-sm text-gray-500">Added: 2025-03-01</div>
                </Card>
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">456 Park Avenue Listing</div>
                  <div className="text-sm text-gray-500">Added: 2025-02-28</div>
                </Card>
              </CardContent>
            </Card>

            {/* In Progress Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">In Discussion</CardTitle>
                <CardDescription>Active discussions</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">789 Business Center</div>
                  <div className="text-sm text-gray-500">Meeting: 2025-03-10</div>
                </Card>
              </CardContent>
            </Card>
            
            {/* Negotiation Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Negotiation</CardTitle>
                <CardDescription>Finalizing details</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">101 Tech Park Office Space</div>
                  <div className="text-sm text-gray-500">Offer sent: 2025-03-05</div>
                </Card>
              </CardContent>
            </Card>
            
            {/* Closed Column */}
            <Card>
              <CardHeader className="bg-gray-100 pb-2">
                <CardTitle className="text-lg">Closed Deals</CardTitle>
                <CardDescription>Completed transactions</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">555 Harbor View Apartment</div>
                  <div className="text-sm text-gray-500">Closed: 2025-03-02</div>
                </Card>
                <Card className="mb-2 p-3 cursor-move">
                  <div className="font-medium">222 Retail Center Space</div>
                  <div className="text-sm text-gray-500">Closed: 2025-02-25</div>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Property</th>
                    <th className="text-left py-2">Stage</th>
                    <th className="text-left py-2">Date Added</th>
                    <th className="text-left py-2">Last Activity</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample rows */}
                  <tr className="border-b">
                    <td className="py-2">123 Main Street Property</td>
                    <td className="py-2">Lead</td>
                    <td className="py-2">2025-03-01</td>
                    <td className="py-2">New contact added</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">456 Park Avenue Listing</td>
                    <td className="py-2">Lead</td>
                    <td className="py-2">2025-02-28</td>
                    <td className="py-2">Document uploaded</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">789 Business Center</td>
                    <td className="py-2">In Discussion</td>
                    <td className="py-2">2025-02-25</td>
                    <td className="py-2">Meeting scheduled</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">101 Tech Park Office Space</td>
                    <td className="py-2">Negotiation</td>
                    <td className="py-2">2025-02-20</td>
                    <td className="py-2">Offer sent</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">555 Harbor View Apartment</td>
                    <td className="py-2">Closed</td>
                    <td className="py-2">2025-02-15</td>
                    <td className="py-2">Deal closed</td>
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

export default CRMPipeline;
