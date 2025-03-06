
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SummaryStats, EmploymentStatusCount, WeeklyLeadCount, OpportunityStageCount } from '@/hooks/salesforce/types';
import { Campus } from '@/hooks/salesforce/types';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface StatsCardGridProps {
  stats: SummaryStats;
  employmentStatusCounts: EmploymentStatusCount[];
  weeklyLeadCounts: WeeklyLeadCount[];
  opportunityStageCounts: OpportunityStageCount[];
  selectedCampusId: string | null;
  selectedCampusName: string | null;
  campuses?: Campus[];
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = ({ 
  selectedCampusId,
  selectedCampusName
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyLeadData, setWeeklyLeadData] = useState<any[]>([]);
  const [opportunityData, setOpportunityData] = useState<any[]>([]);

  // Define chart colors
  const leadColors = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728"];
  const opportunityColors = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD"];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch weekly lead counts
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 28); // 4 weeks ago
        
        const { data: weeklyData, error: weeklyError } = await supabase
          .rpc('get_weekly_lead_counts', { 
            start_date: startDate.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            campus_filter: selectedCampusId
          });
          
        if (weeklyError) throw weeklyError;
        
        // Fetch opportunity stage counts
        const { data: oppData, error: oppError } = await supabase
          .rpc('get_opportunities_by_stage_campus');
          
        if (oppError) throw oppError;
        
        // Process weekly data for chart display
        const formattedWeeklyData = weeklyData.map((item: any) => ({
          week: new Date(item.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: item.lead_count
        }));
        
        // Process opportunity data - filter by campus if selected
        let processedOppData = oppData;
        if (selectedCampusId) {
          processedOppData = oppData.filter((item: any) => 
            item.campus_name === selectedCampusName
          );
        }
        
        // Group by stage and sum counts if we're showing all campuses
        if (!selectedCampusId) {
          const stageGroups: Record<string, number> = {};
          processedOppData.forEach((item: any) => {
            stageGroups[item.stage_name] = (stageGroups[item.stage_name] || 0) + Number(item.count);
          });
          
          processedOppData = Object.entries(stageGroups).map(([stage_name, count]) => ({
            stage_name,
            count
          }));
        }
        
        // Limit to top 5 stages if more
        processedOppData = processedOppData
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);
        
        setWeeklyLeadData(formattedWeeklyData);
        setOpportunityData(processedOppData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCampusId, selectedCampusName]);

  const renderWeeklyLeadChart = () => {
    if (weeklyLeadData.length === 0) {
      return <div className="text-center text-gray-500 p-4">No lead data available for the selected period</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weeklyLeadData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [`${value} leads`, 'Count']}
            labelFormatter={(label) => `Week of ${label}`}
          />
          <Bar dataKey="count" fill="#1F77B4" name="Leads">
            {weeklyLeadData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={leadColors[index % leadColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  const renderOpportunityChart = () => {
    if (opportunityData.length === 0) {
      return <div className="text-center text-gray-500 p-4">No opportunity data available</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={opportunityData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="stage_name" width={120} />
          <Tooltip 
            formatter={(value: number) => [`${value} opportunities`, 'Count']}
          />
          <Bar dataKey="count" fill="#1F77B4" name="Opportunities">
            {opportunityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={opportunityColors[index % opportunityColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (error) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6 mt-2">
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
    <Card className="mb-8">
      <CardContent className="p-6 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-lg font-medium mb-4">Weekly Lead Trends</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              renderWeeklyLeadChart()
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <h3 className="text-lg font-medium mb-4">Opportunities by Stage</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-[250px] w-full" />
              </div>
            ) : (
              renderOpportunityChart()
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
