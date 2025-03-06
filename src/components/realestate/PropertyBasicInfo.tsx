
import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import PhaseSelector from './PhaseSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fieldValidators } from '@/schemas/propertySchema';

interface PropertyBasicInfoProps {
  property: RealEstateProperty;
  onPropertyUpdated: () => void;
}

const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = ({
  property,
  onPropertyUpdated
}) => {
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Fix the type definition to include PropertyPhase, string, null, and number
  const [fieldValues, setFieldValues] = useState<Record<string, string | null | PropertyPhase | number>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Initialize field values when property changes
  useEffect(() => {
    if (property) {
      setFieldValues({
        phase: property.phase || '',
        sf_available: property.sf_available || '',
        zoning: property.zoning || '',
        permitted_use: property.permitted_use || '',
        parking: property.parking || '',
        fire_sprinklers: property.fire_sprinklers || '',
        fiber: property.fiber || '',
      });
    }
  }, [property]);

  const validateField = (fieldName: string, value: any): boolean => {
    // Get the validator for this field from our schema
    const validator = fieldValidators[fieldName as keyof typeof fieldValidators];
    if (!validator) return true; // No validator defined for this field
    
    try {
      // Validate the value against the schema
      validator.parse(value);
      // Clear any existing validation error for this field
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
      return true;
    } catch (error) {
      console.error(`Validation error for ${fieldName}:`, error);
      if (error instanceof Error) {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: error.message
        }));
      } else {
        setValidationErrors(prev => ({
          ...prev,
          [fieldName]: 'Invalid value'
        }));
      }
      return false;
    }
  };

  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    // Type assertion for phase field
    if (fieldName === 'phase') {
      setFieldValues(prev => ({ 
        ...prev, 
        [fieldName]: property.phase || '' as PropertyPhase | ''
      }));
    } else {
      setFieldValues(prev => ({ 
        ...prev, 
        [fieldName]: property[fieldName as keyof RealEstateProperty] || '' 
      }));
    }
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    // Clear any validation errors for this field
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
    
    // Type assertion for phase field
    if (fieldName === 'phase') {
      setFieldValues(prev => ({ 
        ...prev, 
        [fieldName]: property.phase || '' as PropertyPhase | ''
      }));
    } else {
      setFieldValues(prev => ({ 
        ...prev, 
        [fieldName]: property[fieldName as keyof RealEstateProperty] || '' 
      }));
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldValues(prev => ({ ...prev, [name]: value }));
    validateField(name, value === '' ? null : value);
  };

  const handlePhaseFieldChange = (value: PropertyPhase | '') => {
    console.log("Selected phase:", value);
    setFieldValues(prev => ({ ...prev, phase: value || null }));
    validateField('phase', value === '' ? null : value);
  };

  const handleSaveField = async (fieldName: string) => {
    if (!property.id) return;
    
    // Get the value to validate
    const valueToValidate = fieldName === 'phase' && fieldValues[fieldName] === '' 
      ? null 
      : fieldValues[fieldName];
    
    // Validate the field value before saving
    const isValid = validateField(fieldName, valueToValidate);
    
    if (!isValid) {
      toast.error(`Invalid ${fieldName}: ${validationErrors[fieldName]}`);
      return;
    }
    
    setSavingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      console.log(`Saving ${fieldName} with value:`, fieldValues[fieldName]);
      
      // For the phase field, handle empty string as null for the database
      const valueToSave = fieldName === 'phase' && fieldValues[fieldName] === '' 
        ? null 
        : fieldValues[fieldName];
      
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

  const renderField = (fieldName: string, label: string, type: string = 'text') => {
    const isFieldEditing = editingFields[fieldName];
    const isFieldSaving = savingFields[fieldName];
    const hasError = validationErrors[fieldName];
    
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
              type={type}
              className={hasError ? "border-red-500" : ""}
            />
            {hasError && (
              <p className="text-xs text-red-500">{hasError}</p>
            )}
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
                disabled={isFieldSaving || Boolean(hasError)}
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
          <p className="font-medium">
            {fieldName === 'sf_available' && property[fieldName] 
              ? `${property[fieldName]} sq ft` 
              : (property[fieldName as keyof RealEstateProperty] || 'Not specified')}
          </p>
        )}
      </div>
    );
  };

  const renderPhaseField = () => {
    const fieldName = 'phase';
    const isFieldEditing = editingFields[fieldName];
    const isFieldSaving = savingFields[fieldName];
    const hasError = validationErrors[fieldName];
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Phase</p>
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
            <PhaseSelector
              value={fieldValues.phase as PropertyPhase | null}
              onValueChange={handlePhaseFieldChange}
            />
            {hasError && (
              <p className="text-xs text-red-500">{hasError}</p>
            )}
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
                disabled={isFieldSaving || Boolean(hasError)}
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
          <p className="font-medium">{property?.phase || 'Not specified'}</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Property Information
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
        {renderPhaseField()}
        {renderField('sf_available', 'Available Space')}
        {renderField('zoning', 'Zoning')}
        {renderField('permitted_use', 'Permitted Use')}
        {renderField('parking', 'Parking')}
        {renderField('fire_sprinklers', 'Fire Sprinklers')}
        {renderField('fiber', 'Fiber')}
      </CardContent>
    </Card>
  );
};

export default PropertyBasicInfo;
