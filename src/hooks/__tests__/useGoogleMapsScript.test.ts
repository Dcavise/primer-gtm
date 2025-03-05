
import { renderHook, act } from '@testing-library/react';
import { useGoogleMapsScript } from '../useGoogleMapsScript';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('useGoogleMapsScript', () => {
  let originalDocument: Document;
  let originalWindow: Window & typeof globalThis;
  
  beforeEach(() => {
    // Save original document and window
    originalDocument = global.document;
    originalWindow = global.window;
    
    // Clear mocks
    jest.clearAllMocks();

    // Reset document.head.appendChild mock implementation
    jest.spyOn(document.head, 'appendChild').mockImplementation(jest.fn());
  });

  afterEach(() => {
    // Restore document and window
    global.document = originalDocument;
    global.window = originalWindow;
  });

  test('should fetch API key and load script', async () => {
    // Mock successful API key fetch
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { key: 'test-api-key' },
      error: null,
    });
    
    // Create script element spy
    const appendChildSpy = jest.spyOn(document.head, 'appendChild');
    
    // Render the hook
    const { result } = renderHook(() => useGoogleMapsScript());
    
    // Initial state should show loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // API key should be fetched
    expect(supabase.functions.invoke).toHaveBeenCalledWith('get-api-keys', {
      body: { key: 'maps_platform_api' }
    });
    
    // Script should be added to document
    expect(appendChildSpy).toHaveBeenCalled();
    const scriptElement = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(scriptElement.src).toContain('test-api-key');
    expect(scriptElement.async).toBe(true);
    expect(scriptElement.defer).toBe(true);
    
    // Simulate script loaded callback
    act(() => {
      // Set google maps as loaded
      window.google = { maps: {} } as any;
      // Call the callback
      if (window.initMap) window.initMap();
    });
    
    // Hook should update state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(true);
  });

  test('should handle API key fetch error', async () => {
    // Mock API key fetch error
    const errorMessage = 'Failed to fetch API key';
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: errorMessage },
    });
    
    // Render the hook
    const { result } = renderHook(() => useGoogleMapsScript());
    
    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should show error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe('Failed to load map API key');
    expect(toast.error).toHaveBeenCalledWith('Map loading error', {
      description: 'Could not retrieve the map API key'
    });
  });

  test('should handle script loading error', async () => {
    // Mock successful API key fetch
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { key: 'test-api-key' },
      error: null,
    });
    
    // Create script element spy that simulates error
    jest.spyOn(document.head, 'appendChild').mockImplementation((script: Node) => {
      if (script instanceof HTMLScriptElement && script.onerror) {
        setTimeout(() => script.onerror(new Event('error')), 0);
      }
      return script;
    });
    
    // Render the hook
    const { result } = renderHook(() => useGoogleMapsScript());
    
    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Should show error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe('Failed to load map');
  });

  test('should not reload script if Google Maps is already loaded', async () => {
    // Mock Google Maps already loaded
    window.google = { maps: {} } as any;
    
    // Create script element spy
    const appendChildSpy = jest.spyOn(document.head, 'appendChild');
    
    // Mock successful API key fetch
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { key: 'test-api-key' },
      error: null,
    });
    
    // Render the hook
    const { result } = renderHook(() => useGoogleMapsScript());
    
    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Script should not be added to document since Google Maps is already loaded
    expect(appendChildSpy).not.toHaveBeenCalled();
    
    // Hook should update state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test('should handle no API key returned', async () => {
    // Mock API key fetch with no key
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });
    
    // Render the hook
    const { result } = renderHook(() => useGoogleMapsScript());
    
    // Wait for async operations to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Should show error state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe('No API key returned');
  });
});
