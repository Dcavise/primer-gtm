
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSalesforceData } from '../../use-salesforce-data';

// Mock the hooks we import
vi.mock('../../salesforce/useStats', () => ({
  useStats: vi.fn().mockImplementation(() => ({
    stats: { fellowsCount: 10, leadsCount: 20 },
    employmentStatusCounts: [{ status: 'Active', count: 5 }],
    weeklyLeadCounts: [{ week: '2023-01-01', count: 10 }],
    opportunityStageCounts: [{ stage: 'Stage 1', count: 5 }],
    lastRefreshed: new Date(),
    fetchStats: vi.fn()
  }))
}));

vi.mock('../salesforce/useCampuses', () => ({
  useCampuses: vi.fn().mockImplementation(() => ({
    campuses: [
      { id: '1', campus_id: 'c1', campus_name: 'Campus 1' },
      { id: '2', campus_id: 'c2', campus_name: 'Campus 2' }
    ],
    fetchCampuses: vi.fn()
  }))
}));

vi.mock('../salesforce/useSyncSalesforce', () => ({
  useSyncSalesforce: vi.fn().mockImplementation((onSuccess) => ({
    syncLoading: false,
    syncError: null,
    syncStatus: { status: 'idle' },
    syncSalesforceData: vi.fn().mockImplementation(() => {
      onSuccess();
      return Promise.resolve();
    })
  }))
}));

vi.mock('../salesforce/useMetrics', () => ({
  useMetrics: vi.fn().mockImplementation(() => ({
    leadsMetrics: { metrics: [], timeSeriesData: [] },
    opportunityMetrics: { 
      isLoading: false, 
      monthlyTrends: [], 
      salesCycles: [],
      stageProgression: [],
      leadToWinConversion: []
    },
    attendanceMetrics: { metrics: [], timeSeriesData: [] }
  }))
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockReturnValue({
      data: [{ count: 1 }],
      error: null
    }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue({
        data: [{ id: 1 }],
        error: null
      })
    })
  }
}));

describe('useSalesforceData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return data from sub-hooks', async () => {
    const { result } = renderHook(() => useSalesforceData([]));
    
    await waitFor(() => {
      expect(result.current.stats).toEqual({ 
        fellowsCount: 10, 
        leadsCount: 20 
      });
      expect(result.current.campuses).toHaveLength(2);
      expect(result.current.databaseConnection).toBe('connected');
    });
  });

  it('should pass selectedCampusIds to useStats', async () => {
    const { useStats } = await import('../../salesforce/useStats');
    
    renderHook(() => useSalesforceData(['campus-1']));
    
    expect(useStats).toHaveBeenCalledWith(['campus-1']);
  });

  it('should check database connection on mount', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    renderHook(() => useSalesforceData([]));
    
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_campuses_with_lead_counts', {});
    });
  });

  it('should set connection status to error if db check fails', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Mock the connection check to fail
    (supabase.rpc as any).mockReturnValueOnce({
      data: null,
      error: new Error('Connection failed')
    });
    
    const { result } = renderHook(() => useSalesforceData([]));
    
    await waitFor(() => {
      expect(result.current.databaseConnection).toBe('error');
    });
  });
});
