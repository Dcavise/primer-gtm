
import React from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/LoadingState';
import { RealEstateProperty } from '@/types/realEstate';

interface PropertyNotesProps {
  property: RealEstateProperty;
  isEditing: boolean;
  isSaving: boolean;
  notesValue: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onNotesChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PropertyNotes: React.FC<PropertyNotesProps> = ({
  property,
  isEditing,
  isSaving,
  notesValue,
  onEdit,
  onCancel,
  onSave,
  onNotesChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          Notes
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
      <CardContent>
        {isEditing ? (
          <Textarea
            value={notesValue}
            onChange={onNotesChange}
            placeholder="Enter property notes here..."
            className="min-h-[150px]"
          />
        ) : (
          <p className="whitespace-pre-line">{property.status_notes || 'No notes added yet.'}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyNotes;
