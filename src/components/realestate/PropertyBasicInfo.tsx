
import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import PhaseSelector from './PhaseSelector';
import { supabase } from '@/integrations/supabase/client';

interface PropertyBasicInfoProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  formValues: Partial<RealEstateProperty>;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhaseChange: (value: PropertyPhase | '') => void;
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
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Changed the type to Record<string, string | null> to handle properties that might be null
  const [fieldValues, setFieldValues] = useState<Record<string, string | null | PropertyPhase>>({});

  // Initialize field values when property changes
  React.useEffect(() => {
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

  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ ...prev, [fieldName]: property[fieldName as keyof RealEstateProperty] || '' }));
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => ({ ...prev, [fieldName]: property[fieldName as keyof RealEstateProperty] || '' }));
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const handlePhaseFieldChange = (value: PropertyPhase | '') => {
    setFieldValues(prev => ({ ...prev, phase: value || null }));
  };

  const handleSaveField = async (fieldName: string) => {
    if (!property.id) return;
    
    setSavingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ [fieldName]: fieldValues[fieldName] })
        .eq('id', property.id);
      
      if (error) {
        console.error(`Error saving ${fieldName}:`, error);
        return;
      }
      
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      
      // Also update the main form values so they stay in sync
      if (onInputChange && fieldName !== 'phase') {
        const syntheticEvent = {
          target: { name: fieldName, value: fieldValues[fieldName] }
        } as React.ChangeEvent<HTMLInputElement>;
        onInputChange(syntheticEvent);
      } else if (onPhaseChange && fieldName === 'phase') {
        onPhaseChange(fieldValues.phase as PropertyPhase || '');
      }
      
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
    } finally {
      setSavingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderField = (fieldName: string, label: string, type: string = 'text') => {
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
              type={type}
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
            value={formValues[fieldName as keyof RealEstateProperty] || ''} 
            onChange={onInputChange}
            placeholder={`Enter ${label.toLowerCase()}`}
            type={type}
          />
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
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Phase</p>
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
            <PhaseSelector
              value={fieldValues.phase as PropertyPhase || null}
              onValueChange={handlePhaseFieldChange}
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
          <PhaseSelector
            value={formValues.phase || null}
            onValueChange={onPhaseChange}
          />
        ) : (
          <p className="font-medium">{property?.phase || 'Not specified'}</p>
        )}
      </div>
    );
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
                <Edit className="h-4 w-4 mr-1" /> Edit All
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
