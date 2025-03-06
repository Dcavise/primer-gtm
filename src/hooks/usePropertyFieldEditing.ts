
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FieldValues {
  [key: string]: any;
}

export interface FieldEditingState {
  editingFields: Record<string, boolean>;
  savingFields: Record<string, boolean>;
  fieldValues: FieldValues;
  handleEditField: (fieldName: string) => void;
  handleCancelField: (fieldName: string) => void;
  handleFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveField: (fieldName: string) => Promise<void>;
  updateFieldValue: (fieldName: string, value: any) => void;
}

interface UsePropertyFieldEditingProps {
  property: { id: number } & Record<string, any>;
  initialValues: FieldValues;
  onFieldSaved?: (fieldName: string, value: any) => void;
  tableName?: string;
  validateField?: (fieldName: string, value: any) => any;
}

export const usePropertyFieldEditing = ({
  property,
  initialValues,
  onFieldSaved,
  tableName = 'real_estate_pipeline',
  validateField
}: UsePropertyFieldEditingProps): FieldEditingState => {
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  const [fieldValues, setFieldValues] = useState<FieldValues>(initialValues);
  
  // Update field values when property changes
  useEffect(() => {
    setFieldValues(initialValues);
  }, [initialValues]);
  
  const handleEditField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: true }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName] 
    }));
  };
  
  const handleCancelField = (fieldName: string) => {
    setEditingFields(prev => ({ ...prev, [fieldName]: false }));
    setFieldValues(prev => ({ 
      ...prev, 
      [fieldName]: property[fieldName]
    }));
  };
  
  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldValues(prev => ({ ...prev, [name]: value }));
  };

  const updateFieldValue = (fieldName: string, value: any) => {
    setFieldValues(prev => ({ ...prev, [fieldName]: value }));
  };
  
  const handleSaveField = async (fieldName: string) => {
    if (!property.id) return;
    
    setSavingFields(prev => ({ ...prev, [fieldName]: true }));
    
    try {
      let valueToSave = fieldValues[fieldName];
      
      // If validateField is provided, use it to validate/transform the value
      if (validateField) {
        valueToSave = validateField(fieldName, valueToSave);
      }
      
      const { error } = await supabase
        .from(tableName)
        .update({ [fieldName]: valueToSave })
        .eq('id', property.id);
      
      if (error) {
        console.error(`Error saving ${fieldName}:`, error);
        toast.error(`Failed to save ${fieldName}`);
        return;
      }
      
      setEditingFields(prev => ({ ...prev, [fieldName]: false }));
      toast.success(`${fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} updated successfully`);
      
      // Call onFieldSaved callback if provided
      if (onFieldSaved) {
        onFieldSaved(fieldName, valueToSave);
      }
      
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      toast.error(`Failed to save ${fieldName}`);
    } finally {
      setSavingFields(prev => ({ ...prev, [fieldName]: false }));
    }
  };
  
  return {
    editingFields,
    savingFields,
    fieldValues,
    handleEditField,
    handleCancelField,
    handleFieldChange,
    handleSaveField,
    updateFieldValue
  };
};
