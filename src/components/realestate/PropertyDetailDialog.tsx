
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RealEstateProperty } from '@/types/realEstate';
import { 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  Clipboard, 
  Calendar, 
  SquareCheck, 
  AlertCircle 
} from 'lucide-react';

interface PropertyDetailDialogProps {
  property: RealEstateProperty | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PropertyDetailDialog: React.FC<PropertyDetailDialogProps> = ({
  property,
  open,
  onOpenChange,
}) => {
  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{property.site_name || 'Property Details'}</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {property.address || 'No address available'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Property Information</h3>
            
            <div className="space-y-3">
              <div className="flex gap-x-2">
                <Building className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Market</p>
                  <p className="text-muted-foreground">{property.market || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Square Footage Available</p>
                  <p className="text-muted-foreground">{property.sf_available || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <Clipboard className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Zoning</p>
                  <p className="text-muted-foreground">{property.zoning || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <Clipboard className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Permitted Use</p>
                  <p className="text-muted-foreground">{property.permitted_use || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <Clipboard className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Parking</p>
                  <p className="text-muted-foreground">{property.parking || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
            
            <div className="space-y-3">
              <div className="flex gap-x-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Point of Contact</p>
                  <p className="text-muted-foreground">{property.ll_poc || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-muted-foreground">{property.ll_phone || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-muted-foreground">{property.ll_email || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold border-b pb-2 mt-6">Pipeline Status</h3>
            
            <div className="space-y-3">
              <div className="flex gap-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Current Phase</p>
                  <p className="text-muted-foreground">{property.phase || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <SquareCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Survey Status</p>
                  <p className="text-muted-foreground">{property.survey_status || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <SquareCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Test Fit Status</p>
                  <p className="text-muted-foreground">{property.test_fit_status || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <SquareCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">LOI Status</p>
                  <p className="text-muted-foreground">{property.loi_status || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-x-2">
                <SquareCheck className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">Lease Status</p>
                  <p className="text-muted-foreground">{property.lease_status || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {property.status_notes && (
          <div className="border-t pt-4 mt-2">
            <div className="flex gap-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="font-medium">Status Notes</p>
                <p className="text-muted-foreground whitespace-pre-line">{property.status_notes}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
