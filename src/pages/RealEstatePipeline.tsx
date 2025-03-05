
import React, { useState, useMemo } from 'react';
import { useRealEstatePipeline } from '@/hooks/useRealEstatePipeline';
import { PipelineColumn } from '@/components/realestate/PipelineColumn';
import { PropertyDetailDialog } from '@/components/realestate/PropertyDetailDialog';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { LoadingState } from '@/components/LoadingState';
import { Building } from 'lucide-react';

// Define the common phases in order
const PHASES: PropertyPhase[] = [
  'Prospecting', 
  'Discovery', 
  'Qualification', 
  'Proposal', 
  'Negotiation', 
  'Contract', 
  'Closed'
];

const RealEstatePipeline: React.FC = () => {
  const { data: properties, isLoading, error } = useRealEstatePipeline();
  const [selectedProperty, setSelectedProperty] = useState<RealEstateProperty | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Group properties by phase
  const groupedProperties = useMemo(() => {
    if (!properties) return {};

    // First get all unique phases from actual data
    const uniquePhases = new Set<string>();
    properties.forEach(property => {
      if (property.phase) {
        uniquePhases.add(property.phase);
      }
    });

    // Create initial structure with standard phases
    const grouped: Record<string, RealEstateProperty[]> = {};
    
    // Add standard phases first in order
    PHASES.forEach(phase => {
      grouped[phase] = [];
    });

    // Then add any custom phases found in the data
    Array.from(uniquePhases).forEach(phase => {
      if (!grouped[phase]) {
        grouped[phase] = [];
      }
    });

    // Add an "Unspecified" category for properties without a phase
    grouped["Unspecified"] = [];

    // Now populate the groups
    properties.forEach(property => {
      if (property.phase) {
        grouped[property.phase].push(property);
      } else {
        grouped["Unspecified"].push(property);
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-8 gap-3">
        <Building className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">Real Estate Pipeline</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Object.entries(groupedProperties).map(([phase, phaseProperties]) => (
          <PipelineColumn
            key={phase}
            title={phase}
            properties={phaseProperties}
            onPropertyClick={handlePropertyClick}
          />
        ))}
      </div>

      <PropertyDetailDialog 
        property={selectedProperty}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default RealEstatePipeline;
