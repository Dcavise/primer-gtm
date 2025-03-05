
import React from 'react';
import { Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MapEmbed from '@/components/MapEmbed';

interface PropertyLocationProps {
  address: string;
}

const PropertyLocation: React.FC<PropertyLocationProps> = ({ address }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Map className="h-5 w-5 mr-2" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MapEmbed address={address} />
      </CardContent>
    </Card>
  );
};

export default PropertyLocation;
