
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import mapboxgl from 'mapbox-gl';
import { initializeMapboxToken, geocodeAddress } from '../geocoding';
import { getApiKey } from '@/services/api-config';

// Mock API key function
vi.mock('@/services/api-config', () => ({
  getApiKey: vi.fn(),
}));

// Mock mapboxgl
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: null,
    workerUrl: null,
    Map: class {
      constructor(options) {
        this.options = options;
        this.testMode = options.testMode;
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
      addControl() { return this; }
      flyTo() { return this; }
      on(event, callback) {
        if (event === 'load') {
          this.onload = callback;
        }
        return this;
      }
      remove() { }
    },
    NavigationControl: class { },
    AttributionControl: class { },
    Marker: class {
      setLngLat() { return this; }
      setPopup() { return this; }
      addTo() { return this; }
      remove() { }
    },
    Popup: class {
      setText() { return this; }
    },
  }
}));

// Mock fetch for geocoding
global.fetch = vi.fn();

describe('Mapbox Integration', () => {
  beforeAll(() => {
    // Mock console methods to avoid noisy logs during tests
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeMapboxToken', () => {
    it('should set the mapboxgl access token when successful', async () => {
      // Mock the API key return
      const mockToken = 'test-token-123';
      (getApiKey as any).mockResolvedValue(mockToken);

      const result = await initializeMapboxToken();

      expect(result).toBe(true);
      expect(mapboxgl.accessToken).toBe(mockToken);
      expect(mapboxgl.workerUrl).toBe("https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl-csp-worker.js");
    });

    it('should return false when API key retrieval fails', async () => {
      // Mock the API key return
      (getApiKey as any).mockRejectedValue(new Error('API key retrieval failed'));

      const result = await initializeMapboxToken();

      expect(result).toBe(false);
    });
  });

  describe('geocodeAddress', () => {
    it('should return null for empty address', async () => {
      const result = await geocodeAddress('');
      expect(result).toBeNull();
    });

    it('should handle successful geocoding', async () => {
      // Mock successful token initialization
      (getApiKey as any).mockResolvedValue('mock-token');
      mapboxgl.accessToken = 'mock-token';
      
      // Mock successful geocoding response
      const mockGeocodeResponse = {
        features: [{
          place_name: 'San Francisco, CA, USA',
          center: [-122.4194, 37.7749],
          context: [
            { id: 'country.123', text: 'United States' },
            { id: 'region.456', text: 'California' },
            { id: 'place.789', text: 'San Francisco' }
          ],
          place_type: ['place'],
          bbox: [-122.5, 37.7, -122.3, 37.8]
        }]
      };
      
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockGeocodeResponse
      });

      const result = await geocodeAddress('San Francisco');
      
      expect(result).not.toBeNull();
      expect(result?.address).toBe('San Francisco, CA, USA');
      expect(result?.coordinates).toEqual({ lng: -122.4194, lat: 37.7749 });
    });
  });

  describe('Map Testing', () => {
    it('should initialize a map in test mode', () => {
      const container = document.createElement('div');
      const map = new mapboxgl.Map({
        container,
        zoom: 1,
        fadeDuration: 0,
        center: [0, 0],
        testMode: true,
        style: {
          version: 8,
          sources: {},
          layers: []
        }
      });
      
      expect(map.testMode).toBe(true);
    });
  });
});
