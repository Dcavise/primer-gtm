
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { 
  RealEstateProperty, 
  BooleanStatus, 
  SurveyStatus, 
  TestFitStatus 
} from '@/types/realEstate';
import PropertyFieldEditor from './PropertyFieldEditor';
import { usePropertyFieldEditing } from '@/hooks/usePropertyFieldEditing';

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
      ahj_zoning_confirmation: property.ahj_zoning_confirmation,
      ahj_building_records: property.ahj_building_records,
      survey_status: property.survey_status,
      test_fit_status: property.test_fit_status,
    },
    onFieldSaved: (fieldName, value) => {
      // Sync the value with the parent component's form state
      const event = {
        target: { name: fieldName, value }
      } as React.ChangeEvent<HTMLInputElement>;
      onInputChange(event);
    },
    validateField: (fieldName, value) => {
      // Validate specific field types
      if (fieldName === 'ahj_zoning_confirmation') {
        return (value === 'true' || value === 'false' || value === 'unknown') 
          ? value as BooleanStatus
          : null;
      } else if (fieldName === 'survey_status') {
        return (value === 'complete' || value === 'pending' || value === 'unknown')
          ? value as SurveyStatus
          : null;
      } else if (fieldName === 'test_fit_status') {
        return (value === 'unknown' || value === 'pending' || value === 'complete')
          ? value as TestFitStatus
          : null;
      }
      return value;
    }
  });

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
                <Edit className="h-4 w-4 mr-1" /> Edit All
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PropertyFieldEditor
          fieldName="ahj_zoning_confirmation"
          label="AHJ Zoning Confirmation"
          value={fieldValues.ahj_zoning_confirmation}
          isEditing={editingFields.ahj_zoning_confirmation}
          isSaving={savingFields.ahj_zoning_confirmation}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.ahj_zoning_confirmation as string}
          globalOnChange={onInputChange}
          placeholder="true, false, or unknown"
        />
        
        <PropertyFieldEditor
          fieldName="ahj_building_records"
          label="AHJ Building Records"
          value={fieldValues.ahj_building_records}
          isEditing={editingFields.ahj_building_records}
          isSaving={savingFields.ahj_building_records}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.ahj_building_records as string}
          globalOnChange={onInputChange}
        />
        
        <PropertyFieldEditor
          fieldName="survey_status"
          label="Survey Status"
          value={fieldValues.survey_status}
          isEditing={editingFields.survey_status}
          isSaving={savingFields.survey_status}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.survey_status as string}
          globalOnChange={onInputChange}
          placeholder="complete, pending, or unknown"
        />
        
        <PropertyFieldEditor
          fieldName="test_fit_status"
          label="Test Fit Status"
          value={fieldValues.test_fit_status}
          isEditing={editingFields.test_fit_status}
          isSaving={savingFields.test_fit_status}
          onEdit={handleEditField}
          onCancel={handleCancelField}
          onSave={handleSaveField}
          onChange={handleFieldChange}
          globalEditMode={isEditing}
          globalFormValue={formValues.test_fit_status as string}
          globalOnChange={onInputChange}
          placeholder="complete, pending, or unknown"
        />
      </CardContent>
    </Card>
  );
};

export default PropertyStatusInfo;
