
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStats } from '../useStats';
import { mockSupabase } from './setupTests';

// This is an integration test that verifies all hooks work together correctly
describe('useStats integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock implementation for all Supabase calls that returns proper mock data
    // We need to create the implementations that return the correct data

    // 1. Fellows count
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.or.mockImplementationOnce(() => 
      Promise.resolve({
        count: 15,
        data: [
          { fte_employment_status: 'Active', fellow_id: 1 },
          { fte_employment_status: 'Active', fellow_id: 2 },
          { fte_employment_status: 'Open', fellow_id: 3 }
        ],
        error: null
      })
    );
    
    // 2. Leads count
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 25,
        error: null
      })
    );
    
    // 3. Weekly lead counts
    mockSupabase.rpc.mockImplementationOnce(() => 
      Promise.resolve({
        data: [
          { week: '2023-01-01', lead_count: 5 },
          { week: '2023-01-08', lead_count: 7 },
          { week: '2023-01-15', lead_count: 8 },
          { week: '2023-01-22', lead_count: 5 }
        ],
        error: null
      })
    );
    
    // 4. Active opportunities count
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 10,
        error: null
      })
    );
    
    // 5. Opportunity stages
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        data: [
          { stage: 'Family Interview', opportunity_id: '1' },
          { stage: 'Family Interview', opportunity_id: '2' },
          { stage: 'Awaiting Documents', opportunity_id: '3' }
        ],
        error: null
      })
    );
    
    // 6. Closed won opportunities count
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 8,
        error: null
      })
    );
  });
  
  it('should integrate all hooks and return combined data', async () => {
    const { result } = renderHook(() => useStats(null));
    
    // Initial state should be empty
    expect(result.current.stats).toEqual({
      fellowsCount: 0,
      leadsCount: 0,
      activeOpportunitiesCount: 0,
      closedWonOpportunitiesCount: 0
    });
    
    // Wait for all fetches to complete
    await waitFor(() => {
      // Verify stats are updated
      expect(result.current.stats).toEqual({
        fellowsCount: 15,
        leadsCount: 25,
        activeOpportunitiesCount: 10,
        closedWonOpportunitiesCount: 8
      });
      
      // Verify other data is populated
      expect(result.current.employmentStatusCounts.length).toBeGreaterThan(0);
      expect(result.current.weeklyLeadCounts.length).toBe(4);
      expect(result.current.opportunityStageCounts.length).toBeGreaterThan(0);
      expect(result.current.lastRefreshed).not.toBeNull();
    });
  });
  
  it('should refresh data when fetchStats is called', async () => {
    const { result } = renderHook(() => useStats(null));
    
    // Wait for initial load
    await waitFor(() => {
      expect(result.current.stats.fellowsCount).toBe(15);
    });
    
    // Reset mocks for the second round of fetches
    vi.clearAllMocks();
    
    // Setup mock implementation for second fetch
    // 1. Fellows count - updated data
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.or.mockImplementationOnce(() => 
      Promise.resolve({
        count: 20, // Updated count
        data: [],
        error: null
      })
    );
    
    // 2. Leads count - updated
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 30,
        error: null
      })
    );
    
    // 3. Weekly lead counts - updated
    mockSupabase.rpc.mockImplementationOnce(() => 
      Promise.resolve({
        data: [
          { week: '2023-01-01', lead_count: 6 },
          { week: '2023-01-08', lead_count: 8 },
          { week: '2023-01-15', lead_count: 9 },
          { week: '2023-01-22', lead_count: 6 }
        ],
        error: null
      })
    );
    
    // 4. Active opportunities count - updated
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 12,
        error: null
      })
    );
    
    // 5. Opportunity stages - updated
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.not.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        data: [
          { stage: 'Family Interview', opportunity_id: '4' },
          { stage: 'Family Interview', opportunity_id: '5' },
          { stage: 'Awaiting Documents', opportunity_id: '6' }
        ],
        error: null
      })
    );
    
    // 6. Closed won opportunities count - updated
    mockSupabase.from.mockImplementationOnce(() => mockSupabase);
    mockSupabase.select.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => mockSupabase);
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 10,
        error: null
      })
    );
    
    // Call fetchStats manually
    act(() => {
      result.current.fetchStats();
    });
    
    // Verify fetchFellowsStats was called again
    expect(mockSupabase.from).toHaveBeenCalled();
  });
});
