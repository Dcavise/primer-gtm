import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEstateProperty } from '@/types/realEstate';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { LoadingState } from '@/components/LoadingState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/FileUpload';
import { FileList } from '@/components/FileList';
import { Textarea } from '@/components/ui/textarea';
import { PropertyComments } from '@/components/PropertyComments';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  FileText,
  Calendar,
  Briefcase,
  Car,
  Check,
  AlertCircle,
  Flame,
  Wifi,
  FolderOpen,
  Save,
  Edit,
  X,
  LogIn
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const { data: property, isLoading, error, refetch } = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<RealEstateProperty | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .eq('id', parseInt(id))
        .single();
      
      if (error) {
        console.error('Error fetching property details:', error);
        throw new Error('Failed to fetch property details');
      }
      
      return data;
    }
  });

  React.useEffect(() => {
    if (property && property.status_notes) {
      setNotesValue(property.status_notes);
    }
  }, [property]);

  const handleBackClick = () => {
    navigate('/real-estate-pipeline');
  };

  const handleFileUploadComplete = () => {
    setFileRefreshKey(prev => prev + 1);
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleCancelEditNotes = () => {
    if (property && property.status_notes) {
      setNotesValue(property.status_notes);
    } else {
      setNotesValue('');
    }
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ status_notes: notesValue })
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving notes:', error);
        toast.error('Failed to save notes');
        return;
      }
      
      setIsEditingNotes(false);
      toast.success('Notes saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
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
            <div className="flex items-center gap-4">
              {!user && (
                <Button variant="secondary" size="sm" onClick={handleLogin}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              )}
              <Navbar />
            </div>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  Notes
                  <div className="space-x-2">
                    {isEditingNotes ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEditNotes}
                          disabled={isSavingNotes}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSaveNotes}
                          disabled={isSavingNotes}
                        >
                          {isSavingNotes ? (
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
                        onClick={handleEditNotes}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingNotes ? (
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Enter property notes here..."
                    className="min-h-[150px]"
                  />
                ) : (
                  <p className="whitespace-pre-line">{property.status_notes || 'No notes added yet.'}</p>
                )}
              </CardContent>
            </Card>

            <PropertyComments propertyId={property.id} />
          </div>

          <div className="space-y-6">
            <Card>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2" />
                  Document Repository
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FileUpload 
                  propertyId={property.id} 
                  onUploadComplete={handleFileUploadComplete} 
                />
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-sm mb-3">Uploaded Documents</h3>
                  <FileList 
                    key={fileRefreshKey}
                    propertyId={property.id} 
                    onFileDeleted={handleFileUploadComplete}
                  />
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
