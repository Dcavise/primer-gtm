
import React from 'react';
import { MapPin } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { RealEstateProperty } from '@/types/realEstate';

interface PropertyHeaderProps {
  property: RealEstateProperty;
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl md:text-3xl font-semibold truncate">
            {property.site_name || 'Unnamed Property'}
          </h1>
          <Navbar />
        </div>
        {property.address && (
          <div className="flex items-center text-white/80">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{property.address}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default PropertyHeader;
