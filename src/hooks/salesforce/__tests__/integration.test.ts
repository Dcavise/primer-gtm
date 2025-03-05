
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStats } from '../useStats';
import { mockSupabase } from './setupTests';

// This is an integration test that verifies all hooks work together correctly
describe('useStats integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mocks to return themselves for chaining
    Object.values(mockSupabase).forEach(method => {
      if (typeof method === 'function') {
        (method as any).mockReturnValue(mockSupabase);
      }
    });
    
    // Setup mock implementation for all Supabase calls that returns proper mock data
    // 1. Fellows count
    mockSupabase.or.mockImplementationOnce(() => {
      return mockSupabase;
    });
    
    // Setup the final promise return at the end of the chain
    const mockFellowsData = [
      { fte_employment_status: 'Active', fellow_id: 1 },
      { fte_employment_status: 'Active', fellow_id: 2 },
      { fte_employment_status: 'Open', fellow_id: 3 }
    ];
    
    const mockFellowsPromise = Promise.resolve({
      count: 15,
      data: mockFellowsData,
      error: null
    });
    
    // Replace the implementation of or for the first call
    mockSupabase.or.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockFellowsPromise.then(callback) };
    });
    
    // 2. Leads count
    const mockLeadsPromise = Promise.resolve({
      count: 25,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    // 3. Weekly lead counts
    const mockWeeklyLeadData = [
      { week: '2023-01-01', lead_count: 5 },
      { week: '2023-01-08', lead_count: 7 },
      { week: '2023-01-15', lead_count: 8 },
      { week: '2023-01-22', lead_count: 5 }
    ];
    
    const mockWeeklyPromise = Promise.resolve({
      data: mockWeeklyLeadData,
      error: null
    });
    
    mockSupabase.rpc.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockWeeklyPromise.then(callback) };
    });
    
    // 4. Active opportunities count
    const mockActiveOppsPromise = Promise.resolve({
      count: 10,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockActiveOppsPromise.then(callback) };
    });
    
    // 5. Opportunity stages
    const mockStagesData = [
      { stage: 'Family Interview', opportunity_id: '1' },
      { stage: 'Family Interview', opportunity_id: '2' },
      { stage: 'Awaiting Documents', opportunity_id: '3' }
    ];
    
    const mockStagesPromise = Promise.resolve({
      data: mockStagesData,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockStagesPromise.then(callback) };
    });
    
    // 6. Closed won opportunities count
    const mockClosedWonPromise = Promise.resolve({
      count: 8,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockClosedWonPromise.then(callback) };
    });
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
    // Reset all mocks to return themselves for chaining
    Object.values(mockSupabase).forEach(method => {
      if (typeof method === 'function') {
        (method as any).mockReturnValue(mockSupabase);
      }
    });
    
    // 1. Fellows count - updated data
    const mockFellowsData = [
      { fte_employment_status: 'Active', fellow_id: 4 },
      { fte_employment_status: 'Active', fellow_id: 5 }
    ];
    
    const mockFellowsPromise = Promise.resolve({
      count: 20, // Updated count
      data: mockFellowsData,
      error: null
    });
    
    mockSupabase.or.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockFellowsPromise.then(callback) };
    });
    
    // 2. Leads count - updated
    const mockLeadsPromise = Promise.resolve({
      count: 30,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    // 3. Weekly lead counts - updated
    const mockWeeklyLeadData = [
      { week: '2023-01-01', lead_count: 6 },
      { week: '2023-01-08', lead_count: 8 },
      { week: '2023-01-15', lead_count: 9 },
      { week: '2023-01-22', lead_count: 6 }
    ];
    
    const mockWeeklyPromise = Promise.resolve({
      data: mockWeeklyLeadData,
      error: null
    });
    
    mockSupabase.rpc.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockWeeklyPromise.then(callback) };
    });
    
    // 4. Active opportunities count - updated
    const mockActiveOppsPromise = Promise.resolve({
      count: 12,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockActiveOppsPromise.then(callback) };
    });
    
    // 5. Opportunity stages - updated
    const mockStagesData = [
      { stage: 'Family Interview', opportunity_id: '4' },
      { stage: 'Family Interview', opportunity_id: '5' },
      { stage: 'Awaiting Documents', opportunity_id: '6' }
    ];
    
    const mockStagesPromise = Promise.resolve({
      data: mockStagesData,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockStagesPromise.then(callback) };
    });
    
    // 6. Closed won opportunities count - updated
    const mockClosedWonPromise = Promise.resolve({
      count: 10,
      error: null
    });
    
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockClosedWonPromise.then(callback) };
    });
    
    // Call fetchStats manually
    act(() => {
      result.current.fetchStats();
    });
    
    // Verify fetchFellowsStats was called again
    expect(mockSupabase.from).toHaveBeenCalled();
  });
});
