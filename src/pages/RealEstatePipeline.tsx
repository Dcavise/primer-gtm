
import React, { useState, useMemo } from 'react';
import { useRealEstatePipeline } from '@/hooks/useRealEstatePipeline';
import { PipelineColumn } from '@/components/realestate/PipelineColumn';
import { PropertyDetailDialog } from '@/components/realestate/PropertyDetailDialog';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { LoadingState } from '@/components/LoadingState';
import { Building } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

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

    // Then add any custom phases found in the data that aren't in our predefined list
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {Object.entries(groupedProperties)
            .sort(([phaseA], [phaseB]) => {
              // Sort columns according to the predefined order
              const indexA = PHASES.indexOf(phaseA as PropertyPhase);
              const indexB = PHASES.indexOf(phaseB as PropertyPhase);
              
              // Place predefined phases first in order, then unknown phases, then "Unspecified" last
              if (indexA === -1 && indexB === -1) {
                // Both are custom phases, sort alphabetically
                return phaseA === "Unspecified" ? 1 : phaseB === "Unspecified" ? -1 : phaseA.localeCompare(phaseB);
              }
              if (indexA === -1) return 1; // phaseA is custom, place after predefined
              if (indexB === -1) return -1; // phaseB is custom, place after predefined
              return indexA - indexB; // Both are predefined, sort by index
            })
            .map(([phase, phaseProperties]) => (
              <PipelineColumn
                key={phase}
                title={phase}
                properties={phaseProperties}
                onPropertyClick={handlePropertyClick}
              />
            ))
          }
        </div>

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
