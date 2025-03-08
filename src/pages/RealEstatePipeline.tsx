import React, { useState, useEffect, useMemo } from 'react';
import { useRealEstatePipeline } from '@/features/realEstate/hooks/useRealEstatePipeline';
import { useCampuses } from '@/hooks/useCampuses';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';
import { LoadingState } from '@/components/LoadingState';
import { CampusSelector } from '@/features/salesforce/components/CampusSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

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
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [selectedCampusNames, setSelectedCampusNames] = useState<string[]>([]);
  const { data: properties, isLoading, error } = useRealEstatePipeline({ campusId: null });
  const { data: campuses, isLoading: isLoadingCampuses } = useCampuses();
  
  // Group properties by campus and phase
  const groupedByCampus = useMemo(() => {
    if (!properties || !campuses) return {};
    
    const grouped: Record<string, Record<PropertyPhase, RealEstateProperty[]>> = {};
    
    // Initialize the structure with all campuses and phases
    campuses.forEach(campus => {
      grouped[campus.id] = {} as Record<PropertyPhase, RealEstateProperty[]>;
      
      PHASES.forEach(phase => {
        grouped[campus.id][phase] = [];
      });
    });
    
    // Group properties by campus and phase
    properties.forEach(property => {
      const campusId = property.campus_id || 'unknown';
      const phase = property.phase || 'Unspecified';
      
      if (!grouped[campusId]) {
        grouped[campusId] = {} as Record<PropertyPhase, RealEstateProperty[]>;
        PHASES.forEach(p => {
          grouped[campusId][p] = [];
        });
      }
      
      if (!grouped[campusId][phase]) {
        grouped[campusId][phase] = [];
      }
      
      grouped[campusId][phase].push(property);
    });
    
    return grouped;
  }, [properties, campuses]);

  const handleSelectCampuses = (campusIds: string[], campusNames: string[]) => {
    setSelectedCampusIds(campusIds);
    setSelectedCampusNames(campusNames);
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
        <div className="text-red-600 mb-2">Error loading pipeline data</div>
        <div className="text-sm text-slate-gray">Please try again later</div>
      </div>
    );
  }

  // Filter campuses based on selection or show all
  const filteredCampuses = campuses?.filter(campus => 
    selectedCampusIds.length === 0 || selectedCampusIds.includes(campus.id)
  ) || [];

  return (
    <div className="min-h-screen bg-anti-flash">
      <header className="bg-gradient-to-r from-onyx to-outer-space text-seasalt py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Real Estate Pipeline</h1>
          </div>
          <p className="text-seasalt/80 mt-2">
            Manage and track properties through the real estate development pipeline
          </p>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto max-w-7xl">
        <div className="mb-6">
          {campuses && campuses.length > 0 && (
            <div>
              <CampusSelector 
                campuses={campuses}
                selectedCampusIds={selectedCampusIds}
                onSelectCampuses={handleSelectCampuses}
              />
              
              <div className="mt-2 text-sm text-slate-gray">
                {selectedCampusNames.length > 0
                  ? `Showing properties for ${selectedCampusNames.join(', ')}` 
                  : `Showing properties across all campuses`}
              </div>
            </div>
          )}
        </div>

        {/* Stages header row */}
        <div className="grid grid-cols-[200px_repeat(10,1fr)] gap-2 mb-4 overflow-x-auto">
          <div className="font-semibold p-2 text-eerie-black">Campus</div>
          {PHASES.map(phase => (
            <div key={phase} className="font-semibold p-2 text-center text-sm text-outer-space">
              {phase}
            </div>
          ))}
        </div>

        {/* Campus rows with properties by stage */}
        <div className="space-y-4">
          {filteredCampuses.map(campus => (
            <Card key={campus.id} className="overflow-hidden bg-seasalt border-platinum">
              <div className="grid grid-cols-[200px_repeat(10,1fr)] gap-2">
                {/* Campus name */}
                <div className="p-3 bg-platinum/50 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="font-medium truncate text-eerie-black">{campus.campus_name}</span>
                </div>
                
                {/* Property cells by phase */}
                {PHASES.map(phase => {
                  const phaseProperties = groupedByCampus[campus.id]?.[phase] || [];
                  return (
                    <div key={phase} className="p-2 border-l border-french-gray/30 min-h-[80px] flex flex-col items-center justify-center">
                      {phaseProperties.length > 0 ? (
                        <div className="w-full">
                          <Badge className="mb-1 w-full justify-center bg-anti-flash text-outer-space">
                            {phaseProperties.length}
                          </Badge>
                          <div className="text-xs text-center">
                            {phaseProperties.map(property => (
                              <div 
                                key={property.id} 
                                className="truncate p-1 hover:bg-platinum/50 rounded cursor-pointer text-outer-space"
                                title={property.address || 'No address'}
                              >
                                {property.address || 'Unnamed property'}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-gray">-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RealEstatePipeline;
