
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
import { RealEstateProperty } from '@/types/realEstate';
import { supabase } from '@/integrations/supabase/client';
import { PhaseSelector } from './PhaseSelector';

interface PropertyDetailDialogProps {
  propertyId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const PropertyDetailDialog: React.FC<PropertyDetailDialogProps> = ({
  propertyId,
  isOpen,
  onClose,
  onSave
}) => {
  const [property, setProperty] = useState<RealEstateProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Partial<RealEstateProperty>>({});

  useEffect(() => {
    if (isOpen && propertyId) {
      fetchPropertyDetails();
    } else {
      setProperty(null);
      setFormValues({});
    }
  }, [isOpen, propertyId]);

  const fetchPropertyDetails = async () => {
    if (!propertyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (error) throw error;
      
      setProperty(data);
      setFormValues(data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handlePhaseChange = (value: string) => {
    setFormValues(prev => ({ ...prev, phase: value }));
  };

  const handleSave = async () => {
    if (!propertyId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(formValues)
        .eq('id', propertyId);
      
      if (error) throw error;
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating property:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
