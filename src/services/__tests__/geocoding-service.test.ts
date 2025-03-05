
import { geocodeAddress } from '../geocoding-service';
import { geocodeAddress as geocodeAddressUtil } from '@/utils/maps';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/utils/maps', () => ({
  geocodeAddress: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe('geocodeAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return error when no address is provided', async () => {
    const result = await geocodeAddress('');
    
    expect(result).toEqual({
      coordinates: null,
      error: 'No address provided',
      isLoading: false
    });
    expect(geocodeAddressUtil).not.toHaveBeenCalled();
  });

  test('should return coordinates when address is successfully geocoded', async () => {
    const mockCoordinates = { lat: 37.7749, lng: -122.4194 };
    const mockResult = {
      formattedAddress: '123 Test St, San Francisco, CA',
      coordinates: mockCoordinates,
    };
    
    (geocodeAddressUtil as jest.Mock).mockResolvedValue(mockResult);
    
    const result = await geocodeAddress('123 Test St');
    
    expect(result).toEqual({
      coordinates: mockCoordinates,
      error: null,
      isLoading: false
    });
    expect(geocodeAddressUtil).toHaveBeenCalledWith('123 Test St');
  });

  test('should return error when geocoding fails', async () => {
    (geocodeAddressUtil as jest.Mock).mockResolvedValue(null);
    
    const result = await geocodeAddress('invalid address');
    
    expect(result).toEqual({
      coordinates: null,
      error: 'Could not find coordinates for address: invalid address',
      isLoading: false
    });
    expect(geocodeAddressUtil).toHaveBeenCalledWith('invalid address');
  });

  test('should handle exceptions and show toast', async () => {
    const errorMessage = 'Network error';
    (geocodeAddressUtil as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const result = await geocodeAddress('123 Test St');
    
    expect(result).toEqual({
      coordinates: null,
      error: 'Error finding location coordinates',
      isLoading: false
    });
    expect(toast.error).toHaveBeenCalledWith('Map loading error', {
      description: 'Could not determine the location coordinates'
    });
  });
});
