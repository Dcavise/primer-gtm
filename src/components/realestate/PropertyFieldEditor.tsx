
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/LoadingState';

interface PropertyFieldEditorProps {
  fieldName: string;
  label: string;
  value: string | null;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: (fieldName: string) => void;
  onCancel: (fieldName: string) => void;
  onSave: (fieldName: string) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  globalEditMode?: boolean;
  globalFormValue?: string | null;
  globalOnChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PropertyFieldEditor: React.FC<PropertyFieldEditorProps> = ({
  fieldName,
  label,
  value,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onChange,
  disabled = false,
  placeholder,
  globalEditMode = false,
  globalFormValue,
  globalOnChange
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        {!globalEditMode && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(fieldName)}
            className="h-6 px-2"
            disabled={disabled}
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <Input 
            name={fieldName} 
            value={value || ''} 
            onChange={onChange}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            disabled={isSaving}
          />
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCancel(fieldName)}
              disabled={isSaving}
              className="h-7 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => onSave(fieldName)}
              disabled={isSaving}
              className="h-7 px-2 text-xs"
            >
              {isSaving ? (
                <LoadingState message="Saving..." showSpinner={true} />
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" /> Save
                </>
              )}
            </Button>
          </div>
        </div>
      ) : globalEditMode ? (
        <Input 
          name={fieldName} 
          value={globalFormValue || ''} 
          onChange={globalOnChange}
          placeholder={placeholder || `Enter ${label.toLowerCase()}`}
        />
      ) : (
        <p className="font-medium">{value || 'Not specified'}</p>
      )}
    </div>
  );
};

export default PropertyFieldEditor;
