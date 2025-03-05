
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchFellowsStats } from '../useFellowsStats';
import { mockSupabase } from './setupTests';

describe('fetchFellowsStats', () => {
  const mockHandleError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return correct data when API call succeeds', async () => {
    // Mock data
    const mockFellowsData = [
      { id: 1, fellow_name: 'John Doe', fte_employment_status: 'Active' },
      { id: 2, fellow_name: 'Jane Smith', fte_employment_status: 'Active' },
      { id: 3, fellow_name: 'Bob Johnson', fte_employment_status: 'Open' }
    ];
    
    // Setup mock response
    mockSupabase.select.mockReturnThis();
    mockSupabase.not.mockReturnThis();
    mockSupabase.or.mockReturnThis();
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        not: (field, operator, value) => ({
          not: (field, operator, value) => ({
            or: () => Promise.resolve({
              count: 3,
              data: mockFellowsData,
              error: null
            })
          })
        })
      })
    }));
    
    const result = await fetchFellowsStats(null, mockHandleError);
    
    expect(result.fellowsCount).toBe(3);
    expect(result.employmentStatusCounts.length).toBe(2); // Active and Open statuses
    expect(result.employmentStatusCounts[0].status).toBe('Active');
    expect(result.employmentStatusCounts[0].count).toBe(2);
    expect(result.employmentStatusCounts[1].status).toBe('Open');
    expect(result.employmentStatusCounts[1].count).toBe(1);
  });
  
  it('should filter by campus ID when provided', async () => {
    const campusId = 'campus-123';
    
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        not: (field, operator, value) => ({
          not: (field, operator, value) => ({
            or: (filter) => {
              // Verify that the filter contains the campus ID
              expect(filter).toContain(campusId);
              return Promise.resolve({
                count: 2,
                data: [],
                error: null
              });
            }
          })
        })
      })
    }));
    
    const result = await fetchFellowsStats(campusId, mockHandleError);
    
    expect(result.fellowsCount).toBe(2);
  });
  
  it('should handle API error', async () => {
    const mockError = new Error('API error');
    
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        not: (field, operator, value) => ({
          not: (field, operator, value) => ({
            or: () => Promise.resolve({
              count: null,
              data: null,
              error: mockError
            })
          })
        })
      })
    }));
    
    await fetchFellowsStats(null, mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching fellows stats');
  });
  
  it('should return empty data on error', async () => {
    const mockError = new Error('API error');
    
    mockSupabase.from.mockImplementation(() => ({
      select: () => ({
        not: (field, operator, value) => ({
          not: (field, operator, value) => ({
            or: () => Promise.resolve({
              count: null,
              data: null,
              error: mockError
            })
          })
        })
      })
    }));
    
    const result = await fetchFellowsStats(null, mockHandleError);
    
    expect(result).toEqual({
      fellowsCount: 0,
      employmentStatusCounts: []
    });
  });
});
