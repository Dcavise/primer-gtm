
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchLeadsStats } from '../useLeadsStats';
import { mockSupabase } from './setupTests';

describe('fetchLeadsStats', () => {
  const mockHandleError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Add auth property to mockSupabase if it doesn't exist
    if (!mockSupabase.auth) {
      mockSupabase.auth = {
        getSession: vi.fn()
      };
    }
    
    // Ensure all mock methods return the mock object for chaining
    Object.values(mockSupabase).forEach(method => {
      if (typeof method === 'function') {
        (method as any).mockReturnValue(mockSupabase);
      }
    });
  });
  
  it('should return correct lead count and weekly data when API calls succeed', async () => {
    // Mock Auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    // Setup the rpc method to return data for the first attempt
    const mockWeeklyData = [
      { week: '2023-01-01', lead_count: 5 },
      { week: '2023-01-08', lead_count: 7 },
      { week: '2023-01-15', lead_count: 6 },
      { week: '2023-01-22', lead_count: 7 }
    ];
    
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: mockWeeklyData, 
          error: null 
        }))
      };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    expect(result.leadsCount).toBe(25);
    expect(result.weeklyLeadCounts).toHaveLength(4);
    expect(result.weeklyLeadCounts[0].week).toBe('2023-01-01');
    expect(result.weeklyLeadCounts[0].count).toBe(5);
  });
  
  it('should filter by campus ID when provided', async () => {
    const campusIds = ['campus-123'];
    
    // Mock Auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    // Mock RPC call
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: [
            { week: '2023-01-01', lead_count: 3 },
            { week: '2023-01-08', lead_count: 4 },
            { week: '2023-01-15', lead_count: 5 },
            { week: '2023-01-22', lead_count: 3 }
          ], 
          error: null 
        }))
      };
    });
    
    const result = await fetchLeadsStats(campusIds, mockHandleError);
    
    expect(result.leadsCount).toBe(15);
    expect(mockSupabase.rpc).toHaveBeenCalledWith(
      'get_weekly_lead_counts',
      expect.objectContaining({
        campus_filter: 'campus-123'
      })
    );
  });
  
  it('should use fallback method when weekly data RPC fails', async () => {
    // Mock Auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    // Mock RPC error for the first call
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: null, 
          error: new Error('RPC error') 
        }))
      };
    });
    
    // Mock direct query success via second RPC call
    const mockFallbackData = [
      { created_date: '2023-01-05T00:00:00Z' },
      { created_date: '2023-01-06T00:00:00Z' },
      { created_date: '2023-01-15T00:00:00Z' }
    ];
    
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: mockFallbackData, 
          error: null 
        }))
      };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    // The second RPC call should be for query_salesforce_lead
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'query_salesforce_lead', expect.anything());
    
    // Should have weekly data
    expect(result.weeklyLeadCounts.length).toBeGreaterThan(0);
  });
  
  it('should handle API errors', async () => {
    // Mock Auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    const mockError = new Error('API error');
    
    // First RPC call fails
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: null, 
          error: mockError 
        }))
      };
    });
    
    // Second RPC call also fails
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: null, 
          error: new Error('Second API error') 
        }))
      };
    });
    
    await fetchLeadsStats([], mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching leads stats');
  });
  
  it('should return mock data on error', async () => {
    // Mock Auth
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null
    });
    
    const mockError = new Error('API error');
    
    // First RPC call fails
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: null, 
          error: mockError 
        }))
      };
    });
    
    // Second RPC call also fails
    mockSupabase.rpc.mockImplementationOnce(() => {
      return {
        ...mockSupabase,
        then: (callback: any) => Promise.resolve(callback({ 
          data: null, 
          error: new Error('Second API error') 
        }))
      };
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    // Should return mock data with actual values
    expect(result.leadsCount).toBeGreaterThan(0);
    expect(result.weeklyLeadCounts.length).toBe(4);
  });
  
  it('should use mock data when user is not authenticated', async () => {
    // Mock Auth - user is not logged in
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    const result = await fetchLeadsStats([], mockHandleError);
    
    // Should not call RPC
    expect(mockSupabase.rpc).not.toHaveBeenCalled();
    
    // Should return mock data
    expect(result.leadsCount).toBeGreaterThan(0);
    expect(result.weeklyLeadCounts.length).toBe(4);
  });
});
