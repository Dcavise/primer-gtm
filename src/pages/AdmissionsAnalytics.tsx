import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Sample data for the charts
const applicationData = [
  { name: 'Jan', applications: 65, acceptances: 40, enrollments: 30 },
  { name: 'Feb', applications: 80, acceptances: 45, enrollments: 35 },
  { name: 'Mar', applications: 95, acceptances: 60, enrollments: 45 },
  { name: 'Apr', applications: 120, acceptances: 75, enrollments: 50 },
  { name: 'May', applications: 105, acceptances: 65, enrollments: 48 },
  { name: 'Jun', applications: 90, acceptances: 55, enrollments: 40 },
];

const campusData = [
  { name: 'Main Campus', value: 45 },
  { name: 'North Campus', value: 25 },
  { name: 'Online', value: 20 },
  { name: 'South Campus', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdmissionsAnalytics: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admissions Analytics Dashboard</h1>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <Select defaultValue="6months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Campus</label>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                <SelectItem value="main">Main Campus</SelectItem>
                <SelectItem value="north">North Campus</SelectItem>
                <SelectItem value="south">South Campus</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">555</div>
            <div className="text-sm text-green-600">+12% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">62.4%</div>
            <div className="text-sm text-green-600">+5% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Enrollment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42.8%</div>
            <div className="text-sm text-red-600">-2% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Average Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 days</div>
            <div className="text-sm text-green-600">-3 days from last period</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Application Trends</CardTitle>
            <CardDescription>Applications, acceptances, and enrollments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={applicationData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                  <Bar dataKey="acceptances" fill="#82ca9d" name="Acceptances" />
                  <Bar dataKey="enrollments" fill="#ffc658" name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by Campus</CardTitle>
            <CardDescription>Distribution of applications across campuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={campusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="applications">
            <TabsList className="mb-4">
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="demographics">Demographics</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="sources">Lead Sources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="applications">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-left py-2">Applications</th>
                    <th className="text-left py-2">Acceptances</th>
                    <th className="text-left py-2">Enrollments</th>
                    <th className="text-left py-2">Acceptance Rate</th>
                    <th className="text-left py-2">Enrollment Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {applicationData.map((month) => (
                    <tr key={month.name} className="border-b">
                      <td className="py-2">{month.name}</td>
                      <td className="py-2">{month.applications}</td>
                      <td className="py-2">{month.acceptances}</td>
                      <td className="py-2">{month.enrollments}</td>
                      <td className="py-2">{((month.acceptances / month.applications) * 100).toFixed(1)}%</td>
                      <td className="py-2">{((month.enrollments / month.acceptances) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>
            
            <TabsContent value="demographics">
              <div className="text-center p-8 text-gray-500">
                Demographics data visualization would appear here
              </div>
            </TabsContent>
            
            <TabsContent value="programs">
              <div className="text-center p-8 text-gray-500">
                Program enrollment breakdown would appear here
              </div>
            </TabsContent>
            
            <TabsContent value="sources">
              <div className="text-center p-8 text-gray-500">
                Applicant source analysis would appear here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdmissionsAnalytics;
