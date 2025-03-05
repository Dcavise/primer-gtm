
import { Campus as BaseCampus } from '@/types';

export interface SummaryStats {
  fellowsCount: number;
  leadsCount: number;
  activeOpportunitiesCount: number;
  closedWonOpportunitiesCount: number;
}

export interface EmploymentStatusCount {
  status: string;
  count: number;
}

export interface WeeklyLeadCount {
  week: string;
  count: number;
}

export interface OpportunityStageCount {
  stage: string;
  count: number;
}

export interface Campus extends BaseCampus {
  campus_id: string;
  campus_name: string;
}

export interface SyncStatus {
  leads: 'idle' | 'loading' | 'success' | 'error';
  opportunities: 'idle' | 'loading' | 'success' | 'error';
  fellows: 'idle' | 'loading' | 'success' | 'error';
}

export interface MetricChange {
  value: number;
  change: number;
  positive: boolean;
}

export interface MetricData {
  name: string;
  currentValue: number;
  weekToDate: MetricChange;
  last7Days: MetricChange;
  last28Days: MetricChange;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface TimeSeriesData {
  id: string;
  name: string;
  data: TimeSeriesPoint[];
}

export interface LeadsMetricsData {
  metrics: MetricData[];
  timeSeriesData: TimeSeriesData[];
}

export interface OpportunityMetricsData {
  metrics: MetricData[];
  timeSeriesData: TimeSeriesData[];
}

export interface AttendanceMetricsData {
  metrics: MetricData[];
  timeSeriesData: TimeSeriesData[];
}
