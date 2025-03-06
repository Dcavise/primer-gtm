
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  RealEstateProperty, 
  PropertyPhase, 
  BooleanStatus, 
  SurveyStatus, 
  TestFitStatus, 
  LeaseStatus,
  PropertyUIState,
  PropertyFormValues,
  StatusFormValues,
  ContactFormValues,
  LeaseFormValues
} from '@/types/realEstate';
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
  
  // Initialize UI state with default values
  const [uiState, setUIState] = useState<PropertyUIState>({
    fileRefreshKey: 0,
    isEditingNotes: false,
    isEditingPropertyInfo: false,
    isEditingStatusInfo: false,
    isEditingContactInfo: false,
    isEditingLeaseInfo: false,
    notesValue: '',
    isSavingNotes: false,
    isSavingPropertyInfo: false,
    isSavingStatusInfo: false,
    isSavingContactInfo: false,
    isSavingLeaseInfo: false
  });
  
  // Initialize form values for different sections
  const [propertyFormValues, setPropertyFormValues] = useState<PropertyFormValues>({
    phase: null,
    sf_available: null,
    zoning: null,
    permitted_use: null,
    parking: null,
    fire_sprinklers: null,
    fiber: null
  });
  
  const [statusFormValues, setStatusFormValues] = useState<StatusFormValues>({
    ahj_zoning_confirmation: null,
    ahj_building_records: null,
    survey_status: null,
    test_fit_status: null
  });
  
  const [contactFormValues, setContactFormValues] = useState<ContactFormValues>({
    ll_poc: null,
    ll_phone: null,
    ll_email: null
  });
  
  const [leaseFormValues, setLeaseFormValues] = useState<LeaseFormValues>({
    loi_status: null,
    lease_status: null
  });
  
  // Update a specific UI state field
  const updateUIState = (key: keyof PropertyUIState, value: any) => {
    setUIState(prev => ({ ...prev, [key]: value }));
  };

  // Fetch property data from database
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

  // Update form values when property data changes
  useEffect(() => {
    if (property) {
      updateUIState('notesValue', property.status_notes || '');
      
      setPropertyFormValues({
        phase: property.phase || null,
        sf_available: property.sf_available || null,
        zoning: property.zoning || null,
        permitted_use: property.permitted_use || null,
        parking: property.parking || null,
        fire_sprinklers: property.fire_sprinklers || null,
        fiber: property.fiber || null,
      });
      
      setStatusFormValues({
        ahj_zoning_confirmation: property.ahj_zoning_confirmation || null,
        ahj_building_records: property.ahj_building_records || null,
        survey_status: property.survey_status || null,
        test_fit_status: property.test_fit_status || null,
      });
      
      setContactFormValues({
        ll_poc: property.ll_poc || null,
        ll_phone: property.ll_phone || null,
        ll_email: property.ll_email || null,
      });
      
      setLeaseFormValues({
        loi_status: property.loi_status || null,
        lease_status: property.lease_status || null,
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
    updateUIState('fileRefreshKey', uiState.fileRefreshKey + 1);
  };

  // Input handlers for form sections
  const handlePropertyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'fire_sprinklers' || name === 'fiber') {
      const validValue: BooleanStatus = (value === 'true' || value === 'false' || value === 'unknown') ? value : null;
      setPropertyFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setPropertyFormValues(prev => ({ ...prev, [name]: value || null }));
    }
  };

  const handleStatusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ahj_zoning_confirmation') {
      const validValue: BooleanStatus = (value === 'true' || value === 'false' || value === 'unknown') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else if (name === 'survey_status') {
      const validValue: SurveyStatus = (value === 'complete' || value === 'pending' || value === 'unknown') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else if (name === 'test_fit_status') {
      const validValue: TestFitStatus = (value === 'unknown' || value === 'pending' || value === 'complete') ? value : null;
      setStatusFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setStatusFormValues(prev => ({ ...prev, [name]: value || null }));
    }
  };

  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactFormValues(prev => ({ ...prev, [name]: value || null }));
  };

  const handleLeaseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'loi_status' || name === 'lease_status') {
      const validValue: LeaseStatus = (value === 'pending' || value === 'sent' || value === 'signed') ? value : null;
      setLeaseFormValues(prev => ({ ...prev, [name]: validValue }));
    } else {
      setLeaseFormValues(prev => ({ ...prev, [name]: value || null }));
    }
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateUIState('notesValue', e.target.value);
  };

  // Edit/Save handlers
  const handleEditNotes = () => {
    updateUIState('isEditingNotes', true);
  };

  const handleCancelEditNotes = () => {
    if (property && property.status_notes) {
      updateUIState('notesValue', property.status_notes);
    } else {
      updateUIState('notesValue', '');
    }
    updateUIState('isEditingNotes', false);
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    
    updateUIState('isSavingNotes', true);
    try {
      // Only update the database field status_notes
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update({ status_notes: uiState.notesValue })
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving notes:', error);
        toast.error('Failed to save notes');
        return;
      }
      
      updateUIState('isEditingNotes', false);
      toast.success('Notes saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      updateUIState('isSavingNotes', false);
    }
  };

  const handleEditPropertyInfo = () => {
    updateUIState('isEditingPropertyInfo', true);
  };

  const handleCancelEditPropertyInfo = () => {
    if (property) {
      setPropertyFormValues({
        phase: property.phase || null,
        sf_available: property.sf_available || null,
        zoning: property.zoning || null,
        permitted_use: property.permitted_use || null,
        parking: property.parking || null,
        fire_sprinklers: property.fire_sprinklers || null,
        fiber: property.fiber || null,
      });
    }
    updateUIState('isEditingPropertyInfo', false);
  };

  const handleSavePropertyInfo = async () => {
    if (!id) return;
    
    updateUIState('isSavingPropertyInfo', true);
    try {
      // Extract database fields only
      const dbFields = extractDatabaseFields(propertyFormValues, [
        'phase', 'sf_available', 'zoning', 'permitted_use', 'parking', 'fire_sprinklers', 'fiber'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(dbFields)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving property info:', error);
        toast.error('Failed to save property information');
        return;
      }
      
      updateUIState('isEditingPropertyInfo', false);
      toast.success('Property information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving property info:', error);
      toast.error('Failed to save property information');
    } finally {
      updateUIState('isSavingPropertyInfo', false);
    }
  };

  const handleEditStatusInfo = () => {
    updateUIState('isEditingStatusInfo', true);
  };

  const handleCancelEditStatusInfo = () => {
    if (property) {
      setStatusFormValues({
        ahj_zoning_confirmation: property.ahj_zoning_confirmation || null,
        ahj_building_records: property.ahj_building_records || null,
        survey_status: property.survey_status || null,
        test_fit_status: property.test_fit_status || null,
      });
    }
    updateUIState('isEditingStatusInfo', false);
  };

  const handleSaveStatusInfo = async () => {
    if (!id) return;
    
    updateUIState('isSavingStatusInfo', true);
    try {
      // Extract database fields only
      const dbFields = extractDatabaseFields(statusFormValues, [
        'ahj_zoning_confirmation', 'ahj_building_records', 'survey_status', 'test_fit_status'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(dbFields)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving status info:', error);
        toast.error('Failed to save status information');
        return;
      }
      
      updateUIState('isEditingStatusInfo', false);
      toast.success('Status information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving status info:', error);
      toast.error('Failed to save status information');
    } finally {
      updateUIState('isSavingStatusInfo', false);
    }
  };

  const handleEditContactInfo = () => {
    updateUIState('isEditingContactInfo', true);
  };

  const handleCancelEditContactInfo = () => {
    if (property) {
      setContactFormValues({
        ll_poc: property.ll_poc || null,
        ll_phone: property.ll_phone || null,
        ll_email: property.ll_email || null,
      });
    }
    updateUIState('isEditingContactInfo', false);
  };

  const handleSaveContactInfo = async () => {
    if (!id) return;
    
    updateUIState('isSavingContactInfo', true);
    try {
      // For contact info, all fields go to the database
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(contactFormValues)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving contact info:', error);
        toast.error('Failed to save contact information');
        return;
      }
      
      updateUIState('isEditingContactInfo', false);
      toast.success('Contact information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast.error('Failed to save contact information');
    } finally {
      updateUIState('isSavingContactInfo', false);
    }
  };

  const handleEditLeaseInfo = () => {
    updateUIState('isEditingLeaseInfo', true);
  };

  const handleCancelEditLeaseInfo = () => {
    if (property) {
      setLeaseFormValues({
        loi_status: property.loi_status || null,
        lease_status: property.lease_status || null,
      });
    }
    updateUIState('isEditingLeaseInfo', false);
  };

  const handleSaveLeaseInfo = async () => {
    if (!id) return;
    
    updateUIState('isSavingLeaseInfo', true);
    try {
      // Extract database fields only
      const dbFields = extractDatabaseFields(leaseFormValues, [
        'loi_status', 'lease_status'
      ]);
      
      const { error } = await supabase
        .from('real_estate_pipeline')
        .update(dbFields)
        .eq('id', parseInt(id));
      
      if (error) {
        console.error('Error saving lease info:', error);
        toast.error('Failed to save lease information');
        return;
      }
      
      updateUIState('isEditingLeaseInfo', false);
      toast.success('Lease information saved successfully');
      refetch();
    } catch (error) {
      console.error('Error saving lease info:', error);
      toast.error('Failed to save lease information');
    } finally {
      updateUIState('isSavingLeaseInfo', false);
    }
  };

  // Helper function to extract and validate database fields from form values
  const extractDatabaseFields = <T extends Record<string, any>>(values: T, fields: string[]): Record<string, any> => {
    const dbFields: Record<string, any> = {};
    
    for (const key of fields) {
      if (key in values) {
        const value = values[key as keyof T];
        
        if (key === 'ahj_zoning_confirmation' || key === 'fire_sprinklers' || key === 'fiber') {
          dbFields[key] = (value === 'true' || value === 'false' || value === 'unknown') ? 
            value as BooleanStatus : null;
        } 
        else if (key === 'survey_status') {
          dbFields[key] = (value === 'complete' || value === 'pending' || value === 'unknown') ? 
            value as SurveyStatus : null;
        } 
        else if (key === 'test_fit_status') {
          dbFields[key] = (value === 'unknown' || value === 'pending' || value === 'complete') ? 
            value as TestFitStatus : null;
        } 
        else if (key === 'loi_status' || key === 'lease_status') {
          dbFields[key] = (value === 'pending' || value === 'sent' || value === 'signed') ? 
            value as LeaseStatus : null;
        } 
        else if (key === 'phase') {
          if (typeof value === 'string' && value.length > 0) {
            const propertyPhases: PropertyPhase[] = [
              '0. New Site', '1. Initial Diligence', '2. Survey', '3. Test Fit', 
              '4. Plan Production', '5. Permitting', '6. Construction', '7. Set Up', 
              'Hold', 'Deprioritize'
            ];
            
            dbFields[key] = propertyPhases.includes(value as PropertyPhase) ? 
              value as PropertyPhase : null;
          } else {
            dbFields[key] = null;
          }
        } 
        else {
          dbFields[key] = value;
        }
      }
    }
    
    return dbFields;
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
              isEditing={uiState.isEditingPropertyInfo}
              isSaving={uiState.isSavingPropertyInfo}
              formValues={propertyFormValues}
              onEdit={handleEditPropertyInfo}
              onCancel={handleCancelEditPropertyInfo}
              onSave={handleSavePropertyInfo}
              onInputChange={handlePropertyInputChange}
              onPhaseChange={handlePhaseChange}
            />

            <PropertyStatusInfo 
              property={property}
              isEditing={uiState.isEditingStatusInfo}
              isSaving={uiState.isSavingStatusInfo}
              formValues={statusFormValues}
              onEdit={handleEditStatusInfo}
              onCancel={handleCancelEditStatusInfo}
              onSave={handleSaveStatusInfo}
              onInputChange={handleStatusInputChange}
            />

            <PropertyNotes 
              property={property}
              isEditing={uiState.isEditingNotes}
              isSaving={uiState.isSavingNotes}
              notesValue={uiState.notesValue}
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
              isEditing={uiState.isEditingContactInfo}
              isSaving={uiState.isSavingContactInfo}
              formValues={contactFormValues}
              onEdit={handleEditContactInfo}
              onCancel={handleCancelEditContactInfo}
              onSave={handleSaveContactInfo}
              onInputChange={handleContactInputChange}
            />

            <PropertyDocuments 
              propertyId={property.id}
              fileRefreshKey={uiState.fileRefreshKey}
              onUploadComplete={handleFileUploadComplete}
            />

            <PropertyLeaseInfo 
              property={property}
              isEditing={uiState.isEditingLeaseInfo}
              isSaving={uiState.isSavingLeaseInfo}
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
