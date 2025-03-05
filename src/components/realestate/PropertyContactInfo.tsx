
import React from 'react';
import { Edit, Save, X, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';

interface PropertyContactInfoProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  formValues: Partial<RealEstateProperty>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PropertyContactInfo: React.FC<PropertyContactInfoProps> = ({
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
          <div>Contact Information</div>
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
        <div className="border-b pb-4">
          <h3 className="font-medium text-lg mb-3">Landlord Contact</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contact Person</p>
              {isEditing ? (
                <Input 
                  name="ll_poc" 
                  value={formValues.ll_poc || ''} 
                  onChange={onInputChange}
                  placeholder="Enter contact name"
                />
              ) : (
                <p className="font-medium">{property.ll_poc || 'Not specified'}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Phone Number</p>
              {isEditing ? (
                <Input 
                  name="ll_phone" 
                  value={formValues.ll_phone || ''} 
                  onChange={onInputChange}
                  placeholder="Enter phone number"
                  type="tel"
                />
              ) : (
                property.ll_phone ? (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`tel:${property.ll_phone}`} className="text-primary hover:underline">
                      {property.ll_phone}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No phone provided</p>
                )
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Email Address</p>
              {isEditing ? (
                <Input 
                  name="ll_email" 
                  value={formValues.ll_email || ''} 
                  onChange={onInputChange}
                  placeholder="Enter email address"
                  type="email"
                />
              ) : (
                property.ll_email ? (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <a href={`mailto:${property.ll_email}`} className="text-primary hover:underline truncate">
                      {property.ll_email}
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No email provided</p>
                )
              )}
            </div>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Property ID: {property.id}</p>
          <p>Added on: {new Date(property.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyContactInfo;
