
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  LeadsMetricsData,
  OpportunityMetricsData,
  AttendanceMetricsData,
  MonthlyOpportunityTrend,
  SalesCycleMetric,
  StageProgressionMetric,
  LeadToWinConversion
} from './types';

export const useMetrics = (selectedCampusId: string | null) => {
  const [leadsMetrics, setLeadsMetrics] = useState<LeadsMetricsData>({
    isLoading: true,
    conversionRate: 0,
    totalLeads: 0,
    leadsBySource: [],
    leadsByStatus: [],
    monthlyTrends: []
  });
  
  const [opportunityMetrics, setOpportunityMetrics] = useState<OpportunityMetricsData>({
    isLoading: true,
    monthlyTrends: [],
    salesCycles: [],
    stageProgression: [],
    leadToWinConversion: []
  });
  
  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetricsData>({
    isLoading: true,
    averageAttendance: 0,
    attendanceByGrade: [],
    monthlyAttendance: []
  });
  
  const handleError = (error: any, message?: string) => {
    console.error(message || 'Error fetching metrics:', error);
  };
  
  useEffect(() => {
    fetchOpportunityMetrics();
  }, [selectedCampusId]);
  
  const fetchOpportunityMetrics = async () => {
    try {
      setOpportunityMetrics(prev => ({ ...prev, isLoading: true }));
      
      // Define dates for the reports
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 12);
      
      // 1. Get monthly opportunity trends
      const { data: trendData, error: trendError } = await supabase.rpc(
        'get_monthly_opportunity_trends',
        {
          start_date: startDate.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          p_campus_id: selectedCampusId
        }
      );
      
      if (trendError) throw trendError;
      
      // 2. Get sales cycle by campus
      const { data: cycleData, error: cycleError } = await supabase.rpc(
        'get_sales_cycle_by_campus'
      );
      
      if (cycleError) throw cycleError;
      
      // 3. Get stage progression analysis
      const { data: stageData, error: stageError } = await supabase.rpc(
        'get_stage_progression_analysis',
        {
          start_date: startDate.toISOString().split('T')[0],
          end_date: today.toISOString().split('T')[0],
          p_campus_id: selectedCampusId
        }
      );
      
      if (stageError) throw stageError;
      
      // 4. Get lead to win conversion
      const { data: conversionData, error: conversionError } = await supabase.rpc(
        'get_lead_to_win_conversion',
        {
          p_campus_id: selectedCampusId,
          p_months: 12
        }
      );
      
      if (conversionError) throw conversionError;
      
      // Format the data for our components
      const formattedTrends: MonthlyOpportunityTrend[] = trendData.map((item: any) => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        new_opportunities: Number(item.new_opportunities),
        closed_won: Number(item.closed_won),
        closed_lost: Number(item.closed_lost),
        win_rate: Number(item.win_rate),
        average_days_to_close: Number(item.average_days_to_close)
      }));
      
      const formattedCycles: SalesCycleMetric[] = cycleData
        .filter((item: any) => !selectedCampusId || item.campus_name === selectedCampusId)
        .map((item: any) => ({
          campus_name: item.campus_name,
          state: item.state,
          avg_days_to_close: Number(item.avg_days_to_close),
          avg_days_to_win: Number(item.avg_days_to_win),
          avg_days_to_lose: Number(item.avg_days_to_lose)
        }));
      
      const formattedStages: StageProgressionMetric[] = stageData.map((item: any) => ({
        stage_name: item.stage_name,
        opportunity_count: Number(item.opportunity_count),
        conversion_to_next_stage: Number(item.conversion_to_next_stage),
        avg_days_in_stage: Number(item.avg_days_in_stage),
        win_rate_from_stage: Number(item.win_rate_from_stage)
      }));
      
      const formattedConversion: LeadToWinConversion[] = conversionData.map((item: any) => ({
        month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        new_leads: Number(item.new_leads),
        new_opportunities: Number(item.new_opportunities),
        closed_won: Number(item.closed_won),
        lead_to_opp_rate: Number(item.lead_to_opp_rate),
        opp_to_win_rate: Number(item.opp_to_win_rate),
        lead_to_win_rate: Number(item.lead_to_win_rate)
      }));
      
      setOpportunityMetrics({
        isLoading: false,
        monthlyTrends: formattedTrends,
        salesCycles: formattedCycles,
        stageProgression: formattedStages,
        leadToWinConversion: formattedConversion
      });
      
    } catch (error) {
      handleError(error, 'Error fetching opportunity metrics');
      setOpportunityMetrics(prev => ({ 
        ...prev, 
        isLoading: false 
      }));
    }
  };
  
  // Placeholder for fetching leads metrics - to be implemented later
  const fetchLeadsMetrics = async () => {
    // Implementation will be added later
  };
  
  // Placeholder for fetching attendance metrics - to be implemented later
  const fetchAttendanceMetrics = async () => {
    // Implementation will be added later
  };
  
  return {
    leadsMetrics,
    opportunityMetrics,
    attendanceMetrics,
    fetchOpportunityMetrics,
    fetchLeadsMetrics,
    fetchAttendanceMetrics
  };
};
