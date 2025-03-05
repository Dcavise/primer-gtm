
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
  
  // Check if Google Maps is already loaded
  useEffect(() => {
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded");
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }
  }, []);

  // Fetch the Google Maps API key from Supabase Edge Function
  useEffect(() => {
    // Skip if already loaded or already fetching
    if (isLoaded || apiKey) return;
    
    const fetchApiKey = async () => {
      try {
        console.log("Fetching Google Maps API key");
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
          console.error('No API key returned');
          setError('No API key returned');
          setIsLoading(false);
          return;
        }
        
        console.log("API key retrieved successfully");
        setApiKey(data.key);
      } catch (error) {
        console.error('Error in fetchApiKey:', error);
        setError('Failed to load map API key');
        setIsLoading(false);
      }
    };
    
    fetchApiKey();
  }, [isLoaded, apiKey]);
  
  // Load the Google Maps JS API
  useEffect(() => {
    if (!apiKey || isLoaded) return;
    
    // Function to handle script loading
    const loadGoogleMapsScript = () => {
      // Check if the script is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps already loaded (check in load effect)");
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
      
      console.log("Loading Google Maps script with API key");
      
      // Create a new script element
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries.join(',')}&callback=initMap&v=beta`;
      script.async = true;
      script.defer = true;
      
      // Create a global callback function for the script
      window.initMap = () => {
        console.log("Google Maps script loaded via callback");
        setIsLoaded(true);
        setIsLoading(false);
      };
      
      // Handle errors
      script.onerror = (e) => {
        console.error('Failed to load Google Maps JavaScript API', e);
        // Fall back to using a static map if available
        setError('Failed to load map');
        setIsLoading(false);

        // Try loading a simpler version without beta and with fewer libraries
        const fallbackScript = document.createElement('script');
        fallbackScript.id = 'google-maps-script-fallback';
        fallbackScript.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
        fallbackScript.async = true;
        fallbackScript.defer = true;
        
        fallbackScript.onerror = () => {
          console.error('Fallback script also failed to load');
          setError('Failed to load map (all attempts)');
        };
        
        document.head.appendChild(fallbackScript);
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
  }, [apiKey, isLoaded, options.libraries]);
  
  return { isLoading, isLoaded, error, apiKey };
}
