
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty, LeaseStatus } from '@/types/realEstate';
import PropertyFieldEditor from './PropertyFieldEditor';
import { usePropertyFieldEditing } from '@/hooks/usePropertyFieldEditing';

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
  // Use our custom hook for field editing
  const { 
    editingFields, 
    savingFields, 
    fieldValues, 
    handleEditField, 
    handleCancelField, 
    handleFieldChange, 
    handleSaveField 
  } = usePropertyFieldEditing({
    property,
    initialValues: {
      loi_status: property.loi_status || null,
      lease_status: property.lease_status || null,
    },
    onFieldSaved: (fieldName, value) => {
      // Sync the value with the parent component's form state
      const event = {
        target: { name: fieldName, value }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(event);
    },
    validateField: (fieldName, value) => {
      // Validate lease status fields
      if (fieldName === 'loi_status' || fieldName === 'lease_status') {
        return (value === 'pending' || value === 'sent' || value === 'signed') 
          ? value as LeaseStatus
          : null;
      }
      return value;
    }
  });

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
        <PropertyFieldEditor
          fieldName="loi_status"
          label="LOI Status"
          value={fieldValues.loi_status}
          isEditing={editingFields.loi_status}
          isSaving={savingFields.loi_status}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.loi_status as string}
          globalOnChange={onInputChange}
          placeholder="pending, sent, or signed"
        />
        
        <PropertyFieldEditor
          fieldName="lease_status"
          label="Lease Status"
          value={fieldValues.lease_status}
          isEditing={editingFields.lease_status}
          isSaving={savingFields.lease_status}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.lease_status as string}
          globalOnChange={onInputChange}
          placeholder="pending, sent, or signed"
        />
      </CardContent>
    </Card>
  );
};

export default PropertyLeaseInfo;
