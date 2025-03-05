
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';
import PhaseSelector from './PhaseSelector';

interface PropertyBasicInfoProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  formValues: Partial<RealEstateProperty>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhaseChange: (value: string) => void;
}

const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = ({
  property,
  isEditing,
  isSaving,
  formValues,
  onEdit,
  onCancel,
  onSave,
  onInputChange,
  onPhaseChange
}) => {
  const renderPhaseSelector = () => {
    if (isEditing) {
      return (
        <PhaseSelector
          value={formValues.phase || null}
          onValueChange={onPhaseChange}
        />
      );
    } else {
      return (
        <p className="font-medium">{property?.phase || 'Not specified'}</p>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <div>Property Information</div>
          <div className="space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <LoadingState message="Saving..." showSpinner={true} />
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </CardTitle>
        {property.market && (
          <div className="mt-2">
            <Badge variant="outline">
              {property.market}
            </Badge>
          </div>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Phase</p>
          {renderPhaseSelector()}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Available Space</p>
          {isEditing ? (
            <Input 
              name="sf_available" 
              value={formValues.sf_available || ''} 
              onChange={onInputChange}
              placeholder="Enter available square footage"
            />
          ) : (
            <p className="font-medium">{property.sf_available ? `${property.sf_available} sq ft` : 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Zoning</p>
          {isEditing ? (
            <Input 
              name="zoning" 
              value={formValues.zoning || ''} 
              onChange={onInputChange}
              placeholder="Enter zoning"
            />
          ) : (
            <p className="font-medium">{property.zoning || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Permitted Use</p>
          {isEditing ? (
            <Input 
              name="permitted_use" 
              value={formValues.permitted_use || ''} 
              onChange={onInputChange}
              placeholder="Enter permitted use"
            />
          ) : (
            <p className="font-medium">{property.permitted_use || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Parking</p>
          {isEditing ? (
            <Input 
              name="parking" 
              value={formValues.parking || ''} 
              onChange={onInputChange}
              placeholder="Enter parking details"
            />
          ) : (
            <p className="font-medium">{property.parking || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Fire Sprinklers</p>
          {isEditing ? (
            <Input 
              name="fire_sprinklers" 
              value={formValues.fire_sprinklers || ''} 
              onChange={onInputChange}
              placeholder="Enter fire sprinkler details"
            />
          ) : (
            <p className="font-medium">{property.fire_sprinklers || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Fiber</p>
          {isEditing ? (
            <Input 
              name="fiber" 
              value={formValues.fiber || ''} 
              onChange={onInputChange}
              placeholder="Enter fiber details"
            />
          ) : (
            <p className="font-medium">{property.fiber || 'Not specified'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyBasicInfo;
