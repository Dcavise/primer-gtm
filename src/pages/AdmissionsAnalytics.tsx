import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { GridList, GridListItem } from "../components/ui/grid-list";
import { Button } from "../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useLeadsCreated } from "../hooks/useLeadsCreated";
import { useCampuses } from "../hooks/useCampuses";
import { Skeleton } from "../components/ui/skeleton";

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
  { date: '3/2', leadsCreated: 15, leadsConverted: 6, admissionOffered: 4, closedWon: 2, arrAdded: 3.2 },
  { date: '3/3', leadsCreated: 18, leadsConverted: 8, admissionOffered: 5, closedWon: 3, arrAdded: 4.5 },
  { date: '3/4', leadsCreated: 22, leadsConverted: 10, admissionOffered: 7, closedWon: 4, arrAdded: 6.8 },
  { date: '3/5', leadsCreated: 20, leadsConverted: 9, admissionOffered: 6, closedWon: 3, arrAdded: 5.2 },
  { date: '3/6', leadsCreated: 24, leadsConverted: 12, admissionOffered: 8, closedWon: 5, arrAdded: 7.5 },
  { date: '3/7', leadsCreated: 19, leadsConverted: 8, admissionOffered: 5, closedWon: 2, arrAdded: 4.9 },
];

// Weekly data for metrics charts - using actual week start dates
const weeklyData = [
  { date: '2/7', leadsCreated: 95, leadsConverted: 42, admissionOffered: 28, closedWon: 15, arrAdded: 18.5 },  // 4 weeks ago
  { date: '2/14', leadsCreated: 105, leadsConverted: 48, admissionOffered: 32, closedWon: 18, arrAdded: 22.3 }, // 3 weeks ago
  { date: '2/21', leadsCreated: 112, leadsConverted: 52, admissionOffered: 35, closedWon: 20, arrAdded: 25.8 }, // 2 weeks ago
  { date: '2/28', leadsCreated: 120, leadsConverted: 58, admissionOffered: 38, closedWon: 22, arrAdded: 28.6 }, // 1 week ago
  { date: '3/7', leadsCreated: 115, leadsConverted: 55, admissionOffered: 36, closedWon: 21, arrAdded: 27.2 },  // current week
];

// Monthly data for metrics charts - using first day of the month
const monthlyData = [
  { date: '11/1', leadsCreated: 380, leadsConverted: 175, admissionOffered: 120, closedWon: 65, arrAdded: 85.6 },  // 4 months ago
  { date: '12/1', leadsCreated: 420, leadsConverted: 195, admissionOffered: 130, closedWon: 75, arrAdded: 97.5 },  // 3 months ago
  { date: '1/1', leadsCreated: 450, leadsConverted: 210, admissionOffered: 145, closedWon: 82, arrAdded: 105.2 },   // 2 months ago
  { date: '2/1', leadsCreated: 485, leadsConverted: 230, admissionOffered: 155, closedWon: 90, arrAdded: 115.8 },   // 1 month ago
  { date: '3/1', leadsCreated: 320, leadsConverted: 150, admissionOffered: 100, closedWon: 55, arrAdded: 75.5 },   // current month
];

// Trend data for line charts - daily granularity
const dailyTrendData = [
  { date: '3/30', leadsCreated: 15, leadsConverted: 6, admissionOffered: 4, closedWon: 2, arrAdded: 3.1 },
  { date: '3/31', leadsCreated: 18, leadsConverted: 8, admissionOffered: 5, closedWon: 3, arrAdded: 4.2 },
  { date: '4/01', leadsCreated: 22, leadsConverted: 10, admissionOffered: 7, closedWon: 4, arrAdded: 6.5 },
  { date: '4/02', leadsCreated: 20, leadsConverted: 9, admissionOffered: 6, closedWon: 3, arrAdded: 5.8 },
  { date: '4/03', leadsCreated: 24, leadsConverted: 12, admissionOffered: 8, closedWon: 5, arrAdded: 7.9 },
  { date: '4/04', leadsCreated: 19, leadsConverted: 8, admissionOffered: 5, closedWon: 2, arrAdded: 4.8 },
  { date: '4/05', leadsCreated: 17, leadsConverted: 7, admissionOffered: 4, closedWon: 2, arrAdded: 4.2 },
];

// Trend data for line charts - weekly granularity
const weeklyTrendData = [
  { date: 'Week 12', leadsCreated: 85, leadsConverted: 38, admissionOffered: 25, closedWon: 14, arrAdded: 17.2 },
  { date: 'Week 13', leadsCreated: 95, leadsConverted: 42, admissionOffered: 28, closedWon: 15, arrAdded: 19.5 },
  { date: 'Week 14', leadsCreated: 105, leadsConverted: 48, admissionOffered: 32, closedWon: 18, arrAdded: 22.8 },
  { date: 'Week 15', leadsCreated: 112, leadsConverted: 52, admissionOffered: 35, closedWon: 20, arrAdded: 25.2 },
  { date: 'Week 16', leadsCreated: 120, leadsConverted: 58, admissionOffered: 38, closedWon: 22, arrAdded: 28.6 },
  { date: 'Week 17', leadsCreated: 115, leadsConverted: 55, admissionOffered: 36, closedWon: 21, arrAdded: 27.1 },
];

// Trend data for line charts - monthly granularity
const monthlyTrendData = [
  { date: 'Nov', leadsCreated: 320, leadsConverted: 150, admissionOffered: 100, closedWon: 55, arrAdded: 72.5 },
  { date: 'Dec', leadsCreated: 350, leadsConverted: 165, admissionOffered: 110, closedWon: 60, arrAdded: 79.8 },
  { date: 'Jan', leadsCreated: 380, leadsConverted: 175, admissionOffered: 120, closedWon: 65, arrAdded: 85.4 },
  { date: 'Feb', leadsCreated: 420, leadsConverted: 195, admissionOffered: 130, closedWon: 75, arrAdded: 97.2 },
  { date: 'Mar', leadsCreated: 450, leadsConverted: 210, admissionOffered: 145, closedWon: 82, arrAdded: 106.5 },
  { date: 'Apr', leadsCreated: 485, leadsConverted: 230, admissionOffered: 155, closedWon: 90, arrAdded: 118.9 },
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
  {
    id: 'arr-added',
    name: 'ARR Added',
    weekToDate: { value: 27.2, change: +3.8 },
    last7Days: { value: 12.5, change: +6.2 },
    last28Days: { value: 105.8, change: +8.3 },
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
  // Convert string-based dateTruncation to hook's period type
  const [dateTruncation, setDateTruncation] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');

  // Map dateTruncation to period type for hook
  const periodType = dateTruncation === 'daily' ? 'day' : 
                     dateTruncation === 'weekly' ? 'week' : 'month';
  
  // Default lookback units based on period
  const lookbackUnits = dateTruncation === 'daily' ? 30 : 
                        dateTruncation === 'weekly' ? 12 : 6;
  
  // Fetch campus data for mapping between campus names and IDs
  const { campuses, isLoading: loadingCampuses } = useCampuses();
  
  // For this simplified approach, the campus name IS the ID for filtering
  const selectedCampusId = useMemo(() => {
    // If 'all' is selected, return null to show all campuses
    if (selectedCampus === 'all' || loadingCampuses) {
      return null;
    }
    
    // Check if we have any potential case or whitespace issues
    const normalizedName = selectedCampus.trim();
    
    // No special case handling for any specific campus
    // All campus names must exactly match the preferred_campus_c field value
    
    console.log(`Normalizing campus name: "${selectedCampus}" -> "${normalizedName}"`);
    console.log(`🔍 This must match EXACTLY what's in the database preferred_campus_c field`);
    console.log(`SQL will use: WHERE preferred_campus_c = '${normalizedName}'`);
    
    // The campus name itself is used for filtering in the SQL query
    return normalizedName;
  }, [selectedCampus, loadingCampuses]);
  

  
  // Expanded debugging for campus selection
  useEffect(() => {
    console.log('%c Campus Selection Debug', 'background: #f0f0f0; color: #0000ff; font-size: 12px; font-weight: bold;');
    console.log('Selected Campus Name:', selectedCampus);
    console.log('Campus ID/Name for filtering:', selectedCampusId);
    console.log('All available campuses:', campuses);
    
    // Log raw campus data to check exact naming
    if (campuses.length > 0) {
      console.table(campuses.map(c => ({
        campus_id: c.campus_id,
        campus_name: c.campus_name,
        campus_name_length: c.campus_name.length,
        trimmed_equal: c.campus_name.trim() === c.campus_name,
        has_special_chars: /[^a-zA-Z0-9\s]/.test(c.campus_name)
      })));
    }
  }, [selectedCampusId, selectedCampus, campuses]);
  
  // Fetch leads created data using the hook
  const { 
    data: leadsCreatedData, 
    loading: loadingLeadsCreated, 
    error: leadsCreatedError 
  } = useLeadsCreated({
    period: periodType,
    lookbackUnits,
    campusId: selectedCampusId
  });
  
  // Additional debug info for active campus selection
  // Placed after variable declarations to avoid lint errors
  useEffect(() => {
    // Only run this when data loads
    if (!loadingLeadsCreated && leadsCreatedData) {
      console.log('%c 📊 LOADED DATA CAMPUSES INSPECTION', 'background: #e0ffe0; color: #006600; font-weight: bold');
      console.log('- Selected campus for filtering:', selectedCampusId);
      console.log('- Available campuses in result data:', leadsCreatedData.campuses);
      
      // Check if our selected campus appears in the result data
      if (selectedCampusId && !leadsCreatedData.campuses.includes(selectedCampusId)) {
        console.warn(`⚠️ Selected campus "${selectedCampusId}" not found in results!`);
        console.log('This suggests a name mismatch between UI and database');
        
        // Try to find similar campus names for debugging
        const similarCampuses = leadsCreatedData.campuses.filter(c => 
          c.toLowerCase().includes(selectedCampusId.toLowerCase().substring(0, 4)) ||
          selectedCampusId.toLowerCase().includes(c.toLowerCase().substring(0, 4))
        );
        
        if (similarCampuses.length > 0) {
          console.log('Possible matches found:', similarCampuses);
        }
      }
    }
  }, [loadingLeadsCreated, leadsCreatedData, selectedCampusId]);
  
  // Debug campus selection and track changes to help identify navigation issues
  console.log('%c 🏫 CAMPUS SELECTION INFO', 'background: #f0f0ff; color: #0000aa; font-weight: bold');
  console.log('- UI Selection:', selectedCampus);
  console.log('- Filter Parameter:', selectedCampusId); 
  console.log('- Using "all campuses"?', selectedCampus === 'all');
  
  // Use useEffect to track state changes without triggering navigation
  useEffect(() => {
    console.log('Campus selection changed:', selectedCampus);
    // You can add additional logic here if needed
  }, [selectedCampus]);

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
      {/* Dashboard header with improved design */}
      <Card className="mb-8 border border-platinum bg-seasalt overflow-hidden rounded-lg shadow-sm">
        <div className="px-0">

          
          <div className="flex flex-wrap items-center justify-between p-5 bg-seasalt">
            {/* Campus Selection using GridList within a Popover - Extended Width */}
            <div className="w-full md:w-1/3 mb-3 md:mb-0 md:mr-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full border border-platinum rounded-md px-4 py-2 shadow-sm hover:border-french-gray focus:outline-none bg-white justify-between"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span>
                        {loadingLeadsCreated || loadingCampuses ? (
                          <Skeleton className="h-5 w-24" />
                        ) : (
                          selectedCampus === 'all'
                            ? 'All Campuses'
                            : selectedCampus
                        )}
                      </span>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4 shrink-0 opacity-50">
                      <path d="M4.93179 5.43179C4.75605 5.60753 4.75605 5.89245 4.93179 6.06819C5.10753 6.24392 5.39245 6.24392 5.56819 6.06819L7.49999 4.13638L9.43179 6.06819C9.60753 6.24392 9.89245 6.24392 10.0682 6.06819C10.2439 5.89245 10.2439 5.60753 10.0682 5.43179L7.81819 3.18179C7.73379 3.0974 7.61933 3.04999 7.49999 3.04999C7.38064 3.04999 7.26618 3.0974 7.18179 3.18179L4.93179 5.43179ZM10.0682 9.56819C10.2439 9.39245 10.2439 9.10753 10.0682 8.93179C9.89245 8.75606 9.60753 8.75606 9.43179 8.93179L7.49999 10.8636L5.56819 8.93179C5.39245 8.75606 5.10753 8.75606 4.93179 8.93179C4.75605 9.10753 4.75605 9.39245 4.93179 9.56819L7.18179 11.8182C7.26618 11.9026 7.38064 11.95 7.49999 11.95C7.61933 11.95 7.73379 11.9026 7.81819 11.8182L10.0682 9.56819Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]" align="start">
                  {loadingLeadsCreated ? (
                    <div className="p-4">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                     <div className="p-1 overflow-auto max-h-[300px]">
                      {/* Simple list of campuses without GridList */}
                      <div 
                        className={`p-2 rounded cursor-pointer ${selectedCampus === 'all' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedCampus('all');
                        }}
                      >
                        All Campuses
                      </div>
                      
                      {/* Map through available campuses */}
                      {campuses.map(campus => (
                        <div 
                          key={campus.campus_id}
                          className={`p-2 rounded cursor-pointer ${selectedCampus === campus.campus_name ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Log exact campus name to check for whitespace/special chars
                          console.log(`Setting campus name to: "${campus.campus_name}", length: ${campus.campus_name.length}`);
                          setSelectedCampus(campus.campus_name);
                          }}
                        >
                          {campus.campus_name}
                        </div>
                      ))}
                      
                      {/* Debug campus data */}
                      <div className="px-2 py-1 text-xs text-slate-400 border-t mt-2">
                        Selected: {selectedCampus}
                      </div>
                      <div className="px-2 py-1 text-xs text-slate-400">
                        Filter parameter: "{selectedCampusId || 'all'}"
                      </div>
                      {leadsCreatedData?.campuses && (
                        <div className="px-2 py-1 text-xs text-slate-400 max-h-[60px] overflow-auto">
                          <span className="font-semibold">DB Names:</span> {leadsCreatedData.campuses.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
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
                  // For "leads-created" use real data if available
                  if (metric.id === 'leads-created' && leadsCreatedData) {
                    // Find the appropriate period data
                    const periodIndex = Math.min(index, leadsCreatedData.periods.length - 1);
                    const periodDate = leadsCreatedData.periods[periodIndex];
                    
                    // Get values from the real data if available
                    const value = periodDate ? leadsCreatedData.totals[periodDate] : 0;
                    const change = periodDate && leadsCreatedData.changes.percentage[periodDate] 
                      ? leadsCreatedData.changes.percentage[periodDate] 
                      : 0;
                    
                    return (
                      <div key={index} className="w-1/6 text-center">
                        {loadingLeadsCreated ? (
                          <Skeleton className="h-8 w-16 mx-auto mb-2" />
                        ) : (
                          <>
                            <div className="font-semibold text-eerie-black">{formatValue(value)}</div>
                            <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${getChangeColor(change)}`}>
                              {formatChange(change)}%
                            </div>
                          </>
                        )}
                      </div>
                    );
                  } else {
                    // For other metrics, continue using the mock data
                    const value = metric.id === 'leads-converted' ? item.leadsConverted :
                                 metric.id === 'admission-offered' ? item.admissionOffered :
                                 metric.id === 'arr-added' ? item.arrAdded : item.closedWon;
                    
                    // Calculate a random change percentage for demonstration purposes
                    const change = (Math.random() * 20) - 10;
                    
                    return (
                      <div key={index} className="w-1/6 text-center">
                        <div className="font-semibold text-eerie-black">{formatValue(value)}</div>
                        <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${getChangeColor(change)}`}>
                          {formatChange(change)}%
                        </div>
                      </div>
                    );
                  }
                })}
                
                <div className="w-1/3 h-16 pl-4">
                  {metric.id === 'leads-created' && leadsCreatedData ? (
                    loadingLeadsCreated ? (
                      <Skeleton className="h-16 w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={leadsCreatedData.timeSeriesData}>
                          <XAxis dataKey="period" hide />
                          <YAxis hide />
                          <Line 
                            type="monotone" 
                            dataKey="total" 
                            stroke="#474b4f" 
                            strokeWidth={2} 
                            dot={false}
                            activeDot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Line 
                          type="monotone" 
                          dataKey={metric.id === 'leads-converted' ? 'leadsConverted' : 
                                 metric.id === 'admission-offered' ? 'admissionOffered' :
                                 metric.id === 'arr-added' ? 'arrAdded' : 'closedWon'} 
                          stroke="#474b4f" 
                          strokeWidth={2} 
                          dot={false}
                          activeDot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
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
            <CardTitle className="text-sm text-slate-gray">Total ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-eerie-black">42.8%</div>
            <div className="text-sm text-red-600">-2% from last period</div>
          </CardContent>
        </Card>
        <Card className="bg-seasalt border border-platinum">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-gray">ARPU</CardTitle>
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



    </div>
  );
};

export default AdmissionsAnalytics;
