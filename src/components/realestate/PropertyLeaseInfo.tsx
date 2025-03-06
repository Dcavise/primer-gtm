
import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty, LeaseStatus } from '@/types/realEstate';
import { supabase } from '@/integrations/supabase/client';

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
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Update type to match our form inputs - use LeaseStatus
  const [fieldValues, setFieldValues] = useState<Record<string, LeaseStatus | string>>({});

  // Initialize field values when property changes
  React.useEffect(() => {
    if (property) {
      setFieldValues({
        loi_status: property.loi_status || null,
        lease_status: property.lease_status || null,
      });
    }
  }, [property]);

  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] as LeaseStatus
    }));
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] as LeaseStatus
    }));
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveField = async (fieldName: string) => {
    if (!property.id) return;
    
    setSavingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      // Ensure the value matches enum type for specific fields
      let valueToSave: LeaseStatus = null;
      
      // For enum fields, make sure the value is valid
      if (fieldName === 'loi_status' || fieldName === 'lease_status') {
        const currentValue = fieldValues[fieldName];
        valueToSave = (currentValue === 'pending' || currentValue === 'sent' || currentValue === 'signed') 
          ? currentValue as LeaseStatus
          : null;
      }
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ [fieldName]: valueToSave })
        .eq('id', property.id);
      
      if (error) {
        console.error(`Error saving ${fieldName}:`, error);
        return;
      }
      
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      
      // Also update the main form values so they stay in sync
      if (onInputChange) {
        const syntheticEvent = {
          target: { name: fieldName, value: valueToSave }
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(syntheticEvent);
      }
      
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
    } finally {
      setSavingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderField = (fieldName: string, label: string) => {
    const isFieldEditing = editingFields[fieldName];
    const isFieldSaving = savingFields[fieldName];
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{label}</p>
          {!isEditing && !isFieldEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleEditField(fieldName)}
              className="h-6 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        {isFieldEditing ? (
          <div className="space-y-2">
            <Input 
              name={fieldName} 
              value={fieldValues[fieldName] || ''} 
              onChange={handleFieldChange}
              placeholder={`Enter ${label.toLowerCase()}`}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleCancelField(fieldName)}
                disabled={isFieldSaving}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleSaveField(fieldName)}
                disabled={isFieldSaving}
                className="h-7 px-2 text-xs"
              >
                {isFieldSaving ? (
                  <LoadingState message="Saving..." showSpinner={true} />
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" /> Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : isEditing ? (
          <Input 
            name={fieldName} 
            value={formValues[fieldName as keyof RealEstateProperty] as string || ''} 
            onChange={onInputChange}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <p className="font-medium">{property[fieldName as keyof RealEstateProperty] || 'Not specified'}</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Lease Information
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
                <Edit className="h-4 w-4 mr-1" /> Edit All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('loi_status', 'LOI Status')}
        {renderField('lease_status', 'Lease Status')}
      </CardContent>
    </Card>
  );
};

export default PropertyLeaseInfo;
