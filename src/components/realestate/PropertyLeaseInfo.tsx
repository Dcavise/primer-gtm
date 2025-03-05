
import React from 'react';
import { Edit, Save, X, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';

interface PropertyLeaseInfoProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  formValues: Partial<RealEstateProperty>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PropertyLeaseInfo: React.FC<PropertyLeaseInfoProps> = ({
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
          <div className="flex items-center">
            <FileCheck className="h-5 w-5 mr-2" />
            Lease Information
          </div>
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
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">LOI Status</p>
            {isEditing ? (
              <Input 
                name="loi_status" 
                value={formValues.loi_status || ''} 
                onChange={onInputChange}
                placeholder="Enter LOI status"
              />
            ) : (
              <p className="font-medium">{property.loi_status || 'Not specified'}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lease Status</p>
            {isEditing ? (
              <Input 
                name="lease_status" 
                value={formValues.lease_status || ''} 
                onChange={onInputChange}
                placeholder="Enter lease status"
              />
            ) : (
              <p className="font-medium">{property.lease_status || 'Not specified'}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyLeaseInfo;
