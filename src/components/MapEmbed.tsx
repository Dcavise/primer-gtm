
import React, { useEffect, useState } from 'react';
import { getApiKey } from '@/services/api-config';
import { LoadingState } from './LoadingState';

interface MapEmbedProps {
  address: string;
}

const MapEmbed: React.FC<MapEmbedProps> = ({ address }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getApiKey('google_maps');
        setApiKey(key);
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError('Failed to load map: API key could not be retrieved');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading map..." />;
  }

  if (error || !apiKey) {
    return (
      <div className="bg-muted p-4 rounded-md text-center h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">{error || 'Map could not be loaded'}</p>
      </div>
    );
  }

  // Create the Google Maps embed URL with the address
  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=14`;

  return (
    <iframe
      width="100%"
      height="300"
      style={{ border: 0, borderRadius: '0.5rem' }}
      loading="lazy"
      src={mapUrl}
      title={`Map of ${address}`}
      allowFullScreen
    ></iframe>
  );
};

export default MapEmbed;
