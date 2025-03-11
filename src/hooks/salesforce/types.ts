import { Campus as BaseCampus } from "@/types";

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
  campus_id?: string;
  campus_name?: string;
}

export interface OpportunityStageCount {
  stage: string;
  count: number;
}

export interface Campus extends BaseCampus {
  campus_id: string;
  campus_name: string;
  State?: string | null; // Add the State property to match Supabase schema
}

export interface SyncStatus {
  leads: "idle" | "loading" | "success" | "error";
  opportunities: "idle" | "loading" | "success" | "error";
  fellows: "idle" | "loading" | "success" | "error";
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
  monthlyTrends: MonthlyOpportunityTrend[];
  salesCycles: SalesCycleMetric[];
  stageProgression: StageProgressionMetric[];
  leadToWinConversion: LeadToWinConversion[];
  isLoading: boolean;
}

export interface AttendanceMetricsData {
  metrics: MetricData[];
  timeSeriesData: TimeSeriesData[];
}

export interface MonthlyOpportunityTrend {
  month: string;
  new_opportunities: number;
  closed_won: number;
  closed_lost: number;
  win_rate: number;
  average_days_to_close: number;
}

export interface SalesCycleMetric {
  campus_name: string;
  state: string;
  avg_days_to_close: number;
  avg_days_to_win: number;
  avg_days_to_lose: number;
}

export interface StageProgressionMetric {
  stage_name: string;
  opportunity_count: number;
  conversion_to_next_stage: number;
  avg_days_in_stage: number;
  win_rate_from_stage: number;
}

export interface LeadToWinConversion {
  month: string;
  new_leads: number;
  new_opportunities: number;
  closed_won: number;
  lead_to_opp_rate: number;
  opp_to_win_rate: number;
  lead_to_win_rate: number;
}
