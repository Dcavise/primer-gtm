import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Badge } from "../components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

// Sample data for the charts
const applicationData = [
  { name: 'Mar 1', applications: 65, acceptances: 40, enrollments: 30, trend: 55 },
  { name: 'Mar 2', applications: 80, acceptances: 45, enrollments: 35, trend: 60 },
  { name: 'Mar 3', applications: 95, acceptances: 60, enrollments: 45, trend: 67 },
  { name: 'Mar 4', applications: 120, acceptances: 75, enrollments: 50, trend: 80 },
  { name: 'Mar 5', applications: 105, acceptances: 65, enrollments: 48, trend: 90 },
  { name: 'Mar 6', applications: 90, acceptances: 55, enrollments: 40, trend: 85 },
  { name: 'Mar 7', applications: 110, acceptances: 70, enrollments: 52, trend: 95 },
];

const campusData = [
  { name: 'Main Campus', value: 45 },
  { name: 'North Campus', value: 25 },
  { name: 'Online', value: 20 },
  { name: 'South Campus', value: 10 },
];

// Daily data for metrics charts - using actual dates from early March 2025
const dailyData = [
  { date: '3/2', leadsCreated: 15, leadsConverted: 6, admissionOffered: 4, closedWon: 2 },
  { date: '3/3', leadsCreated: 18, leadsConverted: 8, admissionOffered: 5, closedWon: 3 },
  { date: '3/4', leadsCreated: 22, leadsConverted: 10, admissionOffered: 7, closedWon: 4 },
  { date: '3/5', leadsCreated: 20, leadsConverted: 9, admissionOffered: 6, closedWon: 3 },
  { date: '3/6', leadsCreated: 24, leadsConverted: 12, admissionOffered: 8, closedWon: 5 },
  { date: '3/7', leadsCreated: 19, leadsConverted: 8, admissionOffered: 5, closedWon: 2 },
];

// Weekly data for metrics charts - using actual week start dates
const weeklyData = [
  { date: '2/7', leadsCreated: 95, leadsConverted: 42, admissionOffered: 28, closedWon: 15 },  // 4 weeks ago
  { date: '2/14', leadsCreated: 105, leadsConverted: 48, admissionOffered: 32, closedWon: 18 }, // 3 weeks ago
  { date: '2/21', leadsCreated: 112, leadsConverted: 52, admissionOffered: 35, closedWon: 20 }, // 2 weeks ago
  { date: '2/28', leadsCreated: 120, leadsConverted: 58, admissionOffered: 38, closedWon: 22 }, // 1 week ago
  { date: '3/7', leadsCreated: 115, leadsConverted: 55, admissionOffered: 36, closedWon: 21 },  // current week
];

// Monthly data for metrics charts - using first day of the month
const monthlyData = [
  { date: '11/1', leadsCreated: 380, leadsConverted: 175, admissionOffered: 120, closedWon: 65 },  // 4 months ago
  { date: '12/1', leadsCreated: 420, leadsConverted: 195, admissionOffered: 130, closedWon: 75 },  // 3 months ago
  { date: '1/1', leadsCreated: 450, leadsConverted: 210, admissionOffered: 145, closedWon: 82 },   // 2 months ago
  { date: '2/1', leadsCreated: 485, leadsConverted: 230, admissionOffered: 155, closedWon: 90 },   // 1 month ago
  { date: '3/1', leadsCreated: 320, leadsConverted: 150, admissionOffered: 100, closedWon: 55 },   // current month
];

// Trend data for line charts - daily granularity
const dailyTrendData = [
  { date: '3/30', leadsCreated: 15, leadsConverted: 6, admissionOffered: 4, closedWon: 2 },
  { date: '3/31', leadsCreated: 18, leadsConverted: 8, admissionOffered: 5, closedWon: 3 },
  { date: '4/01', leadsCreated: 22, leadsConverted: 10, admissionOffered: 7, closedWon: 4 },
  { date: '4/02', leadsCreated: 20, leadsConverted: 9, admissionOffered: 6, closedWon: 3 },
  { date: '4/03', leadsCreated: 24, leadsConverted: 12, admissionOffered: 8, closedWon: 5 },
  { date: '4/04', leadsCreated: 19, leadsConverted: 8, admissionOffered: 5, closedWon: 2 },
  { date: '4/05', leadsCreated: 17, leadsConverted: 7, admissionOffered: 4, closedWon: 2 },
];

// Trend data for line charts - weekly granularity
const weeklyTrendData = [
  { date: 'Week 12', leadsCreated: 85, leadsConverted: 38, admissionOffered: 25, closedWon: 14 },
  { date: 'Week 13', leadsCreated: 95, leadsConverted: 42, admissionOffered: 28, closedWon: 15 },
  { date: 'Week 14', leadsCreated: 105, leadsConverted: 48, admissionOffered: 32, closedWon: 18 },
  { date: 'Week 15', leadsCreated: 112, leadsConverted: 52, admissionOffered: 35, closedWon: 20 },
  { date: 'Week 16', leadsCreated: 120, leadsConverted: 58, admissionOffered: 38, closedWon: 22 },
  { date: 'Week 17', leadsCreated: 115, leadsConverted: 55, admissionOffered: 36, closedWon: 21 },
];

// Trend data for line charts - monthly granularity
const monthlyTrendData = [
  { date: 'Nov', leadsCreated: 320, leadsConverted: 150, admissionOffered: 100, closedWon: 55 },
  { date: 'Dec', leadsCreated: 350, leadsConverted: 165, admissionOffered: 110, closedWon: 60 },
  { date: 'Jan', leadsCreated: 380, leadsConverted: 175, admissionOffered: 120, closedWon: 65 },
  { date: 'Feb', leadsCreated: 420, leadsConverted: 195, admissionOffered: 130, closedWon: 75 },
  { date: 'Mar', leadsCreated: 450, leadsConverted: 210, admissionOffered: 145, closedWon: 82 },
  { date: 'Apr', leadsCreated: 485, leadsConverted: 230, admissionOffered: 155, closedWon: 90 },
];

// Sample metrics data
const admissionsMetrics = [
  {
    id: 'leads-created',
    name: 'Leads Created',
    weekToDate: { value: 128.0, change: -4.2 },
    last7Days: { value: 58.5, change: -18.6 },
    last28Days: { value: 230.7, change: +6.6 },
  },
  {
    id: 'leads-converted',
    name: 'Leads Converted',
    weekToDate: { value: 42.8, change: +2.8 },
    last7Days: { value: 24.3, change: +0.1 },
    last28Days: { value: 112.8, change: -0.3 },
  },
  {
    id: 'admission-offered',
    name: 'Admission Offered',
    weekToDate: { value: 22.5, change: -5.9 },
    last7Days: { value: 12.1, change: -22.1 },
    last28Days: { value: 84.9, change: +60.2 },
  },
  {
    id: 'closed-won',
    name: 'New Closed Won',
    weekToDate: { value: 16.7, change: +2.5 },
    last7Days: { value: 8.1, change: +4.8 },
    last28Days: { value: 28.5, change: -7.5 },
  },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Sample open pipeline data
const openPipelineData = [
  { name: 'Family Interview', value: 85, fill: '#8884d8' },
  { name: 'Awaiting Documents', value: 65, fill: '#83a6ed' },
  { name: 'Admission Offered', value: 45, fill: '#8dd1e1' },
  { name: 'Closed Won', value: 30, fill: '#82ca9d' },
];

const AdmissionsAnalytics: React.FC = () => {
  // State for date truncation selection
  const [dateTruncation, setDateTruncation] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Function to format dates in a reader-friendly format
  const formatDateHeader = (dateString: string) => {
    // For 'Today', 'Week to Date', and 'Month to Date' special cases
    if (['Today', 'Week to Date', 'Month to Date'].includes(dateString)) {
      return dateString;
    }
    
    // Format as MM/DD
    const [month, day] = dateString.split('/');
    return `${month}/${day}`;
  };

  // Helper function to get appropriate data based on the selected date truncation
  const getDataByTruncation = () => {
    switch (dateTruncation) {
      case 'daily': {
        // Create a copy of the last 3 days of data
        const days = dailyData.slice(-4, -1);
        // Add today as "Today" for the last entry
        const withToday = [...days, { ...dailyData[dailyData.length - 1], date: 'Today' }];
        return withToday;
      }
      case 'weekly': {
        // Create a copy of the last 3 weeks of data (use the actual start dates from the data)
        const weeks = weeklyData.slice(-5, -1); // Getting 4 weeks excluding current
        // Add the current week as "Week to Date" for the last entry
        const withCurrentWeek = [...weeks, { ...weeklyData[weeklyData.length - 1], date: 'Week to Date' }];
        return withCurrentWeek;
      }
      case 'monthly': {
        // Create a copy of the last 3 months of data (use the actual dates from the data)
        const months = monthlyData.slice(-5, -1); // Getting 4 months excluding current
        // Add the current month as "Month to Date" for the last entry
        const withCurrentMonth = [...months, { ...monthlyData[monthlyData.length - 1], date: 'Month to Date' }];
        return withCurrentMonth;
      }
      default:
        return dailyData.slice(-4);
    }
  };

  // Helper to format values
  const formatValue = (value: number) => {
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1);
  };

  // Helper to format change percentages
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}`;
  };

  // Helper to get appropriate color class for change values
  const getChangeColor = (change: number) => {
    return change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Helper function to get appropriate trend data based on the selected date truncation
  const getTrendDataByTruncation = () => {
    switch (dateTruncation) {
      case 'daily':
        return dailyTrendData;
      case 'weekly':
        return weeklyTrendData;
      case 'monthly':
        return monthlyTrendData;
      default:
        return dailyTrendData;
    }
  };

  // Generate dynamic column headers based on the selected date truncation
  const columnData = getDataByTruncation();
  const currentTrendData = getTrendDataByTruncation();

  return (
    <div className="container mx-auto p-4">
      {/* Dashboard header with improved design */}
      <Card className="mb-6 border-none shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 flex items-center mb-1">
                <span className="inline-flex items-center justify-center h-10 w-10 bg-slate-100 rounded-md mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
                Admissions Analytics
              </h1>
              <p className="text-slate-500 ml-12 text-sm">25/26 Primer Student Enrollment</p>
            </div>
            
            <div className="flex items-center bg-white rounded-md px-3 py-1 shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 mr-2">Last updated:</span>
              <span className="text-sm font-medium">March 7, 2025</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-white p-3 rounded-md border border-gray-100">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date Truncation
              </label>
              <Select 
                value={dateTruncation}
                onValueChange={(value) => setDateTruncation(value as 'daily' | 'weekly' | 'monthly')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date truncation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Campus
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full">
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
      </Card>
      
      {/* Metrics Section */}
      <div className="mb-8 bg-white rounded-lg border shadow-sm">
        <div className="px-4 py-4">
          <div className="flex border-b pb-2 text-sm font-medium text-gray-500">
            <div className="w-1/6"></div>
            {columnData.map((item, index) => (
              <div key={index} className="w-1/6 text-center">{formatDateHeader(item.date)}</div>
            ))}
            <div className="w-1/3 pr-2 pl-4 text-center">Trend</div>
          </div>
          
          <div className="flex flex-col divide-y">
            {admissionsMetrics.map((metric) => (
              <div key={metric.id} className="flex py-3 items-center">
                <div className="w-1/6 font-medium">{metric.name}</div>
                
                {columnData.map((item, index) => {
                  const value = metric.id === 'leads-created' ? item.leadsCreated :
                               metric.id === 'leads-converted' ? item.leadsConverted :
                               metric.id === 'admission-offered' ? item.admissionOffered : item.closedWon;
                  
                  // Calculate a random change percentage for demonstration purposes
                  // In real app, this would come from actual data comparison
                  const change = (Math.random() * 20) - 10;
                  
                  return (
                    <div key={index} className="w-1/6 text-center">
                      <div className="font-semibold">{formatValue(value)}</div>
                      <Badge variant="outline" className={`mt-1 ${getChangeColor(change)}`}>
                        {formatChange(change)}%
                      </Badge>
                    </div>
                  );
                })}
                
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentTrendData}>
                      <Line 
                        type="monotone" 
                        dataKey={metric.id === 'leads-created' ? 'leadsCreated' : 
                                metric.id === 'leads-converted' ? 'leadsConverted' : 
                                metric.id === 'admission-offered' ? 'admissionOffered' : 'closedWon'} 
                        stroke="#8884d8" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">555</div>
            <div className="text-sm text-green-600">+12% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Admission Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">62.4%</div>
            <div className="text-sm text-green-600">+5% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42.8%</div>
            <div className="text-sm text-red-600">-2% from last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Capacity Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12 days</div>
            <div className="text-sm text-green-600">-3 days from last period</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>Pipeline stages from Family Interview to Closed Won</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={openPipelineData}
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
                  <Line type="monotone" dataKey="trend" stroke="#ff7300" strokeWidth={2} name="Trend" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default AdmissionsAnalytics;
