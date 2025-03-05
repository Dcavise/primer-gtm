
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GoogleMapsScriptOptions {
  libraries?: string[];
  mapId?: string;
}

/**
 * Custom hook to load the Google Maps JavaScript API
 */
export function useGoogleMapsScript(options: GoogleMapsScriptOptions = {}) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch the Google Maps API key from Supabase Edge Function
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-api-keys', {
          body: { key: 'maps_platform_api' }
        });
        
        if (error) {
          console.error('Error fetching Google Maps API key:', error);
          setError('Failed to load map API key');
          toast.error('Map loading error', {
            description: 'Could not retrieve the map API key'
          });
          setIsLoading(false);
          return;
        }
        
        if (!data || !data.key) {
          setError('No API key returned');
          setIsLoading(false);
          return;
        }
        
        setApiKey(data.key);
      } catch (error) {
        console.error('Error in fetchApiKey:', error);
        setError('Failed to load map API key');
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, []);
  
  // Load the Google Maps JS API
  useEffect(() => {
    if (!apiKey) return;
    
    // Function to handle script loading
    const loadGoogleMapsScript = () => {
      // Check if the script is already loaded
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setIsLoading(false);
        return;
      }
      
      // Remove any existing script to avoid conflicts
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Build libraries parameter
      const libraries = options.libraries || ['maps', 'marker'];
      
      // Create a new script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=${libraries.join(',')}&v=beta`;
      script.async = true;
      script.defer = true;
      
      // Create a global callback function for the script
      window.initMap = () => {
        setIsLoaded(true);
        setIsLoading(false);
      };
      
      // Handle errors
      script.onerror = () => {
        console.error('Failed to load Google Maps JavaScript API');
        setError('Failed to load map');
        setIsLoading(false);
      };
      
      // Add the script to the document
      document.head.appendChild(script);
    };
    
    loadGoogleMapsScript();
    
    // Cleanup function
    return () => {
      // Remove the global callback
      if (window.initMap) {
        window.initMap = undefined;
      }
    };
  }, [apiKey, options.libraries]);
  
  return { isLoading, isLoaded, error, apiKey };
}
