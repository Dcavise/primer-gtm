
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useRealEstatePipelineSync from '@/hooks/useRealEstatePipelineSync';
import { toast } from 'sonner';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ last_updated: '2023-01-01T00:00:00Z' }],
            error: null
          }))
        }))
      })),
      count: vi.fn(() => ({
        select: vi.fn(() => ({
          count: 25,
          error: null
        }))
      }))
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn()
        }))
      }))
    })),
    removeChannel: vi.fn()
  }
}));

// Mock the toast notifications
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }
}));

// Import the mocked supabase
import { supabase } from '@/integrations/supabase/client';

describe('useRealEstatePipelineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRealEstatePipelineSync());
    
    expect(result.current.syncStatus).toBe('idle');
    expect(result.current.syncError).toBeNull();
    expect(result.current.isSyncing).toBe(false);
    expect(result.current.pipelineAnalytics).toEqual([]);
  });
  
  it('should fetch last sync status on initialization', () => {
    renderHook(() => useRealEstatePipelineSync());
    
    // Verify that Supabase was queried for last_updated
    expect(supabase.from).toHaveBeenCalledWith('real_estate_pipeline');
  });
  
  it('should set up realtime subscription', () => {
    renderHook(() => useRealEstatePipelineSync());
    
    // Verify that a channel was created and subscribed to
    expect(supabase.channel).toHaveBeenCalledWith('real_estate_pipeline_changes');
  });
  
  it('should handle successful sync', async () => {
    // Mock successful sync response
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { 
        success: true, 
        result: { inserted: 10 }
      },
      error: null
    });
    
    const { result } = renderHook(() => useRealEstatePipelineSync());
    
    await act(async () => {
      await result.current.syncRealEstateData();
    });
    
    // Check that sync status was updated correctly
    expect(result.current.syncStatus).toBe('success');
    expect(result.current.syncError).toBeNull();
    
    // Check that a success toast was displayed
    expect(toast.success).toHaveBeenCalledWith("Successfully synced 10 real estate records");
  });
  
  it('should handle sync errors', async () => {
    // Mock error response
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { message: 'API error' }
    });
    
    const { result } = renderHook(() => useRealEstatePipelineSync());
    
    await act(async () => {
      await result.current.syncRealEstateData();
    });
    
    // Check that sync status was updated correctly
    expect(result.current.syncStatus).toBe('error');
    expect(result.current.syncError).toBe('API error');
    
    // Check that an error toast was displayed
    expect(toast.error).toHaveBeenCalledWith("Sync failed: API error");
  });
  
  it('should handle unexpected errors', async () => {
    // Mock unexpected error
    (supabase.functions.invoke as any).mockRejectedValue(new Error('Network failure'));
    
    const { result } = renderHook(() => useRealEstatePipelineSync());
    
    await act(async () => {
      await result.current.syncRealEstateData();
    });
    
    // Check that sync status was updated correctly
    expect(result.current.syncStatus).toBe('error');
    expect(result.current.syncError).toBe('Network failure');
    
    // Check that an error toast was displayed
    expect(toast.error).toHaveBeenCalledWith("Sync error: Network failure");
  });
  
  it('should clean up subscription on unmount', () => {
    const { unmount } = renderHook(() => useRealEstatePipelineSync());
    
    unmount();
    
    // Verify that the channel was removed on unmount
    expect(supabase.removeChannel).toHaveBeenCalled();
  });
});
