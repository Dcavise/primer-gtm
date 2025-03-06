import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { supabase } from '@/integrations/supabase-client';
import { PhaseSelector } from './PhaseSelector';

interface PropertyDetailDialogProps {
  property: RealEstateProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Partial<RealEstateProperty>) => Promise<void>;
}

export const PropertyDetailDialog: React.FC<PropertyDetailDialogProps> = ({
  property,
  isOpen,
  onClose,
  onSave
}) => {
  const [formValues, setFormValues] = useState<Partial<RealEstateProperty>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (property) {
      setFormValues({
        id: property.id,
        site_name: property.site_name || '',
        address: property.address || '',
        market: property.market || '',
        phase: property.phase || null,
        sf_available: property.sf_available || '',
        zoning: property.zoning || '',
        permitted_use: property.permitted_use || '',
        phase_group: property.phase_group || '',
      });
    }
  }, [property]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePhaseChange = (value: PropertyPhase | '') => {
    const phaseValue = value === '' ? null : value;
    setFormValues(prev => ({ ...prev, phase: phaseValue }));
  };
  
  const handleSave = async () => {
    if (!property) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(formValues)
        .eq('id', property.id);
      
      if (error) throw error;
      
      await onSave(formValues);
      onClose();
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!property) {
    return (
      <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Loading property details...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{property?.site_name || 'Property Details'}</DialogTitle>
          <DialogDescription>
            Edit the property information below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="site_name" className="text-right">
              Name
            </Label>
            <Input
              id="site_name"
              name="site_name"
              value={formValues.site_name || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">
              Address
            </Label>
            <Input
              id="address"
              name="address"
              value={formValues.address || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="market" className="text-right">
              Market
            </Label>
            <Input
              id="market"
              name="market"
              value={formValues.market || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phase" className="text-right">
              Phase
            </Label>
            <div className="col-span-3">
              <PhaseSelector
                value={formValues.phase || undefined}
                onValueChange={handlePhaseChange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sf_available" className="text-right">
              SF Available
            </Label>
            <Input
              id="sf_available"
              name="sf_available"
              value={formValues.sf_available || ''}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status_notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="status_notes"
              name="status_notes"
              value={formValues.status_notes || ''}
              onChange={handleInputChange}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
