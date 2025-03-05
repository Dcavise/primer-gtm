
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
import { toast } from 'sonner';
import MapEmbed from '@/components/MapEmbed';
import { Input } from '@/components/ui/input';
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
  Map
} from 'lucide-react';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  
  // Edit states for different sections
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingPropertyInfo, setIsEditingPropertyInfo] = useState(false);
  const [isEditingStatusInfo, setIsEditingStatusInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  
  // Form values
  const [notesValue, setNotesValue] = useState('');
  const [propertyFormValues, setPropertyFormValues] = useState<Partial<RealEstateProperty>>({});
  const [statusFormValues, setStatusFormValues] = useState<Partial<RealEstateProperty>>({});
  const [contactFormValues, setContactFormValues] = useState<Partial<RealEstateProperty>>({});
  
  // Saving states
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingPropertyInfo, setIsSavingPropertyInfo] = useState(false);
  const [isSavingStatusInfo, setIsSavingStatusInfo] = useState(false);
  const [isSavingContactInfo, setIsSavingContactInfo] = useState(false);
  
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
    if (property) {
      // Initialize all form values when property data is loaded
      if (property.status_notes) {
        setNotesValue(property.status_notes);
      }
      
      setPropertyFormValues({
        phase: property.phase || '',
        sf_available: property.sf_available || '',
        zoning: property.zoning || '',
        permitted_use: property.permitted_use || '',
        parking: property.parking || '',
        fire_sprinklers: property.fire_sprinklers || '',
        fiber: property.fiber || '',
      });
      
      setStatusFormValues({
        ahj_zoning_confirmation: property.ahj_zoning_confirmation || '',
        ahj_building_records: property.ahj_building_records || '',
        survey_status: property.survey_status || '',
        test_fit_status: property.test_fit_status || '',
        loi_status: property.loi_status || '',
        lease_status: property.lease_status || '',
      });
      
      setContactFormValues({
        ll_poc: property.ll_poc || '',
        ll_phone: property.ll_phone || '',
        ll_email: property.ll_email || '',
      });
    }
  }, [property]);

  const handleBackClick = () => {
    navigate('/real-estate-pipeline');
  };

  const handleFileUploadComplete = () => {
    setFileRefreshKey(prev => prev + 1);
  };

  // Handle form input changes
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPropertyFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStatusFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactFormValues(prev => ({ ...prev, [name]: value }));
  };

  // Notes section
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

  // Property info section
  const handleEditPropertyInfo = () => {
    setIsEditingPropertyInfo(true);
  };

  const handleCancelEditPropertyInfo = () => {
    if (property) {
      setPropertyFormValues({
        phase: property.phase || '',
        sf_available: property.sf_available || '',
        zoning: property.zoning || '',
        permitted_use: property.permitted_use || '',
        parking: property.parking || '',
        fire_sprinklers: property.fire_sprinklers || '',
        fiber: property.fiber || '',
      });
    }
    setIsEditingPropertyInfo(false);
  };

  const handleSavePropertyInfo = async () => {
    if (!id) return;
    
    setIsSavingPropertyInfo(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(propertyFormValues)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving property info:', error);
        toast.error('Failed to save property information');
        return;
      }
      
      setIsEditingPropertyInfo(false);
      toast.success('Property information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving property info:', error);
      toast.error('Failed to save property information');
    } finally {
      setIsSavingPropertyInfo(false);
    }
  };

  // Status info section
  const handleEditStatusInfo = () => {
    setIsEditingStatusInfo(true);
  };

  const handleCancelEditStatusInfo = () => {
    if (property) {
      setStatusFormValues({
        ahj_zoning_confirmation: property.ahj_zoning_confirmation || '',
        ahj_building_records: property.ahj_building_records || '',
        survey_status: property.survey_status || '',
        test_fit_status: property.test_fit_status || '',
        loi_status: property.loi_status || '',
        lease_status: property.lease_status || '',
      });
    }
    setIsEditingStatusInfo(false);
  };

  const handleSaveStatusInfo = async () => {
    if (!id) return;
    
    setIsSavingStatusInfo(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(statusFormValues)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving status info:', error);
        toast.error('Failed to save status information');
        return;
      }
      
      setIsEditingStatusInfo(false);
      toast.success('Status information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving status info:', error);
      toast.error('Failed to save status information');
    } finally {
      setIsSavingStatusInfo(false);
    }
  };

  // Contact info section
  const handleEditContactInfo = () => {
    setIsEditingContactInfo(true);
  };

  const handleCancelEditContactInfo = () => {
    if (property) {
      setContactFormValues({
        ll_poc: property.ll_poc || '',
        ll_phone: property.ll_phone || '',
        ll_email: property.ll_email || '',
      });
    }
    setIsEditingContactInfo(false);
  };

  const handleSaveContactInfo = async () => {
    if (!id) return;
    
    setIsSavingContactInfo(true);
    try {
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(contactFormValues)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving contact info:', error);
        toast.error('Failed to save contact information');
        return;
      }
      
      setIsEditingContactInfo(false);
      toast.success('Contact information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast.error('Failed to save contact information');
    } finally {
      setIsSavingContactInfo(false);
    }
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
            {/* Map Section */}
            {property.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Map className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MapEmbed address={property.address} />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  <div>Property Information</div>
                  <div className="space-x-2">
                    {isEditingPropertyInfo ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEditPropertyInfo}
                          disabled={isSavingPropertyInfo}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSavePropertyInfo}
                          disabled={isSavingPropertyInfo}
                        >
                          {isSavingPropertyInfo ? (
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
                        onClick={handleEditPropertyInfo}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
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
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phase</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="phase" 
                      value={propertyFormValues.phase} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter phase"
                    />
                  ) : (
                    <p className="font-medium">{property.phase || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Available Space</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="sf_available" 
                      value={propertyFormValues.sf_available} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter available square footage"
                    />
                  ) : (
                    <p className="font-medium">{property.sf_available ? `${property.sf_available} sq ft` : 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Zoning</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="zoning" 
                      value={propertyFormValues.zoning} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter zoning"
                    />
                  ) : (
                    <p className="font-medium">{property.zoning || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Permitted Use</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="permitted_use" 
                      value={propertyFormValues.permitted_use} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter permitted use"
                    />
                  ) : (
                    <p className="font-medium">{property.permitted_use || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Parking</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="parking" 
                      value={propertyFormValues.parking} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter parking details"
                    />
                  ) : (
                    <p className="font-medium">{property.parking || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fire Sprinklers</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="fire_sprinklers" 
                      value={propertyFormValues.fire_sprinklers} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter fire sprinkler details"
                    />
                  ) : (
                    <p className="font-medium">{property.fire_sprinklers || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fiber</p>
                  {isEditingPropertyInfo ? (
                    <Input 
                      name="fiber" 
                      value={propertyFormValues.fiber} 
                      onChange={handlePropertyInputChange}
                      placeholder="Enter fiber details"
                    />
                  ) : (
                    <p className="font-medium">{property.fiber || 'Not specified'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  <div>Status Information</div>
                  <div className="space-x-2">
                    {isEditingStatusInfo ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEditStatusInfo}
                          disabled={isSavingStatusInfo}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSaveStatusInfo}
                          disabled={isSavingStatusInfo}
                        >
                          {isSavingStatusInfo ? (
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
                        onClick={handleEditStatusInfo}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">AHJ Zoning Confirmation</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="ahj_zoning_confirmation" 
                      value={statusFormValues.ahj_zoning_confirmation} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter AHJ zoning confirmation"
                    />
                  ) : (
                    <p className="font-medium">{property.ahj_zoning_confirmation || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">AHJ Building Records</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="ahj_building_records" 
                      value={statusFormValues.ahj_building_records} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter AHJ building records"
                    />
                  ) : (
                    <p className="font-medium">{property.ahj_building_records || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Survey Status</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="survey_status" 
                      value={statusFormValues.survey_status} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter survey status"
                    />
                  ) : (
                    <p className="font-medium">{property.survey_status || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Test Fit Status</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="test_fit_status" 
                      value={statusFormValues.test_fit_status} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter test fit status"
                    />
                  ) : (
                    <p className="font-medium">{property.test_fit_status || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">LOI Status</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="loi_status" 
                      value={statusFormValues.loi_status} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter LOI status"
                    />
                  ) : (
                    <p className="font-medium">{property.loi_status || 'Not specified'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lease Status</p>
                  {isEditingStatusInfo ? (
                    <Input 
                      name="lease_status" 
                      value={statusFormValues.lease_status} 
                      onChange={handleStatusInputChange}
                      placeholder="Enter lease status"
                    />
                  ) : (
                    <p className="font-medium">{property.lease_status || 'Not specified'}</p>
                  )}
                </div>
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
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                  <div>Contact Information</div>
                  <div className="space-x-2">
                    {isEditingContactInfo ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEditContactInfo}
                          disabled={isSavingContactInfo}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleSaveContactInfo}
                          disabled={isSavingContactInfo}
                        >
                          {isSavingContactInfo ? (
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
                        onClick={handleEditContactInfo}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium text-lg mb-3">Landlord Contact</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                      {isEditingContactInfo ? (
                        <Input 
                          name="ll_poc" 
                          value={contactFormValues.ll_poc} 
                          onChange={handleContactInputChange}
                          placeholder="Enter contact name"
                        />
                      ) : (
                        <p className="font-medium">{property.ll_poc || 'Not specified'}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      {isEditingContactInfo ? (
                        <Input 
                          name="ll_phone" 
                          value={contactFormValues.ll_phone} 
                          onChange={handleContactInputChange}
                          placeholder="Enter phone number"
                          type="tel"
                        />
                      ) : (
                        property.ll_phone ? (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <a href={`tel:${property.ll_phone}`} className="text-primary hover:underline">
                              {property.ll_phone}
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No phone provided</p>
                        )
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      {isEditingContactInfo ? (
                        <Input 
                          name="ll_email" 
                          value={contactFormValues.ll_email} 
                          onChange={handleContactInputChange}
                          placeholder="Enter email address"
                          type="email"
                        />
                      ) : (
                        property.ll_email ? (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                            <a href={`mailto:${property.ll_email}`} className="text-primary hover:underline truncate">
                              {property.ll_email}
                            </a>
                          </div>
                        ) : (
                          <p className="text-muted-foreground italic">No email provided</p>
                        )
                      )}
                    </div>
                  </div>
                </div>
                
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
