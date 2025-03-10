import React, { useState, useMemo } from 'react';
// Import individual UI components
import { Card } from "../components/ui/card";
import { CardContent } from "../components/ui/card";
import { CardHeader } from "../components/ui/card";
import { CardTitle } from "../components/ui/card";
import { CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Popover } from "../components/ui/popover";
import { PopoverContent } from "../components/ui/popover";
import { PopoverTrigger } from "../components/ui/popover";
import { Skeleton } from "../components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useCampuses } from "../hooks/useCampuses";
import { useFormattedLeadsMetrics } from "../hooks/useFormattedLeadsMetrics";
import { LoadingState } from "../components/LoadingState";
import ErrorState from "../components/ErrorState";

// Sample open pipeline data for UI demonstration
const openPipelineData = [
  { name: 'Family Interview', value: 85, fill: '#474b4f' },
  { name: 'Awaiting Documents', value: 65, fill: '#6b6e70' },
  { name: 'Admission Offered', value: 45, fill: '#86888a' },
  { name: 'Closed Won', value: 30, fill: '#a9aaab' },
];

// Sample metrics data for non-lead metrics
const admissionsMetrics = [
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

const AdmissionsAnalytics = () => {
  // State for period selection
  const [periodType, setPeriodType] = useState<'day' | 'week' | 'month'>('week');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  
  // Default lookback units based on period
  const lookbackUnits = periodType === 'day' ? 30 : 
                       periodType === 'week' ? 12 : 6;
  
  // Fetch campus data for dropdown
  const { campuses, isLoading: loadingCampuses } = useCampuses();
  
  // For filtering by campus, we use the campus name itself
  const campusFilter = useMemo(() => {
    if (selectedCampus === 'all' || loadingCampuses) {
      return null;
    }
    return selectedCampus.trim(); // Remove any whitespace
  }, [selectedCampus, loadingCampuses]);
  
  // Fetch leads metrics from the formatted Supabase view
  const { 
    data: metricsData, 
    loading: loadingMetrics, 
    error: metricsError 
  } = useFormattedLeadsMetrics({
    period: periodType,
    lookbackUnits,
    campusId: campusFilter
  });
  
  // Helper to format values for display
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
  const getChangeColor = (change: number) => {
    return change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };
  
  // Process data for the column display
  const columnData = useMemo(() => {
    if (!metricsData || loadingMetrics) return [];
    
    // Get up to 5 most recent periods from metricsData.periods
    // The data is already sorted most recent first from the SQL query
    const recentPeriods = [...metricsData.periods].slice(0, 5);
    
    // Map periods to display format
    return recentPeriods.map((period, index) => {
      // Find the formatted date for this period
      const periodItem = metricsData.timeSeriesData.find(item => item.period === period);
      let displayDate = periodItem?.formatted_date || '';
      
      // For the most recent period, use a special label
      if (index === 0) {
        if (periodType === 'day') displayDate = 'Today';
        else if (periodType === 'week') displayDate = 'Week to Date';
        else if (periodType === 'month') displayDate = 'Month to Date';
      }
      
      return {
        period,
        date: displayDate,
        leadsCreated: metricsData.totals[period] || 0,
        percentChange: metricsData.changes.percentage[period] || 0
      };
    }); // Keep original SQL order (most recent first, left-to-right)
  }, [metricsData, loadingMetrics, periodType]);

  // If there's an error, show error state
  if (metricsError) {
    return <ErrorState message="Failed to load admissions data" error={metricsError} />;
  }
  
  return (
    <div className="container mx-auto py-6 px-8 max-w-7xl bg-seasalt">
      {/* Dashboard header */}
      <Card className="mb-8 border border-platinum bg-seasalt overflow-hidden rounded-lg shadow-sm">
        <div className="px-0">
          <div className="flex flex-wrap items-center justify-between p-5 bg-seasalt">
            {/* Campus Selection */}
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
                        {loadingMetrics || loadingCampuses ? (
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
                  {loadingMetrics ? (
                    <div className="p-4">
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full mb-2" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ) : (
                    <div className="p-1 overflow-auto max-h-[300px]">
                      {/* All Campuses option */}
                      <div 
                        className={`p-2 rounded cursor-pointer ${selectedCampus === 'all' ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                        onClick={() => setSelectedCampus('all')}
                      >
                        All Campuses
                      </div>
                      
                      {/* Campus list */}
                      {campuses.map(campus => (
                        <div 
                          key={campus.campus_id}
                          className={`p-2 rounded cursor-pointer ${selectedCampus === campus.campus_name ? 'bg-slate-100 font-medium' : 'hover:bg-slate-50'}`}
                          onClick={() => setSelectedCampus(campus.campus_name)}
                        >
                          {campus.campus_name}
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Period Type Selection */}
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-2 rounded-md ${periodType === 'day' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={periodType === 'day' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setPeriodType('day')}
              >
                Daily
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${periodType === 'week' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={periodType === 'week' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setPeriodType('week')}
              >
                Weekly
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${periodType === 'month' ? 'text-seasalt' : 'bg-seasalt text-outer-space border border-platinum'}`}
                style={periodType === 'month' ? { backgroundColor: '#474b4f' } : {}}
                onClick={() => setPeriodType('month')}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Metrics Table */}
      <div className="mb-8 bg-seasalt rounded-lg border border-platinum shadow-sm">
        {loadingMetrics ? (
          <div className="p-4">
            <LoadingState />
          </div>
        ) : (
          <div className="px-4 py-4">
            {/* Table Header */}
            <div className="flex border-b pb-2 text-sm font-medium text-slate-gray">
              <div className="w-1/6"></div>
              {/* Reverse column data for display to show older periods on the left */}
              {[...columnData].reverse().map((item, index) => (
                <div key={index} className="w-1/6 text-center">
                  {item.date}
                </div>
              ))}
              <div className="w-1/3 pr-2 pl-4 text-center">Trend</div>
            </div>
            
            {/* Table Body */}
            <div className="flex flex-col divide-y">
              {/* Leads Created Row - Always uses real data */}
              <div className="flex py-3 items-center">
                <div className="w-1/6 font-medium text-outer-space">Leads Created</div>
                
                {/* Reverse column data for display to show older periods on the left */}
                {[...columnData].reverse().map((item, index) => (
                  <div key={index} className="w-1/6 text-center">
                    <div className="font-semibold text-eerie-black">{formatValue(item.leadsCreated)}</div>
                    <div className={`mt-1 text-xs px-2 py-0.5 rounded-full inline-block ${getChangeColor(item.percentChange)}`}>
                      {formatChange(item.percentChange)}%
                    </div>
                  </div>
                ))}
                
                {/* Leads Created Trend */}
                <div className="w-1/3 h-16 pl-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData?.timeSeriesData}>
                      <XAxis dataKey="formatted_date" hide />
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
                </div>
              </div>
              
              {/* Other Metrics Rows - Using sample data */}
              {admissionsMetrics.map((metric) => (
                <div key={metric.id} className="flex py-3 items-center">
                  <div className="w-1/6 font-medium text-outer-space">{metric.name}</div>
                  
                  {/* Generate mock data cells based on period type - reversed for display */}
                  {[...columnData].reverse().map((_, index) => {
                    // Generate a random value and change for demonstration
                    const value = metric.id === 'leads-converted' ? 
                      Math.floor(Math.random() * 30) + 10 :
                      metric.id === 'admission-offered' ? 
                        Math.floor(Math.random() * 20) + 5 :
                        metric.id === 'arr-added' ? 
                          Math.floor(Math.random() * 50) + 20 : 
                          Math.floor(Math.random() * 15) + 5;
                    
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
                  
                  {/* Trend Line Chart */}
                  <div className="w-1/3 h-16 pl-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsData?.timeSeriesData}>
                        <XAxis dataKey="formatted_date" hide />
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* Pipeline Chart */}
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