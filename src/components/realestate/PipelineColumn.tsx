
import React from 'react';
import { PropertyCard } from './PropertyCard';
import { RealEstateProperty } from '@/types/realEstate';

interface PipelineColumnProps {
  title: string;
  properties: RealEstateProperty[];
  onPropertyClick: (property: RealEstateProperty) => void;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  title,
  properties,
  onPropertyClick
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="bg-secondary p-2 rounded-t-md">
        <h3 className="font-medium text-center">{title}</h3>
        <div className="text-xs text-center text-muted-foreground">{properties.length} properties</div>
      </div>
      <div className="flex-1 bg-secondary/20 p-2 rounded-b-md overflow-auto max-h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {properties.length > 0 ? (
            properties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property}
                onClick={() => onPropertyClick(property)} 
              />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No properties in this phase
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
