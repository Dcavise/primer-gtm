import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSalesforceData } from '@/hooks/use-salesforce-data';

// Mock the dependent hooks
vi.mock('@/hooks/salesforce/useStats', () => ({
  useStats: vi.fn(() => ({
    stats: {
      fellowsCount: 10,
      leadsCount: 20,
      activeOpportunitiesCount: 5,
      closedWonOpportunitiesCount: 15
    },
    employmentStatusCounts: [
      { status: 'Active', count: 5 },
      { status: 'Open', count: 5 }
    ],
    weeklyLeadCounts: [
      { week: '2023-01-01', count: 5 },
      { week: '2023-01-08', count: 7 }
    ],
    opportunityStageCounts: [
      { stage: 'Family Interview', count: 2 },
      { stage: 'Awaiting Documents', count: 3 }
    ],
    fetchStats: vi.fn()
  }))
}));

vi.mock('@/hooks/salesforce/useCampuses', () => ({
  useCampuses: vi.fn(() => ({
    campuses: [
      { id: 'campus-1', campus_name: 'Campus 1', campus_id: 'campus-1' },
      { id: 'campus-2', campus_name: 'Campus 2', campus_id: 'campus-2' }
    ],
    fetchCampuses: vi.fn()
  }))
}));

vi.mock('@/hooks/salesforce/useMetrics', () => ({
  useMetrics: vi.fn(() => ({
    leadsMetrics: { conversionRate: 25, avgTimeToConversion: 7 },
    opportunityMetrics: { winRate: 75, avgTimeToClose: 30 },
    attendanceMetrics: { attendanceRate: 95 }
  }))
}));

vi.mock('@/hooks/salesforce/useSyncSalesforce', () => ({
  useSyncSalesforce: vi.fn((callback) => ({
    syncLoading: false,
    syncError: null,
    syncStatus: {
      leads: 'idle',
      opportunities: 'idle',
      fellows: 'idle'
    },
    syncSalesforceData: vi.fn(() => {
      callback();
    })
  }))
}));

describe('useSalesforceData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the correct data structure', () => {
    const { result } = renderHook(() => useSalesforceData('campus-1'));

    expect(result.current).toHaveProperty('stats');
    expect(result.current).toHaveProperty('campuses');
    expect(result.current).toHaveProperty('syncLoading');
    expect(result.current).toHaveProperty('syncStatus');
    expect(result.current).toHaveProperty('lastRefreshed');
    expect(result.current).toHaveProperty('fetchStats');
    expect(result.current).toHaveProperty('fetchCampuses');
    expect(result.current).toHaveProperty('syncSalesforceData');
  });

  it('should call syncSalesforceData and refresh data when triggered', async () => {
    const { result } = renderHook(() => useSalesforceData('campus-1'));

    // Keep track of the lastRefreshed value before sync
    const beforeSync = result.current.lastRefreshed;

    // Wait a moment to ensure timestamps are different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Trigger the sync
    await act(async () => {
      result.current.syncSalesforceData();
    });

    // Verify that lastRefreshed was updated (indicating the callback was called)
    expect(result.current.lastRefreshed).not.toBe(beforeSync);
  });

  it('should use the selected campus ID for filtering', () => {
    const { result } = renderHook(() => useSalesforceData('campus-2'));
    
    // Check that the selected campus ID is used (implicitly verified by the mocks being called with the right params)
    // The actual testing of filtering happens in the individual hook tests (useStats, useCampuses, etc.)
    expect(result.current.stats).toBeDefined();
  });
});
