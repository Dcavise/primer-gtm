
import React, { useCallback, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Home, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { RealEstateProperty } from '@/types/realEstate';
import { getPhaseColorClass } from './PhaseSelector';
import { logger } from '@/utils/logger';

interface PropertyCardProps {
  property: RealEstateProperty;
}

export const PropertyCard: React.FC<PropertyCardProps> = memo(({ property }) => {
  const navigate = useNavigate();
  
  // Memoize the handleClick function so it doesn't get recreated on every render
  const handleClick = useCallback(() => {
    if (!property.id) {
      logger.error('Property is missing ID');
      return;
    }
    
    navigate(`/real-estate-pipeline/property/${property.id}`);
  }, [property.id, navigate]);
  
  // Memoize the formatted creation date
  const formattedDate = useMemo(() => {
    if (!property.created_at) return 'Recently added';
    return `Added ${formatDistanceToNow(new Date(property.created_at), { addSuffix: true })}`;
  }, [property.created_at]);
  
  // Memoize the phase color class
  const phaseColorClass = useMemo(() => 
    getPhaseColorClass(property.phase)
  , [property.phase]);
  
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
          <div className={`px-2 py-1 rounded-md text-xs font-medium ${phaseColorClass}`}>
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
          {formattedDate}
        </div>
      </CardFooter>
    </Card>
  );
});
