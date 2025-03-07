
import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';
import { supabase } from '@/integrations/supabase-client';
import { toast } from 'sonner';

interface PropertyContactInfoProps {
  property: RealEstateProperty;
  onPropertyUpdated: () => void;
}

const PropertyContactInfo: React.FC<PropertyContactInfoProps> = ({
  property,
  onPropertyUpdated
}) => {
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Update type to include number
  const [fieldValues, setFieldValues] = useState<Record<string, string | null | number>>({
    ll_poc: '',
    ll_phone: '',
    ll_email: '',
  });

  // Initialize field values when property changes
  useEffect(() => {
    if (property) {
      setFieldValues({
        ll_poc: property.ll_poc || '',
        ll_phone: property.ll_phone || '',
        ll_email: property.ll_email || '',
      });
    }
  }, [property]);

  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] || '' 
    }));
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName as keyof RealEstateProperty] || '' 
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
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ [fieldName]: fieldValues[fieldName] })
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
    const isFieldEditing = editingFields[fieldName] || false;
    const isFieldSaving = savingFields[fieldName] || false;
    
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
          Landlord Contact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderField('ll_poc', 'Contact Name')}
        {renderField('ll_phone', 'Phone')}
        {renderField('ll_email', 'Email')}
      </CardContent>
    </Card>
  );
};

export default PropertyContactInfo;
