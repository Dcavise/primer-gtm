
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Home, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { RealEstateProperty } from '@/types/realEstate';
import { getPhaseColorClass } from './PhaseSelector';

interface PropertyCardProps {
  property: RealEstateProperty;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (!property.id) {
      console.error('Property is missing ID');
      return;
    }
    
    console.log('Navigating to property detail page with ID:', property.id);
    navigate(`/real-estate-pipeline/property/${property.id}`);
  };
  
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary" 
      onClick={handleClick}
    >
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base">
            {property.site_name || 'Unnamed Property'}
          </h3>
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${getPhaseColorClass(property.phase)}`}>
            {property.phase || 'No Phase'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pb-0">
        {property.address && (
          <div className="flex items-start mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground mr-1 mt-0.5" />
            <p className="text-sm text-muted-foreground">{property.address}</p>
          </div>
        )}
        
        {property.market && (
          <div className="flex items-start mb-2">
            <Home className="h-4 w-4 text-muted-foreground mr-1 mt-0.5" />
            <p className="text-sm text-muted-foreground">{property.market}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 text-xs text-muted-foreground">
        <div className="flex items-center">
          <CalendarDays className="h-3 w-3 mr-1" />
          {property.created_at ? 
            `Added ${formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}` : 
            'Recently added'
          }
        </div>
      </CardFooter>
    </Card>
  );
};
