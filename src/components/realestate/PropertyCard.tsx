
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RealEstateProperty } from '@/types/realEstate';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building, Phone, Mail, FileText } from 'lucide-react';

interface PropertyCardProps {
  property: RealEstateProperty;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();

  const handlePropertyClick = () => {
    navigate(`/real-estate-pipeline/property/${property.id}`);
  };

  return (
    <Card 
      className="h-full hover:shadow-md transition-shadow cursor-pointer" 
      onClick={handlePropertyClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-start justify-between">
          <span className="truncate">{property.site_name || 'Unnamed Property'}</span>
          {property.market && (
            <Badge className="ml-2 shrink-0" variant="outline">
              {property.market}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {property.address && (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{property.address}</span>
          </div>
        )}
        
        {property.phase && (
          <div className="flex items-start">
            <Building className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">Phase: {property.phase}</span>
          </div>
        )}
        
        {property.sf_available && (
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{property.sf_available} sq ft available</span>
          </div>
        )}
        
        {property.ll_poc && (
          <div className="flex flex-col space-y-1 mt-3 border-t pt-2">
            <span className="font-medium">Contact: {property.ll_poc}</span>
            {property.ll_phone && (
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">{property.ll_phone}</span>
              </div>
            )}
            {property.ll_email && (
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground text-xs truncate">{property.ll_email}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
