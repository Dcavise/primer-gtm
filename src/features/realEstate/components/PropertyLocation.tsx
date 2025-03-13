import React from "react";
import { Map, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PropertyLocationProps {
  address: string;
}

const PropertyLocation: React.FC<PropertyLocationProps> = ({ address }) => {
  // Create Google Maps URL for the address (users can still use Google Maps in browser)
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  
  // Get only city and state from address (assuming address format includes city and state)
  const cityState = address.split(',').slice(-2).join(',').trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Map className="h-5 w-5 mr-2" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-100 p-6 rounded-md flex flex-col items-center justify-center">
          <div className="flex items-center mb-4">
            <MapPin className="h-5 w-5 mr-2 text-slate-600" />
            <span className="text-slate-800">{address}</span>
          </div>
          
          {/* Location details */}
          <div className="text-sm text-center mb-4 text-slate-600">
            <p>Located in {cityState || "the city center"}.</p>
            <p className="mt-1">
              Visit the property for precise location information.
            </p>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline mt-2"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Look up on Google Maps
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyLocation;
