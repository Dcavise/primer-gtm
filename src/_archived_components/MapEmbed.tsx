import React, { useEffect, useState } from "react";
import { getApiKey } from "@/lib/serverComms";
import { LoadingState } from "./LoadingState";
import { MapPin, AlertCircle } from "lucide-react";
import { getGoogleMapsUrl, getGoogleMapsEmbedUrl } from "@/utils/mapUtils";

interface MapEmbedProps {
  address: string;
}

const MapEmbed: React.FC<MapEmbedProps> = ({ address }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);
        const key = await getApiKey("google_maps");
        setApiKey(key);
      } catch (err) {
        console.error("Error fetching Google Maps API key:", err);
        setError("Failed to load map: API key could not be retrieved");
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  // Handle iframe loading errors
  const handleIframeError = () => {
    console.error(
      "Map iframe failed to load, possibly due to Content Security Policy restrictions"
    );
    setIframeError(true);
  };

  if (isLoading) {
    return <LoadingState message="Loading map..." />;
  }

  if (error || !apiKey || iframeError) {
    return (
      <div className="bg-slate-100 p-6 rounded-md text-center h-[300px] flex flex-col items-center justify-center">
        <AlertCircle className="h-10 w-10 text-slate-400 mb-3" />
        <p className="text-slate-600 font-medium mb-2">{error || "Map could not be loaded"}</p>
        <div className="mt-2 flex items-center justify-center text-primary">
          <MapPin className="h-5 w-5 mr-2" />
          <a
            href={getGoogleMapsUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View location on Google Maps
          </a>
        </div>
      </div>
    );
  }

  // Create the Google Maps embed URL with the address
  const mapUrl = getGoogleMapsEmbedUrl(address, apiKey);

  return (
    <>
      <iframe
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: "0.5rem" }}
        loading="lazy"
        src={mapUrl}
        title={`Map of ${address}`}
        allowFullScreen
        onError={handleIframeError}
      ></iframe>
      <div className="mt-2 text-sm text-slate-500 flex justify-end">
        <a
          href={getGoogleMapsUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Open in Google Maps
        </a>
      </div>
    </>
  );
};

export default MapEmbed;
