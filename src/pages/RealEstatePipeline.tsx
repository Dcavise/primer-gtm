
import React, { useState, useMemo } from 'react';
import { useRealEstatePipeline } from '@/hooks/useRealEstatePipeline';
import { PipelineColumn } from '@/components/realestate/PipelineColumn';
import { PropertyDetailDialog } from '@/components/realestate/PropertyDetailDialog';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { LoadingState } from '@/components/LoadingState';
import { Navbar } from '@/components/Navbar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Define the phases in the specific order shown in the image
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

// Define the phase groups and their display order
const PHASE_GROUPS = [
  'Diligence',
  'Pre Construction',
  'Construction',
  'Set Up',
  'Other'
];

// Define the mapping of phases to phase groups
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
  const { data: properties, isLoading, error } = useRealEstatePipeline();
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Default open state for accordion - all groups initially expanded
  const [defaultAccordionValue, setDefaultAccordionValue] = useState<string[]>(PHASE_GROUPS);

  // Group properties by phase_group and then by phase
  const groupedProperties = useMemo(() => {
    if (!properties) return {};

    // Create a structure to hold properties grouped by phase_group and then by phase
    const grouped: Record<string, Record<string, RealEstateProperty[]>> = {};
    
    // Initialize phase groups
    PHASE_GROUPS.forEach(group => {
      grouped[group] = {};
    });
    
    // Initialize phases within each group
    PHASES.forEach(phase => {
      const group = PHASE_TO_GROUP[phase];
      if (grouped[group]) {
        grouped[group][phase] = [];
      }
    });
    
    // Add an "Unspecified" category for properties without a phase
    Object.keys(grouped).forEach(group => {
      grouped[group]["Unspecified"] = [];
    });
    
    // Now populate the groups with properties
    properties.forEach(property => {
      // Use the property's phase_group if available, otherwise determine it from the phase
      let phaseGroup = property.phase_group;
      if (!phaseGroup && property.phase) {
        phaseGroup = PHASE_TO_GROUP[property.phase as PropertyPhase] || 'Unspecified';
      } else if (!phaseGroup) {
        phaseGroup = 'Unspecified';
      }
      
      const phase = property.phase || 'Unspecified';
      
      // If this phase group exists in our structure
      if (grouped[phaseGroup]) {
        // If this phase doesn't exist in this group yet, create it
        if (!grouped[phaseGroup][phase]) {
          grouped[phaseGroup][phase] = [];
        }
        
        // Add the property to its phase within its group
        grouped[phaseGroup][phase].push(property);
      } else {
        // If we encounter a phase group we haven't accounted for
        grouped['Unspecified'] = grouped['Unspecified'] || {};
        grouped['Unspecified'][phase] = grouped['Unspecified'][phase] || [];
        grouped['Unspecified'][phase].push(property);
      }
    });
    
    return grouped;
  }, [properties]);

  const handlePropertyClick = (property: RealEstateProperty) => {
    setSelectedProperty(property);
    setDialogOpen(true);
  };

  if (isLoading) {
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

  // Count total properties in each group for display
  const getGroupPropertyCount = (group: string) => {
    let count = 0;
    const phases = groupedProperties[group] || {};
    
    Object.keys(phases).forEach(phase => {
      count += phases[phase]?.length || 0;
    });
    
    return count;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Real Estate Pipeline</h1>
            <Navbar />
          </div>
          <p className="text-white/80 mt-2">
            Manage and track properties through the real estate development pipeline
          </p>
        </div>
      </header>

      <main className="container mx-auto py-6">
        {/* Collapsible Phase Groups using Accordion */}
        <Accordion type="multiple" defaultValue={defaultAccordionValue} className="space-y-4">
          {PHASE_GROUPS.map((phaseGroup) => {
            // Get all phases for this group
            const phasesByGroup = PHASES.filter(phase => PHASE_TO_GROUP[phase] === phaseGroup);
            
            // Only display groups that have defined phases
            if (phasesByGroup.length === 0) return null;
            
            const propertyCount = getGroupPropertyCount(phaseGroup);
            
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
                        onPropertyClick={handlePropertyClick}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {/* Property Detail Dialog */}
        <PropertyDetailDialog 
          property={selectedProperty}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </main>
    </div>
  );
};

export default RealEstatePipeline;
