import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import PropertyHeader from '@/components/realestate/PropertyHeader';
import PropertyNotFound from '@/components/realestate/PropertyNotFound';
import PropertyBasicInfo from '@/components/realestate/PropertyBasicInfo';
import PropertyStatusInfo from '@/components/realestate/PropertyStatusInfo';
import PropertyNotes from '@/components/realestate/PropertyNotes';
import PropertyContactInfo from '@/components/realestate/PropertyContactInfo';
import PropertyLeaseInfo from '@/components/realestate/PropertyLeaseInfo';
import PropertyDocuments from '@/components/realestate/PropertyDocuments';
import PropertyDiscussion from '@/components/realestate/PropertyDiscussion';
import PropertyLocation from '@/components/realestate/PropertyLocation';
import PropertyProgress from '@/components/realestate/PropertyProgress';
import { mapPhaseToProgressStages } from '@/components/PropertyProgressStages';

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fileRefreshKey, setFileRefreshKey] = useState(0);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingPropertyInfo, setIsEditingPropertyInfo] = useState(false);
  const [isEditingStatusInfo, setIsEditingStatusInfo] = useState(false);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [isEditingLeaseInfo, setIsEditingLeaseInfo] = useState(false);
  
  const [notesValue, setNotesValue] = useState('');
  const [propertyFormValues, setPropertyFormValues] = useState<Partial<RealEstateProperty>>({});
  const [statusFormValues, setStatusFormValues] = useState<Partial<RealEstateProperty>>({});
  const [contactFormValues, setContactFormValues] = useState<Partial<RealEstateProperty>>({});
  const [leaseFormValues, setLeaseFormValues] = useState<Partial<RealEstateProperty>>({});
  
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingPropertyInfo, setIsSavingPropertyInfo] = useState(false);
  const [isSavingStatusInfo, setIsSavingStatusInfo] = useState(false);
  const [isSavingContactInfo, setIsSavingContactInfo] = useState(false);
  const [isSavingLeaseInfo, setIsSavingLeaseInfo] = useState(false);
  
  const { data: property, isLoading, error, refetch } = useQuery({
    queryKey: ['property', id],
    queryFn: async (): Promise<RealEstateProperty | null> => {
      if (!id) return null;
      
      console.log('Fetching property with id:', id);
      
      const propertyId = parseInt(id);
      
      if (isNaN(propertyId)) {
        console.error('Invalid property ID:', id);
        throw new Error(`Invalid property ID: ${id}`);
      }
      
      try {
        const { data, error } = await supabase
          .from('real_estate_pipeline')
          .select('*')
          .eq('id', propertyId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching property details:', error);
          throw new Error(`Failed to fetch property details: ${error.message}`);
        }
        
        if (!data) {
          console.error('Property not found with id:', id);
          return null;
        }
        
        console.log('Found property:', data);
        return data;
      } catch (error) {
        console.error('Error during property fetch:', error);
        return null;
      }
    }
  });

  useEffect(() => {
    if (property) {
      if (property.status_notes) {
        setNotesValue(property.status_notes);
      }
      
      setPropertyFormValues({
        phase: property.phase || null,
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
      });
      
      setContactFormValues({
        ll_poc: property.ll_poc || '',
        ll_phone: property.ll_phone || '',
        ll_email: property.ll_email || '',
      });
      
      setLeaseFormValues({
        loi_status: property.loi_status || '',
        lease_status: property.lease_status || '',
      });
    }
  }, [property]);

  const handleBackClick = () => {
    navigate('/real-estate-pipeline');
  };

  const handlePhaseChange = (value: PropertyPhase | '') => {
    const phaseValue = value === '' ? null : value;
    setPropertyFormValues(prev => ({ ...prev, phase: phaseValue }));
  };

  const handleFileUploadComplete = () => {
    setFileRefreshKey(prev => prev + 1);
  };

  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fire_sprinklers' || name === 'fiber') {
      const validValue = (value === 'true' || value === 'false' || value === 'unknown') ? value : null;
      setPropertyFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setPropertyFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ahj_zoning_confirmation') {
      const validValue = (value === 'true' || value === 'false' || value === 'unknown') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else if (name === 'survey_status') {
      const validValue = (value === 'complete' || value === 'pending' || value === 'unknown') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else if (name === 'test_fit_status') {
      const validValue = (value === 'unknown' || value === 'pending' || value === 'complete') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setStatusFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleLeaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'loi_status' || name === 'lease_status') {
      const validValue = (value === 'pending' || value === 'sent' || value === 'signed') ? value : null;
      setLeaseFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setLeaseFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotesValue(e.target.value);
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

  const handleEditPropertyInfo = () => {
    setIsEditingPropertyInfo(true);
  };

  const handleCancelEditPropertyInfo = () => {
    if (property) {
      setPropertyFormValues({
        phase: property.phase || null,
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
      const validatedValues = validateFormValues(propertyFormValues, [
        'phase', 'sf_available', 'zoning', 'permitted_use', 'parking', 'fire_sprinklers', 'fiber'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(validatedValues)
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
      });
    }
    setIsEditingStatusInfo(false);
  };

  const handleSaveStatusInfo = async () => {
    if (!id) return;
    
    setIsSavingStatusInfo(true);
    try {
      const validatedValues = validateFormValues(statusFormValues, [
        'ahj_zoning_confirmation', 'ahj_building_records', 'survey_status', 'test_fit_status'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(validatedValues)
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

  const handleEditLeaseInfo = () => {
    setIsEditingLeaseInfo(true);
  };

  const handleCancelEditLeaseInfo = () => {
    if (property) {
      setLeaseFormValues({
        loi_status: property.loi_status || '',
        lease_status: property.lease_status || '',
      });
    }
    setIsEditingLeaseInfo(false);
  };

  const handleSaveLeaseInfo = async () => {
    if (!id) return;
    
    setIsSavingLeaseInfo(true);
    try {
      const validatedValues = validateFormValues(leaseFormValues, [
        'loi_status', 'lease_status'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(validatedValues)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving lease info:', error);
        toast.error('Failed to save lease information');
        return;
      }
      
      setIsEditingLeaseInfo(false);
      toast.success('Lease information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving lease info:', error);
      toast.error('Failed to save lease information');
    } finally {
      setIsSavingLeaseInfo(false);
    }
  };

  const validateFormValues = (values: Partial<RealEstateProperty>, fields: string[]): Partial<RealEstateProperty> => {
    const validated: Partial<RealEstateProperty> = {};
    
    for (const key of fields) {
      if (key in values) {
        const value = values[key as keyof Partial<RealEstateProperty>];
        
        if (key === 'ahj_zoning_confirmation' || key === 'fire_sprinklers' || key === 'fiber') {
          validated[key as keyof Partial<RealEstateProperty>] = 
            (value === 'true' || value === 'false' || value === 'unknown') ? value : null;
        } else if (key === 'survey_status' || key === 'test_fit_status') {
          validated[key as keyof Partial<RealEstateProperty>] = 
            (value === 'complete' || value === 'pending' || value === 'unknown') ? value : null;
        } else if (key === 'loi_status' || key === 'lease_status') {
          validated[key as keyof Partial<RealEstateProperty>] = 
            (value === 'pending' || value === 'sent' || value === 'signed') ? value : null;
        } else {
          validated[key as keyof Partial<RealEstateProperty>] = value;
        }
      }
    }
    
    return validated;
  };

  if (isLoading) {
    return <LoadingState message="Loading property details..." />;
  }

  if (error || !property) {
    return <PropertyNotFound />;
  }

  const progressStages = property.phase ? mapPhaseToProgressStages(property.phase) : [];

  return (
    <div className="min-h-screen bg-background">
      <PropertyHeader property={property} />

      <main className="container mx-auto py-8 px-4">
        <Button variant="outline" onClick={handleBackClick} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
        </Button>
        
        {progressStages.length > 0 && (
          <PropertyProgress stages={progressStages} />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {property.address && (
              <PropertyLocation address={property.address} />
            )}

            <PropertyBasicInfo 
              property={property}
              isEditing={isEditingPropertyInfo}
              isSaving={isSavingPropertyInfo}
              formValues={propertyFormValues}
              onEdit={handleEditPropertyInfo}
              onCancel={handleCancelEditPropertyInfo}
              onSave={handleSavePropertyInfo}
              onInputChange={handlePropertyInputChange}
              onPhaseChange={handlePhaseChange}
            />

            <PropertyStatusInfo 
              property={property}
              isEditing={isEditingStatusInfo}
              isSaving={isSavingStatusInfo}
              formValues={statusFormValues}
              onEdit={handleEditStatusInfo}
              onCancel={handleCancelEditStatusInfo}
              onSave={handleSaveStatusInfo}
              onInputChange={handleStatusInputChange}
            />

            <PropertyNotes 
              property={property}
              isEditing={isEditingNotes}
              isSaving={isSavingNotes}
              notesValue={notesValue}
              onEdit={handleEditNotes}
              onCancel={handleCancelEditNotes}
              onSave={handleSaveNotes}
              onNotesChange={handleNotesChange}
            />

            <PropertyDiscussion propertyId={property.id} />
          </div>

          <div className="space-y-6">
            <PropertyContactInfo 
              property={property}
              isEditing={isEditingContactInfo}
              isSaving={isSavingContactInfo}
              formValues={contactFormValues}
              onEdit={handleEditContactInfo}
              onCancel={handleCancelEditContactInfo}
              onSave={handleSaveContactInfo}
              onInputChange={handleContactInputChange}
            />

            <PropertyDocuments 
              propertyId={property.id}
              fileRefreshKey={fileRefreshKey}
              onUploadComplete={handleFileUploadComplete}
            />

            <PropertyLeaseInfo 
              property={property}
              isEditing={isEditingLeaseInfo}
              isSaving={isSavingLeaseInfo}
              formValues={leaseFormValues}
              onEdit={handleEditLeaseInfo}
              onCancel={handleCancelEditLeaseInfo}
              onSave={handleSaveLeaseInfo}
              onInputChange={handleLeaseInputChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
