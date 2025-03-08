import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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

const COLORS = ['#474b4f', '#6b6e70', '#86888a', '#a9aaab'];

// Sample open pipeline data
const openPipelineData = [
  { name: 'Family Interview', value: 85, fill: '#474b4f' },
  { name: 'Awaiting Documents', value: 65, fill: '#6b6e70' },
  { name: 'Admission Offered', value: 45, fill: '#86888a' },
  { name: 'Closed Won', value: 30, fill: '#a9aaab' },
];

const AdmissionsAnalytics = () => {
  // State for date truncation selection
  const [dateTruncation, setDateTruncation] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Simple function to format dates
  const formatDateHeader = (dateString: string) => {
    return dateString;
  };

  // Helper function to get appropriate data based on the selected date truncation
  const getDataByTruncation = () => {
    switch (dateTruncation) {
      case 'daily': {
        // Create a copy of the last 4 days of data so we have 5 total columns
        const days = dailyData.slice(-5, -1);
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
    const value = Number.isNaN(change) ? 0 : change;
    return `${sign}${value.toFixed(1)}`;
  };

  // Helper to get appropriate color class for change values
  // Keeping red/green indicators for changes as requested
  const getChangeColor = (change: number) => {
    return change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Helper function to get appropriate trend data based on the selected date truncation
  const getTrendDataByTruncation = () => {
    return dailyTrendData;
  };

  // Generate dynamic column headers based on the selected date truncation
  const columnData = getDataByTruncation();
  const currentTrendData = getTrendDataByTruncation();

  return (
    <div className="container mx-auto py-6 px-8 max-w-7xl bg-seasalt">
      <h1 className="text-2xl font-semibold text-eerie-black mb-6">PRIME TIME</h1>
      {/* Dashboard header with improved design */}
      <Card className="mb-8 border border-platinum bg-seasalt overflow-hidden rounded-lg shadow-sm">
        <div className="px-0">

          
          <div className="flex flex-wrap items-center justify-between p-5 bg-seasalt">
            {/* Campus Selection Dropdown - Extended Width */}
            <div className="w-full md:w-1/3 mb-3 md:mb-0 md:mr-4">
              <Select defaultValue="all">
                <SelectTrigger className="w-full border border-platinum rounded-md px-4 py-2 shadow-sm hover:border-french-gray focus:outline-none">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <SelectValue placeholder="All Campuses" />
                  </div>
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

            {/* Truncation Options */}
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-2 rounded-md ${dateTruncation === 'daily' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={dateTruncation === 'daily' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setDateTruncation('daily')}
              >
                Daily
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${dateTruncation === 'weekly' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={dateTruncation === 'weekly' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setDateTruncation('weekly')}
              >
                Weekly
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${dateTruncation === 'monthly' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={dateTruncation === 'monthly' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setDateTruncation('monthly')}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Metrics Section */}
      <div className="mb-8 bg-seasalt rounded-lg border border-platinum shadow-sm">
        <div className="px-4 py-4">
          <div className="flex border-b pb-2 text-sm font-medium text-slate-gray">
            <div className="w-1/6"></div>
            {columnData.map((item, index) => (
              <div key={index} className="w-1/6 text-center">{formatDateHeader(item.date)}</div>
            ))}
            <div className="w-1/3 pr-2 pl-4 text-center">Trend</div>
          </div>
          
          <div className="flex flex-col divide-y">
            {admissionsMetrics.map((metric) => (
              <div key={metric.id} className="flex py-3 items-center">
                <div className="w-1/6 font-medium text-outer-space">{metric.name}</div>
                
                {columnData.map((item, index) => {
                  const value = metric.id === 'leads-created' ? item.leadsCreated :
                               metric.id === 'leads-converted' ? item.leadsConverted :
                               metric.id === 'admission-offered' ? item.admissionOffered : item.closedWon;
                  
                  // Calculate a random change percentage for demonstration purposes
                  // In real app, this would come from actual data comparison
                  const change = (Math.random() * 20) - 10;
                  
                  return (
                    <div key={index} className="w-1/6 text-center">
                      <div className="font-semibold text-eerie-black">{formatValue(value)}</div>
                      <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${getChangeColor(change)}`}>
                        {formatChange(change)}%
                      </div>
                    </div>
                  );
                })}
                
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Line 
                        type="monotone" 
                        dataKey={metric.id === 'leads-created' ? 'leadsCreated' : 
                               metric.id === 'leads-converted' ? 'leadsConverted' : 
                               metric.id === 'admission-offered' ? 'admissionOffered' : 'closedWon'} 
                        stroke="#474b4f" 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={false}
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
        <Card className="bg-seasalt border border-platinum">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-gray">Total Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-eerie-black">555</div>
            <div className="text-sm text-green-600">+12% from last period</div>
          </CardContent>
        </Card>
        <Card className="bg-seasalt border border-platinum">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-gray">Admission Offered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-eerie-black">62.4%</div>
            <div className="text-sm text-green-600">+5% from last period</div>
          </CardContent>
        </Card>
        <Card className="bg-seasalt border border-platinum">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-gray">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-eerie-black">42.8%</div>
            <div className="text-sm text-red-600">-2% from last period</div>
          </CardContent>
        </Card>
        <Card className="bg-seasalt border border-platinum">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-gray">Capacity Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-eerie-black">12 days</div>
            <div className="text-sm text-green-600">-3 days from last period</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6">
        <Card className="bg-seasalt border-platinum">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#d2d3d4" />
                  <XAxis dataKey="name" tick={{fill: "#6b6e70"}} />
                  <YAxis tick={{fill: "#6b6e70"}} />
                  <Tooltip />
                  <Legend wrapperStyle={{color: "#6b6e70"}} />
                  <Bar dataKey="value" fill="#474b4f" name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section - Pipeline and Campus Distribution */}
      <Tabs defaultValue="pipeline" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 bg-anti-flash">
          <TabsTrigger value="pipeline" className="text-outer-space data-[state=active]:bg-seasalt">Pipeline</TabsTrigger>
          <TabsTrigger value="campus" className="text-outer-space data-[state=active]:bg-seasalt">Campus Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pipeline" className="mt-4">
          <Card className="bg-seasalt border-platinum">
            <CardHeader>
              <CardTitle className="text-eerie-black">Pipeline Stages</CardTitle>
              <CardDescription className="text-slate-gray">Current admissions pipeline by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={openPipelineData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={130}
                      fill="#474b4f"
                      dataKey="value"
                    >
                      {openPipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{color: "#6b6e70"}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="campus" className="mt-4">
          <Card className="bg-seasalt border-platinum">
            <CardHeader>
              <CardTitle className="text-eerie-black">Campus Distribution</CardTitle>
              <CardDescription className="text-slate-gray">Admissions by campus location</CardDescription>
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
                      label={false}
                      outerRadius={130}
                      fill="#474b4f"
                      dataKey="value"
                    >
                      {campusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{color: "#6b6e70"}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default AdmissionsAnalytics;
