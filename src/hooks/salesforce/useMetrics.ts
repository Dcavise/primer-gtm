import { useState, useEffect } from 'react';
import { LeadsMetricsData, OpportunityMetricsData, AttendanceMetricsData } from './types';

export const useMetrics = (selectedCampusId: string | null) => {
  const [leadsMetrics, setLeadsMetrics] = useState<LeadsMetricsData>({
    metrics: [],
    timeSeriesData: []
  });
  
  const [opportunityMetrics, setOpportunityMetrics] = useState<OpportunityMetricsData>({
    metrics: [],
    timeSeriesData: []
  });

  const [attendanceMetrics, setAttendanceMetrics] = useState<AttendanceMetricsData>({
    metrics: [
      {
        name: "Absenteeism Rate (10+ absences)",
        currentValue: 12.5,
        weekToDate: { value: 13.2, change: 5.6, positive: false },
        last7Days: { value: 12.8, change: 2.4, positive: false },
        last28Days: { value: 11.9, change: 5.0, positive: true }
      },
      {
        name: "Average Daily Student Attendance",
        currentValue: 94.3,
        weekToDate: { value: 93.8, change: 0.5, positive: true },
        last7Days: { value: 94.1, change: 0.2, positive: true },
        last28Days: { value: 95.2, change: 0.9, positive: false }
      }
    ],
    timeSeriesData: [
      {
        id: "absenteeism_rate",
        name: "Absenteeism Rate",
        data: [
          { date: "2023-07-01", value: 10.2 },
          { date: "2023-07-08", value: 10.8 },
          { date: "2023-07-15", value: 11.3 },
          { date: "2023-07-22", value: 12.1 },
          { date: "2023-07-29", value: 11.7 },
          { date: "2023-08-05", value: 12.5 }
        ]
      },
      {
        id: "average_attendance",
        name: "Avg. Daily Attendance",
        data: [
          { date: "2023-07-01", value: 95.8 },
          { date: "2023-07-08", value: 95.2 },
          { date: "2023-07-15", value: 94.7 },
          { date: "2023-07-22", value: 94.1 },
          { date: "2023-07-29", value: 94.5 },
          { date: "2023-08-05", value: 94.3 }
        ]
      }
    ]
  });

  useEffect(() => {
    // Simulate loading metrics from API
    loadMetrics();
  }, [selectedCampusId]);

  const loadMetrics = () => {
    // In a real implementation, this would fetch from an API
    // For now, we'll generate mock data
    
    // Lead metrics
    const completedTrips: MetricData = {
      name: "New Leads",
      currentValue: 744,
      weekToDate: { value: 744, change: -4.6, positive: false },
      last7Days: { value: 4900, change: -18.6, positive: false },
      last28Days: { value: 20400, change: 46.6, positive: true }
    };
    
    const fareSplitTrips: MetricData = {
      name: "Lead Conversion Rate",
      currentValue: 1.1,
      weekToDate: { value: 1.1, change: 0.2, positive: true },
      last7Days: { value: 1.1, change: 0.1, positive: true },
      last28Days: { value: 1.0, change: -0.3, positive: false }
    };
    
    // Opportunity metrics
    const grossBookings: MetricData = {
      name: "New Opportunities",
      currentValue: 15400,
      weekToDate: { value: 15400, change: -5.9, positive: false },
      last7Days: { value: 105400, change: -22.1, positive: false },
      last28Days: { value: 428900, change: 60.2, positive: true }
    };
    
    const promosExisting: MetricData = {
      name: "Pipeline Conversion Rate",
      currentValue: 15.7,
      weekToDate: { value: 15.7, change: 2.5, positive: true },
      last7Days: { value: 16.2, change: -4.8, positive: false },
      last28Days: { value: 20.5, change: 7.5, positive: true }
    };
    
    const promosNew: MetricData = {
      name: "Admission Rate",
      currentValue: 0,
      weekToDate: { value: 0, change: 0, positive: true },
      last7Days: { value: 3.1, change: -1.6, positive: false },
      last28Days: { value: 3.6, change: 2.1, positive: true }
    };
    
    const inflows: MetricData = {
      name: "Average Days to Decision",
      currentValue: 82.7,
      weekToDate: { value: 82.7, change: -1.1, positive: true },
      last7Days: { value: 80.7, change: 6.4, positive: false },
      last28Days: { value: 75.9, change: -9.6, positive: true }
    };
    
    // Time series data - generate dates for weekly data
    const dates = Array.from({ length: 8 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (7 * (7 - i)));
      return date.toISOString().split('T')[0];
    });
    
    // Leads time series
    const leadsTimeSeries: TimeSeriesData[] = [
      {
        id: 'newLeads',
        name: 'New Leads',
        data: [
          { date: dates[0], value: 580 },
          { date: dates[1], value: 620 },
          { date: dates[2], value: 710 },
          { date: dates[3], value: 680 },
          { date: dates[4], value: 890 },
          { date: dates[5], value: 940 },
          { date: dates[6], value: 880 },
          { date: dates[7], value: 830 }
        ]
      },
      {
        id: 'conversionRate',
        name: 'Conversion Rate (%)',
        data: [
          { date: dates[0], value: 0.8 },
          { date: dates[1], value: 1.2 },
          { date: dates[2], value: 1.0 },
          { date: dates[3], value: 1.1 },
          { date: dates[4], value: 1.0 },
          { date: dates[5], value: 0.9 },
          { date: dates[6], value: 1.1 },
          { date: dates[7], value: 1.2 }
        ]
      }
    ];
    
    // Opportunities time series
    const opportunitiesTimeSeries: TimeSeriesData[] = [
      {
        id: 'newOpportunities',
        name: 'New Opportunities',
        data: [
          { date: dates[0], value: 12400 },
          { date: dates[1], value: 13900 },
          { date: dates[2], value: 14200 },
          { date: dates[3], value: 14100 },
          { date: dates[4], value: 15800 },
          { date: dates[5], value: 17200 },
          { date: dates[6], value: 16100 },
          { date: dates[7], value: 15400 }
        ]
      },
      {
        id: 'pipelineConversion',
        name: 'Pipeline Conversion (%)',
        data: [
          { date: dates[0], value: 14.2 },
          { date: dates[1], value: 13.8 },
          { date: dates[2], value: 13.9 },
          { date: dates[3], value: 15.2 },
          { date: dates[4], value: 18.9 },
          { date: dates[5], value: 17.8 },
          { date: dates[6], value: 16.5 },
          { date: dates[7], value: 15.7 }
        ]
      }
    ];
    
    // Set the state with mock data
    setLeadsMetrics({
      metrics: [completedTrips, fareSplitTrips],
      timeSeriesData: leadsTimeSeries
    });
    
    setOpportunityMetrics({
      metrics: [grossBookings, promosExisting, promosNew, inflows],
      timeSeriesData: opportunitiesTimeSeries
    });
  };

  return { 
    leadsMetrics, 
    opportunityMetrics,
    attendanceMetrics
  };
};
