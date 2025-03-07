import React, { useState, useEffect, useMemo } from 'react';
import { useRealEstatePipeline } from '@/hooks/useRealEstatePipeline';
import { useCampuses } from '@/hooks/useCampuses';
import { PipelineColumn } from '@/components/realestate/PipelineColumn';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { LoadingState } from '@/components/LoadingState';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CampusSelector } from '@/components/salesforce/CampusSelector';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRealEstateSync } from '@/hooks/useReEstateSync';
import { useQueryClient } from '@tanstack/react-query';

const PHASES: PropertyPhase[] = [
  '0. New Site',
  '1. Initial Diligence',
  '2. Survey',
  '3. Test Fit',
  '4. Plan Production',
  '5. Permitting',
  '6. Construction',
  '7. Set Up',
  'Hold',
  'Deprioritize'
];

const PHASE_GROUPS = [
  'Diligence',
  'Pre Construction',
  'Construction',
  'Set Up',
  'Other'
];

const PHASE_TO_GROUP: Record<PropertyPhase, string> = {
  '0. New Site': 'Diligence',
  '1. Initial Diligence': 'Diligence',
  '2. Survey': 'Diligence',
  '3. Test Fit': 'Diligence',
  '4. Plan Production': 'Pre Construction',
  '5. Permitting': 'Pre Construction',
  '6. Construction': 'Construction',
  '7. Set Up': 'Set Up',
  'Hold': 'Other',
  'Deprioritize': 'Other'
};

const RealEstatePipeline: React.FC = () => {
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [selectedCampusNames, setSelectedCampusNames] = useState<string[]>([]);
  const { data: properties, isLoading, error, refetch } = useRealEstatePipeline({ campusId: selectedCampusIds.length === 1 ? selectedCampusIds[0] : null });
  const { data: campuses, isLoading: isLoadingCampuses } = useCampuses();
  const { isRefreshing, refreshRealEstateData } = useRealEstateSync();
  const queryClient = useQueryClient();
  
  const [defaultAccordionValue, setDefaultAccordionValue] = useState<string[]>(PHASE_GROUPS);

  const groupedProperties = useMemo(() => {
    if (!properties) return {};

    const grouped: Record<string, Record<string, RealEstateProperty[]>> = {};
    
    PHASE_GROUPS.forEach(group => {
      grouped[group] = {};
    });
    
    PHASES.forEach(phase => {
      const group = PHASE_TO_GROUP[phase];
      if (grouped[group]) {
        grouped[group][phase] = [];
      }
    });
    
    Object.keys(grouped).forEach(group => {
      grouped[group]["Unspecified"] = [];
    });
    
    properties.forEach(property => {
      let phaseGroup = property.phase_group;
      if (!phaseGroup && property.phase) {
        phaseGroup = PHASE_TO_GROUP[property.phase as PropertyPhase] || 'Unspecified';
      } else if (!phaseGroup) {
        phaseGroup = 'Unspecified';
      }
      
      const phase = property.phase || 'Unspecified';
      
      if (grouped[phaseGroup]) {
        if (!grouped[phaseGroup][phase]) {
          grouped[phaseGroup][phase] = [];
        }
        
        grouped[phaseGroup][phase].push(property);
      } else {
        grouped['Unspecified'] = grouped['Unspecified'] || {};
        grouped['Unspecified'][phase] = grouped['Unspecified'][phase] || [];
        grouped['Unspecified'][phase].push(property);
      }
    });
    
    return grouped;
  }, [properties]);

  const handleSelectCampuses = (campusIds: string[], campusNames: string[]) => {
    setSelectedCampusIds(campusIds);
    setSelectedCampusNames(campusNames);
  };

  const handleRefresh = async () => {
    await refreshRealEstateData();
    refetch();
  };

  useEffect(() => {
    if (selectedCampusIds.length > 0) {
      handleSelectCampuses(selectedCampusIds, selectedCampusNames);
    }
  }, [selectedCampusIds, selectedCampusNames]);

  if (isLoading || isLoadingCampuses) {
    return <LoadingState message="Loading pipeline data..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="text-destructive mb-2">Error loading pipeline data</div>
        <div className="text-sm text-muted-foreground">Please try again later</div>
      </div>
    );
  }

  const getGroupPropertyCount = (group: string) => {
    let count = 0;
    const phases = groupedProperties[group] || {};
    
    Object.keys(phases).forEach(phase => {
      count += phases[phase]?.length || 0;
    });
    
    return count;
  };

  const getTotalPropertyCount = () => {
    return PHASE_GROUPS.reduce((total, group) => total + getGroupPropertyCount(group), 0);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Real Estate Pipeline</h1>
          </div>
          <p className="text-white/80 mt-2">
            Manage and track properties through the real estate development pipeline
          </p>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {campuses && campuses.length > 0 && (
              <div>
                <CampusSelector 
                  campuses={campuses}
                  selectedCampusIds={selectedCampusIds}
                  onSelectCampuses={handleSelectCampuses}
                />
                
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedCampusNames.length > 0
                    ? `Showing ${getTotalPropertyCount()} properties for ${selectedCampusNames.join(', ')}` 
                    : `Showing all ${getTotalPropertyCount()} properties across all campuses`}
                </div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={defaultAccordionValue} className="space-y-4">
          {PHASE_GROUPS.map((phaseGroup) => {
            const phasesByGroup = PHASES.filter(phase => PHASE_TO_GROUP[phase] === phaseGroup);
            
            if (phasesByGroup.length === 0) return null;
            
            const propertyCount = getGroupPropertyCount(phaseGroup);
            
            if (propertyCount === 0 && selectedCampusIds) return null;
            
            return (
              <AccordionItem key={phaseGroup} value={phaseGroup} className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-semibold">{phaseGroup}</span>
                    <span className="text-sm text-muted-foreground mr-3">
                      {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {phasesByGroup.map(phase => (
                      <PipelineColumn
                        key={phase}
                        title={phase}
                        properties={groupedProperties[phaseGroup]?.[phase] || []}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </main>
    </div>
  );
};

export default RealEstatePipeline;
