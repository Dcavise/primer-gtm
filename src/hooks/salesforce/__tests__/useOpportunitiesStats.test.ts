
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchOpportunitiesStats } from '../useOpportunitiesStats';
import { mockSupabase } from './setupTests';

describe('fetchOpportunitiesStats', () => {
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
  
  it('should return correct counts and stages when API calls succeed', async () => {
    // Mock active opportunities count
    const mockActiveOppsPromise = Promise.resolve({
      count: 10,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockActiveOppsPromise.then(callback) };
    });
    
    // Mock stage data
    const mockStagesData = [
      { stage: 'Family Interview', opportunity_id: '1' },
      { stage: 'Family Interview', opportunity_id: '2' },
      { stage: 'Awaiting Documents', opportunity_id: '3' },
      { stage: 'Preparing Offer', opportunity_id: '4' }
    ];
    
    const mockStagesPromise = Promise.resolve({
      data: mockStagesData,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockStagesPromise.then(callback) };
    });
    
    // Mock closed won opportunities count
    const mockClosedWonPromise = Promise.resolve({
      count: 5,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockClosedWonPromise.then(callback) };
    });
    
    const result = await fetchOpportunitiesStats([], mockHandleError);
    
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
    const campusIds = ['campus-123'];
    
    // Mock active opportunities count with campus filter
    const mockActiveOppsPromise = Promise.resolve({
      count: 5,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockActiveOppsPromise.then(callback) };
    });
    
    // Mock stage data with campus filter
    const mockStagesPromise = Promise.resolve({
      data: [],
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockStagesPromise.then(callback) };
    });
    
    // Mock closed won opportunities count with campus filter
    const mockClosedWonPromise = Promise.resolve({
      count: 3,
      error: null
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockClosedWonPromise.then(callback) };
    });
    
    const result = await fetchOpportunitiesStats(campusIds, mockHandleError);
    
    expect(result.activeOpportunitiesCount).toBe(5);
    expect(result.closedWonOpportunitiesCount).toBe(3);
  });
  
  it('should handle API errors', async () => {
    const mockError = new Error('API error');
    
    // Error in first query (active opportunities count)
    const mockErrorPromise = Promise.resolve({
      count: null,
      error: mockError
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockErrorPromise.then(callback) };
    });
    
    await fetchOpportunitiesStats([], mockHandleError);
    
    expect(mockHandleError).toHaveBeenCalledWith(mockError, 'Error fetching opportunities stats');
  });
  
  it('should return empty data on error', async () => {
    const mockError = new Error('API error');
    
    // Error in first query (active opportunities count)
    const mockErrorPromise = Promise.resolve({
      count: null,
      error: mockError
    });
    
    // Setup the last method in the chain to return a thenable
    mockSupabase.eq.mockImplementationOnce(() => {
      return { ...mockSupabase, then: (callback: any) => mockErrorPromise.then(callback) };
    });
    
    const result = await fetchOpportunitiesStats([], mockHandleError);
    
    expect(result).toEqual({
      activeOpportunitiesCount: 0,
      closedWonOpportunitiesCount: 0,
      opportunityStageCounts: []
    });
  });
});
