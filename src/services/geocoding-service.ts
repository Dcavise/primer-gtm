
import { geocodeAddress as geocodeAddressUtil } from '@/utils/maps';
import { Coordinates } from '@/types';
import { toast } from 'sonner';

interface GeocodeAddressResult {
  coordinates: Coordinates | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Geocodes an address to get coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodeAddressResult> {
  if (!address) {
    return {
      coordinates: null,
      error: 'No address provided',
      isLoading: false
    };
  }
  
  try {
    const result = await geocodeAddressUtil(address);
    
    if (result) {
      return {
        coordinates: result.coordinates,
        error: null,
        isLoading: false
      };
    } else {
      return {
        coordinates: null,
        error: `Could not find coordinates for address: ${address}`,
        isLoading: false
      };
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
    toast.error('Map loading error', {
      description: 'Could not determine the location coordinates'
    });
    return {
      coordinates: null,
      error: 'Error finding location coordinates',
      isLoading: false
    };
  }
}
