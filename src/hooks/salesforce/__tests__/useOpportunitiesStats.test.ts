
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchOpportunitiesStats } from '../useOpportunitiesStats';
import { mockSupabase } from './setupTests';

describe('fetchOpportunitiesStats', () => {
  const mockHandleError = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return correct counts and stages when API calls succeed', async () => {
    // Mock active opportunities count
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: () => Promise.resolve({
            count: 10,
            error: null
          })
        })
      })
    }));
    
    // Mock stage data
    const mockStagesData = [
      { stage: 'Family Interview', opportunity_id: '1' },
      { stage: 'Family Interview', opportunity_id: '2' },
      { stage: 'Awaiting Documents', opportunity_id: '3' },
      { stage: 'Preparing Offer', opportunity_id: '4' }
    ];
    
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: () => Promise.resolve({
            data: mockStagesData,
            error: null
          })
        })
      })
    }));
    
    // Mock closed won opportunities count
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve({
            count: 5,
            error: null
          })
        })
      })
    }));
    
    const result = await fetchOpportunitiesStats(null, mockHandleError);
    
    expect(result.activeOpportunitiesCount).toBe(10);
    expect(result.closedWonOpportunitiesCount).toBe(5);
    expect(result.opportunityStageCounts).toHaveLength(4); // All required stages
    
    // Check stage counts
    expect(result.opportunityStageCounts.find(s => s.stage === 'Family Interview')?.count).toBe(2);
    expect(result.opportunityStageCounts.find(s => s.stage === 'Awaiting Documents')?.count).toBe(1);
    expect(result.opportunityStageCounts.find(s => s.stage === 'Preparing Offer')?.count).toBe(1);
    expect(result.opportunityStageCounts.find(s => s.stage === 'Admission Offered')?.count).toBe(0);
  });
  
  it('should filter by campus ID when provided', async () => {
    const campusId = 'campus-123';
    
    // Check campus filter is passed correctly for active opps
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: (field, value) => {
            expect(field).toBe('campus_id');
            expect(value).toBe(campusId);
            return Promise.resolve({
              count: 5,
              error: null
            });
          }
        })
      })
    }));
    
    // For stages query
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: (field, value) => {
            expect(field).toBe('campus_id');
            expect(value).toBe(campusId);
            return Promise.resolve({
              data: [],
              error: null
            });
          }
        })
      })
    }));
    
    // For closed won count
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          eq: (field, value) => {
            expect(field).toBe('campus_id');
            expect(value).toBe(campusId);
            return Promise.resolve({
              count: 3,
              error: null
            });
          }
        })
      })
    }));
    
    const result = await fetchOpportunitiesStats(campusId, mockHandleError);
    
    expect(result.activeOpportunitiesCount).toBe(5);
    expect(result.closedWonOpportunitiesCount).toBe(3);
  });
  
  it('should handle API errors', async () => {
    const mockError = new Error('API error');
    
    // Error in first query
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: () => Promise.resolve({
            count: null,
            error: mockError
          })
        })
      })
    }));
    
    await fetchOpportunitiesStats(null, mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching opportunities stats');
  });
  
  it('should return empty data on error', async () => {
    const mockError = new Error('API error');
    
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        not: () => ({
          eq: () => Promise.resolve({
            count: null,
            error: mockError
          })
        })
      })
    }));
    
    const result = await fetchOpportunitiesStats(null, mockHandleError);
    
    expect(result).toEqual({
      activeOpportunitiesCount: 0,
      closedWonOpportunitiesCount: 0,
      opportunityStageCounts: []
    });
  });
});
