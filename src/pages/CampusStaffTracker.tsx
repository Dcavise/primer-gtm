import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { ChevronDown, Plus, UserRound } from "lucide-react";

const CampusStaffTracker: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState<string>("riverdale");

  // Campus data
  const campuses = [
    { id: "riverdale", name: "Riverdale Campus" },
    { id: "brooklyn", name: "Brooklyn Campus" },
    { id: "queens", name: "Queens Campus" },
    { id: "bronx", name: "Bronx Campus" },
    { id: "manhattan", name: "Manhattan Campus" },
  ];

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col space-y-4 mb-6">
        {/* Campus Selector Header - similar to the wireframe */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Select value={selectedCampus} onValueChange={setSelectedCampus}>
              <SelectTrigger className="min-w-[220px] bg-white border-gray-300">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  <SelectValue placeholder="Select campus" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center">{/* Filter button removed */}</div>
        </div>

        {/* Descriptive paragraph removed */}
      </div>

      {/* Pipeline Stages Tabs */}
      <div className="border-b mb-6">
        <div className="grid grid-cols-5 w-full">
          <button className="border-b-2 border-black py-3 text-center font-medium text-black">
            Applied
          </button>
          <button className="py-3 text-center text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300">
            Interviewing
          </button>
          <button className="py-3 text-center text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300">
            Fellowship
          </button>
          <button className="py-3 text-center text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300">
            Made Offer
          </button>
          <button className="py-3 text-center text-gray-500 hover:text-black hover:border-b-2 hover:border-gray-300">
            Hired
          </button>
        </div>
      </div>

      {/* Qualified/Disqualified Filter section removed */}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search name, headline or tag"
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

      {/* Candidates List */}
      {/* First Tab: Current Applied View */}
      <div className="space-y-4">
        {/* Candidate Card 1 */}
        <Card className="border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <input type="checkbox" className="mt-2" />
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <h3 className="font-medium">Max Lackner</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Senior Visual Interaction Design
                </p>

                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    media
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    creative
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    agency
                  </Badge>
                </div>

                <div className="flex items-center mt-3 text-xs text-gray-500">
                  <span>via twitter.com</span>
                  <span className="mx-2">•</span>
                  <span>4 days ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidate Card 2 */}
        <Card className="border hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <input type="checkbox" className="mt-2" />
              <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <h3 className="font-medium">Jenny Wilson</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Senior Design Lead at IDEO
                </p>

                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    media
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    creative
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                  >
                    agency
                  </Badge>
                </div>

                <div className="flex items-center mt-3 text-xs text-gray-500">
                  <span>via worktable.com</span>
                  <span className="mx-2">•</span>
                  <span>4 days ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs UI for different view modes */}
      <Tabs defaultValue="cards" className="w-full mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="cards">Cards View</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {/* Card view is already implemented above */}
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
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Sarah Johnson</td>
                    <td className="py-2">Designer</td>
                    <td className="py-2">New York</td>
                    <td className="py-2">Applied</td>
                    <td className="py-2">2025-03-04</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Michael Brown</td>
                    <td className="py-2">Developer</td>
                    <td className="py-2">Chicago</td>
                    <td className="py-2">Screening</td>
                    <td className="py-2">2025-03-01</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">Emily Davis</td>
                    <td className="py-2">Marketing</td>
                    <td className="py-2">Remote</td>
                    <td className="py-2">Screening</td>
                    <td className="py-2">2025-03-02</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">David Wilson</td>
                    <td className="py-2">Manager</td>
                    <td className="py-2">San Francisco</td>
                    <td className="py-2">Interview</td>
                    <td className="py-2">2025-02-25</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
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

export default CampusStaffTracker;
