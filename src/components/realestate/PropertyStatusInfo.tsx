
import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty, BooleanStatus, SurveyStatus, TestFitStatus } from '@/types/realEstate';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PropertyStatusInfoProps {
  property: RealEstateProperty;
  onPropertyUpdated: () => void;
}

const PropertyStatusInfo: React.FC<PropertyStatusInfoProps> = ({
  property,
  onPropertyUpdated
}) => {
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Update type to accommodate enum values with proper nullable types
  const [fieldValues, setFieldValues] = useState<Record<string, BooleanStatus | SurveyStatus | TestFitStatus | string | null>>({});

  // Initialize field values when property changes
  useEffect(() => {
    if (property) {
      setFieldValues({
        ahj_zoning_confirmation: property.ahj_zoning_confirmation,
        ahj_building_records: property.ahj_building_records,
        survey_status: property.survey_status,
        test_fit_status: property.test_fit_status,
      });
    }
  }, [property]);

  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] as BooleanStatus | SurveyStatus | TestFitStatus | string | null
    }));
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] as BooleanStatus | SurveyStatus | TestFitStatus | string | null
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
      let valueToSave: BooleanStatus | SurveyStatus | TestFitStatus | string | null = null;
      const currentValue = fieldValues[fieldName];
      
      // For enum fields, make sure the value is valid
      if (fieldName === 'ahj_zoning_confirmation') {
        valueToSave = (currentValue === 'true' || currentValue === 'false' || currentValue === 'unknown') 
          ? currentValue as BooleanStatus
          : null;
      } else if (fieldName === 'survey_status') {
        valueToSave = (currentValue === 'complete' || currentValue === 'pending' || currentValue === 'unknown')
          ? currentValue as SurveyStatus
          : null;
      } else if (fieldName === 'test_fit_status') {
        valueToSave = (currentValue === 'unknown' || currentValue === 'pending' || currentValue === 'complete')
          ? currentValue as TestFitStatus
          : null;
      } else {
        valueToSave = currentValue as string;
      }
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ [fieldName]: valueToSave })
        .eq('id', property.id);
      
      if (error) {
        console.error(`Error saving ${fieldName}:`, error);
        toast.error(`Failed to save ${fieldName}`);
        return;
      }
      
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      toast.success(`${fieldName} updated successfully`);
      onPropertyUpdated();
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      toast.error(`Failed to save ${fieldName}`);
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
          {!isFieldEditing && (
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
        ) : (
          <p className="font-medium">{property[fieldName as keyof RealEstateProperty] || 'Not specified'}</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Status Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderField('ahj_zoning_confirmation', 'AHJ Zoning Confirmation')}
        {renderField('ahj_building_records', 'AHJ Building Records')}
        {renderField('survey_status', 'Survey Status')}
        {renderField('test_fit_status', 'Test Fit Status')}
      </CardContent>
    </Card>
  );
};

export default PropertyStatusInfo;
