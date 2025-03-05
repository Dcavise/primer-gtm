
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';

interface PropertyStatusInfoProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  formValues: Partial<RealEstateProperty>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PropertyStatusInfo: React.FC<PropertyStatusInfoProps> = ({
  property,
  isEditing,
  isSaving,
  formValues,
  onEdit,
  onCancel,
  onSave,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Status Information
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
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">AHJ Zoning Confirmation</p>
          {isEditing ? (
            <Input 
              name="ahj_zoning_confirmation" 
              value={formValues.ahj_zoning_confirmation || ''} 
              onChange={onInputChange}
              placeholder="Enter AHJ zoning confirmation"
            />
          ) : (
            <p className="font-medium">{property.ahj_zoning_confirmation || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">AHJ Building Records</p>
          {isEditing ? (
            <Input 
              name="ahj_building_records" 
              value={formValues.ahj_building_records || ''} 
              onChange={onInputChange}
              placeholder="Enter AHJ building records"
            />
          ) : (
            <p className="font-medium">{property.ahj_building_records || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Survey Status</p>
          {isEditing ? (
            <Input 
              name="survey_status" 
              value={formValues.survey_status || ''} 
              onChange={onInputChange}
              placeholder="Enter survey status"
            />
          ) : (
            <p className="font-medium">{property.survey_status || 'Not specified'}</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Test Fit Status</p>
          {isEditing ? (
            <Input 
              name="test_fit_status" 
              value={formValues.test_fit_status || ''} 
              onChange={onInputChange}
              placeholder="Enter test fit status"
            />
          ) : (
            <p className="font-medium">{property.test_fit_status || 'Not specified'}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyStatusInfo;
