
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

export interface Campus extends BaseCampus {
  campus_id: string;
  campus_name: string;
}

export interface SyncStatus {
  leads: 'idle' | 'loading' | 'success' | 'error';
  opportunities: 'idle' | 'loading' | 'success' | 'error';
  fellows: 'idle' | 'loading' | 'success' | 'error';
}
