
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchLeadsStats } from '../useLeadsStats';
import { mockSupabase } from './setupTests';

describe('fetchLeadsStats', () => {
  const mockHandleError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return correct lead count and weekly data when API calls succeed', async () => {
    // Mock leads count response
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 25,
        error: null
      })
    );
    
    // Mock weekly lead counts response
    const mockWeeklyData = [
      { week: '2023-01-01', lead_count: 5 },
      { week: '2023-01-08', lead_count: 7 },
      { week: '2023-01-15', lead_count: 6 },
      { week: '2023-01-22', lead_count: 7 }
    ];
    
    mockSupabase.rpc.mockImplementationOnce(() => 
      Promise.resolve({
        data: mockWeeklyData,
        error: null
      })
    );
    
    const result = await fetchLeadsStats(null, mockHandleError);
    
    expect(result.leadsCount).toBe(25);
    expect(result.weeklyLeadCounts).toHaveLength(4);
    expect(result.weeklyLeadCounts[0].week).toBe('2023-01-01');
    expect(result.weeklyLeadCounts[0].count).toBe(5);
  });
  
  it('should filter by campus ID when provided', async () => {
    const campusId = 'campus-123';
    
    // Mock with checking for campus filter
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => {
      return Promise.resolve({
        count: 15,
        error: null
      });
    });
    
    // Mock RPC call
    mockSupabase.rpc.mockImplementationOnce(() => {
      return Promise.resolve({
        data: [],
        error: null
      });
    });
    
    const result = await fetchLeadsStats(campusId, mockHandleError);
    
    expect(result.leadsCount).toBe(15);
  });
  
  it('should use fallback method when weekly data RPC fails', async () => {
    // Mock leads count response
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: 25,
        error: null
      })
    );
    
    // Mock RPC error
    mockSupabase.rpc.mockImplementationOnce(() => 
      Promise.resolve({
        data: null,
        error: new Error('RPC error')
      })
    );
    
    // Mock fallback data
    const mockFallbackData = [
      { lead_id: '1', created_date: '2023-01-05T00:00:00Z' },
      { lead_id: '2', created_date: '2023-01-06T00:00:00Z' },
      { lead_id: '3', created_date: '2023-01-15T00:00:00Z' }
    ];
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.gte.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        data: mockFallbackData,
        error: null
      })
    );
    
    const result = await fetchLeadsStats(null, mockHandleError);
    
    expect(result.leadsCount).toBe(25);
    // Fallback method will create some weeks of data
    expect(result.weeklyLeadCounts.length).toBeGreaterThan(0);
  });
  
  it('should handle API errors', async () => {
    const mockError = new Error('API error');
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: null,
        error: mockError
      })
    );
    
    await fetchLeadsStats(null, mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching leads stats');
  });
  
  it('should return empty data on error', async () => {
    const mockError = new Error('API error');
    
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockImplementationOnce(() => 
      Promise.resolve({
        count: null,
        error: mockError
      })
    );
    
    const result = await fetchLeadsStats(null, mockHandleError);
    
    expect(result).toEqual({
      leadsCount: 0,
      weeklyLeadCounts: []
    });
  });
});
