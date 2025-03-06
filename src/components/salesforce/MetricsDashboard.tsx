
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { LeadsMetricsData, OpportunityMetricsData, AttendanceMetricsData } from '@/hooks/salesforce/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { TrendIndicator } from './TrendIndicator';

interface MetricsDashboardProps {
  leadsMetrics: LeadsMetricsData;
  opportunityMetrics: OpportunityMetricsData;
  attendanceMetrics: AttendanceMetricsData;
  selectedCampusName: string | null;
  selectedCampusId: string | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  selectedCampusName,
  selectedCampusId
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOverWeekData, setWeekOverWeekData] = useState<any[]>([]);
  const [closedWonData, setClosedWonData] = useState<any[]>([]);
  
  // Chart colors based on the design system
  const chartColors = {
    leads: "#1F77B4",
    conversions: "#FF7F0E",
    wonOpportunities: "#2CA02C",
    lostOpportunities: "#D62728"
  };
  
  useEffect(() => {
    const fetchMetricsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch week-over-week comparison data
        const { data: wowData, error: wowError } = await supabase
          .rpc('get_week_over_week_comparison', { 
            p_campus_id: selectedCampusId 
          });
          
        if (wowError) throw wowError;
        
        // Fetch closed won by campus data
        const { data: closedWonByData, error: closedWonError } = await supabase
          .rpc('get_closed_won_by_campus');
          
        if (closedWonError) throw closedWonError;
        
        // Filter closed won data if campus is selected
        let filteredClosedWonData = closedWonByData;
        if (selectedCampusId && selectedCampusName) {
          filteredClosedWonData = closedWonByData.filter((item: any) => 
            item.campus_name === selectedCampusName
          );
        }
        
        // Sort by win rate and limit to top 5
        filteredClosedWonData = filteredClosedWonData
          .sort((a: any, b: any) => b.win_rate - a.win_rate)
          .slice(0, 5);
        
        setWeekOverWeekData(wowData);
        setClosedWonData(filteredClosedWonData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching metrics data:', err);
        setError('Failed to load metrics data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchMetricsData();
  }, [selectedCampusId, selectedCampusName]);
  
  const renderWeekOverWeekMetrics = () => {
    if (weekOverWeekData.length === 0) {
      return <div className="text-center text-gray-500 p-4">No weekly comparison data available</div>;
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {weekOverWeekData.map((metric, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
            <h4 className="text-sm font-medium text-gray-600">{metric.metric}</h4>
            <div className="mt-2 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-semibold">{metric.current_week}</span>
                <span className="ml-2 text-sm text-gray-500">Current Week</span>
              </div>
              <div className="flex items-center">
                <TrendIndicator 
                  value={metric.change_percentage} 
                  showValue={true} 
                  hideIcon={false} 
                />
              </div>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Previous: {metric.previous_week || 0}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderWinRateChart = () => {
    if (closedWonData.length === 0) {
      return <div className="text-center text-gray-500 p-4">No win rate data available</div>;
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-3">Win Rate by Campus</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={closedWonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="campus_name" />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, 'Win Rate']}
              labelFormatter={(label) => `Campus: ${label}`}
            />
            <Bar dataKey="win_rate" fill={chartColors.wonOpportunities} name="Win Rate" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (error) {
    return (
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">
            Performance Metrics {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">
          Performance Metrics {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Week-over-Week Comparison</h3>
              {renderWeekOverWeekMetrics()}
            </div>
            {renderWinRateChart()}
          </>
        )}
      </CardContent>
    </Card>
  );
};
