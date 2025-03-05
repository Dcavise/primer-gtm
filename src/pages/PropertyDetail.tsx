
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEstateProperty } from '@/types/realEstate';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  FileText,
  Calendar,
  Briefcase,
  Parking,
  Check,
  AlertCircle,
  FlameIcon,
  Wifi
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<RealEstateProperty | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching property details:', error);
        throw new Error('Failed to fetch property details');
      }
      
      return data;
    }
  });

  const handleBackClick = () => {
    navigate('/real-estate-pipeline');
  };

  if (isLoading) {
    return <LoadingState message="Loading property details..." />;
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-2xl md:text-3xl font-semibold">Property Not Found</h1>
              <Navbar />
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4">
          <Button variant="outline" onClick={handleBackClick} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
          </Button>
          <div className="flex flex-col items-center justify-center h-[50vh]">
            <div className="text-destructive mb-2">Error loading property details</div>
            <div className="text-sm text-muted-foreground">The property could not be found</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold truncate">
              {property.site_name || 'Unnamed Property'}
            </h1>
            <Navbar />
          </div>
          {property.address && (
            <div className="flex items-center text-white/80">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{property.address}</span>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <Button variant="outline" onClick={handleBackClick} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Property Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  Property Information
                  {property.market && (
                    <Badge variant="outline" className="ml-2">
                      {property.market}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.phase && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phase</p>
                    <p className="font-medium">{property.phase}</p>
                  </div>
                )}
                {property.sf_available && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Available Space</p>
                    <p className="font-medium">{property.sf_available} sq ft</p>
                  </div>
                )}
                {property.zoning && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Zoning</p>
                    <p className="font-medium">{property.zoning}</p>
                  </div>
                )}
                {property.permitted_use && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Permitted Use</p>
                    <p className="font-medium">{property.permitted_use}</p>
                  </div>
                )}
                {property.parking && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Parking</p>
                    <p className="font-medium">{property.parking}</p>
                  </div>
                )}
                {property.fire_sprinklers && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fire Sprinklers</p>
                    <p className="font-medium">{property.fire_sprinklers}</p>
                  </div>
                )}
                {property.fiber && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Fiber</p>
                    <p className="font-medium">{property.fiber}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Status Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.ahj_zoning_confirmation && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">AHJ Zoning Confirmation</p>
                    <p className="font-medium">{property.ahj_zoning_confirmation}</p>
                  </div>
                )}
                {property.ahj_building_records && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">AHJ Building Records</p>
                    <p className="font-medium">{property.ahj_building_records}</p>
                  </div>
                )}
                {property.survey_status && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Survey Status</p>
                    <p className="font-medium">{property.survey_status}</p>
                  </div>
                )}
                {property.test_fit_status && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Test Fit Status</p>
                    <p className="font-medium">{property.test_fit_status}</p>
                  </div>
                )}
                {property.loi_status && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LOI Status</p>
                    <p className="font-medium">{property.loi_status}</p>
                  </div>
                )}
                {property.lease_status && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Lease Status</p>
                    <p className="font-medium">{property.lease_status}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {property.status_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line">{property.status_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.ll_poc && (
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-lg mb-2">Landlord Contact</h3>
                    <p className="mb-2">{property.ll_poc}</p>
                    {property.ll_phone && (
                      <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`tel:${property.ll_phone}`} className="text-primary hover:underline">
                          {property.ll_phone}
                        </a>
                      </div>
                    )}
                    {property.ll_email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <a href={`mailto:${property.ll_email}`} className="text-primary hover:underline truncate">
                          {property.ll_email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p>Property ID: {property.id}</p>
                  <p>Added on: {new Date(property.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
