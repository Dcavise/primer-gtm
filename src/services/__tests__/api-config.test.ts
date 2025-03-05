
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiKey } from '@/services/api-config';

// Mock the Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}));

// Import the mocked supabase
import { supabase } from '@/integrations/supabase/client';

describe('API Config Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should retrieve API key using POST method', async () => {
    // Mock successful POST response
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { key: 'test-api-key' },
      error: null
    });
    
    const key = await getApiKey('zoneomics');
    
    // Verify that the function was called with correct parameters
    expect(supabase.functions.invoke).toHaveBeenCalledWith('get-api-keys', {
      body: { key: 'zoneomics' }
    });
    
    // Verify the returned key
    expect(key).toBe('test-api-key');
  });
  
  it('should fall back to GET method if POST fails', async () => {
    // Mock failed POST followed by successful GET
    (supabase.functions.invoke as any)
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'POST method not supported' }
      })
      .mockResolvedValueOnce({
        data: { key: 'test-api-key' },
        error: null
      });
    
    const key = await getApiKey('census');
    
    // Verify that the function was called with POST then GET
    expect(supabase.functions.invoke).toHaveBeenCalledWith('get-api-keys', {
      body: { key: 'census' }
    });
    expect(supabase.functions.invoke).toHaveBeenCalledWith('get-api-keys?key=census', {
      method: 'GET'
    });
    
    // Verify the returned key
    expect(key).toBe('test-api-key');
  });
  
  it('should throw an error if no key is returned', async () => {
    // Mock successful response with no key data
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: { },
      error: null
    });
    
    await expect(getApiKey('google_maps')).rejects.toThrow('No API key returned for google_maps');
  });
  
  it('should throw an error if both POST and GET methods fail', async () => {
    // Mock failures for both POST and GET
    (supabase.functions.invoke as any)
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'POST method error' }
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'GET method error' }
      });
    
    await expect(getApiKey('mapbox')).rejects.toThrow('Error fetching mapbox API key with GET');
  });
});
