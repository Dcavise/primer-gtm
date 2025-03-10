/**
 * Common types for the salesforce feature
 */

// Campus type
export interface Campus {
  id?: string;
  campus_id: string;
  campus_name: string;
  created_at?: string;
  updated_at?: string;
}

// Lead statistics type
export interface LeadStats {
  totalLeads: number;
  openLeads: number;
  convertedLeads: number;
  byCampus: Record<string, number>;
  bySource: Record<string, number>;
}

// Weekly lead data type
export interface WeeklyLeadData {
  week: string;
  count: number;
}

// Opportunity data type
export interface OpportunityData {
  stage_name: string;
  count: number;
}

// Period type for metrics
export type PeriodType = 'day' | 'week' | 'month';

// Export types for reuse
export * from './hooks/types';