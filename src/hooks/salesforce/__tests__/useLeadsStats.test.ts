
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchLeadsStats } from '../useLeadsStats';
import { mockSupabase } from './setupTests';

describe('fetchLeadsStats', () => {
  const mockHandleError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Ensure all mock methods return the mock object for chaining
    Object.values(mockSupabase).forEach(method => {
      if (typeof method === 'function') {
        (method as any).mockReturnValue(mockSupabase);
      }
    });
  });
  
  it('should return correct lead count and weekly data when API calls succeed', async () => {
    // Mock leads count response
    const mockLeadsPromise = Promise.resolve({
      count: 25,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    // Mock weekly lead counts response
    const mockWeeklyData = [
      { week: '2023-01-01', lead_count: 5 },
      { week: '2023-01-08', lead_count: 7 },
      { week: '2023-01-15', lead_count: 6 },
      { week: '2023-01-22', lead_count: 7 }
    ];
    
    const mockWeeklyPromise = Promise.resolve({
      data: mockWeeklyData,
      error: null
    });
    
    // Setup the rpc method to return a thenable
    mockSupabase.rpc.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockWeeklyPromise.then(callback) };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    expect(result.leadsCount).toBe(25);
    expect(result.weeklyLeadCounts).toHaveLength(4);
    expect(result.weeklyLeadCounts[0].week).toBe('2023-01-01');
    expect(result.weeklyLeadCounts[0].count).toBe(5);
  });
  
  it('should filter by campus ID when provided', async () => {
    const campusIds = ['campus-123'];
    
    // Mock leads count response
    const mockLeadsPromise = Promise.resolve({
      count: 15,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    // Mock RPC call
    const mockWeeklyPromise = Promise.resolve({
      data: [],
      error: null
    });
    
    // Setup the rpc method to return a thenable
    mockSupabase.rpc.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockWeeklyPromise.then(callback) };
    });
    
    const result = await fetchLeadsStats(campusIds, mockHandleError);
    
    expect(result.leadsCount).toBe(15);
  });
  
  it('should use fallback method when weekly data RPC fails', async () => {
    // Mock leads count response
    const mockLeadsPromise = Promise.resolve({
      count: 25,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    // Mock RPC error
    const mockRpcPromise = Promise.resolve({
      data: null,
      error: new Error('RPC error')
    });
    
    // Setup the rpc method to return a thenable
    mockSupabase.rpc.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockRpcPromise.then(callback) };
    });
    
    // Mock fallback data
    const mockFallbackData = [
      { lead_id: '1', created_date: '2023-01-05T00:00:00Z' },
      { lead_id: '2', created_date: '2023-01-06T00:00:00Z' },
      { lead_id: '3', created_date: '2023-01-15T00:00:00Z' }
    ];
    
    const mockFallbackPromise = Promise.resolve({
      data: mockFallbackData,
      error: null
    });
    
    // Setup another eq method after gte for the fallback
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockFallbackPromise.then(callback) };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    expect(result.leadsCount).toBe(25);
    // Fallback method will create some weeks of data
    expect(result.weeklyLeadCounts.length).toBeGreaterThan(0);
  });
  
  it('should handle API errors', async () => {
    const mockError = new Error('API error');
    
    // Setup error response for leads count
    const mockLeadsPromise = Promise.resolve({
      count: null,
      error: mockError
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    await fetchLeadsStats([], mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching leads stats');
  });
  
  it('should return empty data on error', async () => {
    const mockError = new Error('API error');
    
    // Setup error response for leads count
    const mockLeadsPromise = Promise.resolve({
      count: null,
      error: mockError
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockLeadsPromise.then(callback) };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    expect(result).toEqual({
      leadsCount: 0,
      weeklyLeadCounts: []
    });
  });
});
