import React, { useState, useEffect, useMemo } from "react";
import { useRealEstatePipeline } from "@/features/realEstate/hooks/useRealEstatePipeline";
import { useCampuses } from "@/hooks/useCampuses";
import { RealEstateProperty, PropertyPhase } from "@/types/realEstate";

// Define interface for sample property data
interface SampleProperty {
  address: string;
  status: string;
  state: string;
  city: string;
}
import { LoadingState } from "@/components/LoadingState";
import { CampusSelector } from "@/features/salesforce/components/CampusSelector";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Calendar,
  CalendarDays,
  CircleCheck,
  Clock,
  ArrowRight,
  Plus,
  ChevronDown,
} from "lucide-react";

// Stages for the pipeline based on requirements
const STAGES = ["Diligence", "LOI", "Lease", "Build Out"];

// Define stage colors for visual distinction
const STAGE_COLORS = {
  Diligence: {
    bg: "bg-blue-100",
    text: "text-blue-600",
    border: "border-blue-200",
    add: "text-blue-500",
  },
  LOI: {
    bg: "bg-amber-100",
    text: "text-amber-600",
    border: "border-amber-200",
    add: "text-amber-500",
  },
  Lease: {
    bg: "bg-green-100",
    text: "text-green-600",
    border: "border-green-200",
    add: "text-green-500",
  },
  "Build Out": {
    bg: "bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
    add: "text-purple-500",
  },
};

// Sample property addresses for the new design with state and city information
const SAMPLE_ADDRESSES = {
  Diligence: [
    {
      address: "6007 111th Street East, Bradenton, FL 34211",
      status: "Site assessment",
      state: "Florida",
      city: "Bradenton",
    },
    {
      address: "4400 Mobile Hwy, Pensacola, FL 32609",
      status: "Financial modeling",
      state: "Florida",
      city: "Pensacola",
    },
    {
      address: "2301 McFarland Blvd E, Tuscaloosa, AL 35404",
      status: "Initial review",
      state: "Alabama",
      city: "Tuscaloosa",
    },
    {
      address: "7900 Eastern Blvd, Montgomery, AL 36117",
      status: "Financial modeling",
      state: "Alabama",
      city: "Montgomery",
    },
    {
      address: "2122 E Rio Salado Pkwy, Tempe, AZ 85281",
      status: "Site assessment",
      state: "Arizona",
      city: "Tempe",
    },
    {
      address: "7000 E Mayo Blvd, Phoenix, AZ 85054",
      status: "Initial review",
      state: "Arizona",
      city: "Phoenix",
    },
  ],
  LOI: [],
  Lease: [],
  "Build Out": [],
};

// City data by state for filtering
const CITIES_BY_STATE = {
  Florida: [
    "All Cities",
    "Bradenton",
    "Pensacola",
    "Miami",
    "Orlando",
    "Tampa",
  ],
  Alabama: [
    "All Cities",
    "Tuscaloosa",
    "Montgomery",
    "Birmingham",
    "Mobile",
    "Huntsville",
  ],
  Arizona: ["All Cities", "Phoenix", "Tempe", "Tucson", "Scottsdale", "Mesa"],
};

// All available states
const STATES = ["All States", "Florida", "Alabama", "Arizona"];

// Mapping old phases to new stages for compatibility
const mapPhaseToStage = (phase: PropertyPhase): string => {
  if (
    phase.startsWith("1.") ||
    phase.startsWith("2.") ||
    phase.startsWith("3.")
  )
    return "Diligence";
  if (phase.startsWith("4.")) return "LOI";
  if (phase.startsWith("5.")) return "Lease";
  if (phase.startsWith("6.") || phase.startsWith("7.")) return "Build Out";

  // Default to Diligence for any unmapped phases
  return "Diligence";
};

// Format date for display
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Get status detail based on property phase
const getStatusDetail = (phase: PropertyPhase | undefined): string => {
  if (!phase) return "Not started";

  if (phase.startsWith("1.")) return "Initial review";
  if (phase.startsWith("2.")) return "Site assessment";
  if (phase.startsWith("3.")) return "Financial modeling";
  if (phase.startsWith("4.")) return "Terms negotiation";
  if (phase.startsWith("5.")) return "Document preparation";
  if (phase.startsWith("6.")) return "Construction planning";
  if (phase.startsWith("7.")) return "Final preparations";

  return phase;
};

const RealEstatePipeline: React.FC = () => {
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [selectedCampusNames, setSelectedCampusNames] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedCity, setSelectedCity] = useState<string>("All Cities");
  const [availableCities, setAvailableCities] = useState<string[]>([
    "All Cities",
  ]);
  const {
    data: properties,
    isLoading,
    error,
  } = useRealEstatePipeline({ campusId: null });
  const { data: campuses, isLoading: isLoadingCampuses } = useCampuses();

  // Group properties by stage
  const groupedByStage = useMemo(() => {
    if (!properties) return {};

    const grouped: Record<string, RealEstateProperty[]> = {};

    // Initialize empty arrays for each stage
    STAGES.forEach((stage) => {
      grouped[stage] = [];
    });

    // Group properties by stage
    properties.forEach((property) => {
      const phase = property.phase || "Unspecified";
      const stage = mapPhaseToStage(phase as PropertyPhase);

      if (!grouped[stage]) {
        grouped[stage] = [];
      }

      grouped[stage].push(property);
    });

    return grouped;
  }, [properties]);

  const handleSelectCampuses = (campusIds: string[], campusNames: string[]) => {
    setSelectedCampusIds(campusIds);
    setSelectedCampusNames(campusNames);
  };

  useEffect(() => {
    if (selectedCampusIds.length > 0) {
      handleSelectCampuses(selectedCampusIds, selectedCampusNames);
    }
  }, [selectedCampusIds, selectedCampusNames]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState === "All States") {
      setAvailableCities(["All Cities"]);
    } else {
      setAvailableCities(CITIES_BY_STATE[selectedState] || ["All Cities"]);
    }
    setSelectedCity("All Cities"); // Reset city when state changes
  }, [selectedState]);

  // Handle state selection change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
  };

  // Handle city selection change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  // Filter properties based on selected campuses, state, and city
  const filteredProperties = useMemo(() => {
    // For demo purposes, we'll filter the sample data instead of actual properties
    const filtered: Record<string, SampleProperty[]> = {};

    // Initialize empty arrays for each stage
    STAGES.forEach((stage) => {
      filtered[stage] = [];
    });

    // Filter properties by state and city
    STAGES.forEach((stage) => {
      const stageProperties = SAMPLE_ADDRESSES[stage] || [];

      stageProperties.forEach((property) => {
        let includeProperty = true;

        // Filter by state if not "All States"
        if (
          selectedState !== "All States" &&
          property.state !== selectedState
        ) {
          includeProperty = false;
        }

        // Filter by city if not "All Cities"
        if (
          includeProperty &&
          selectedCity !== "All Cities" &&
          property.city !== selectedCity
        ) {
          includeProperty = false;
        }

        if (includeProperty) {
          filtered[stage].push(property);
        }
      });
    });

    return filtered;
  }, [selectedState, selectedCity]);

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

  return (
    <div className="min-h-screen bg-seasalt">
      <header className="border-b border-gray-200 pb-6 mb-8">
        <div className="container px-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Title removed as requested */}
          </div>
        </div>
      </header>

      <main className="container px-4 mx-auto max-w-7xl">
        <div className="mb-8">
          {/* State and City Filtering Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between p-5 bg-seasalt">
              <div className="flex items-center space-x-3 mb-3 md:mb-0">
                <MapPin className="h-5 w-5 text-slate-gray" />
                <div>
                  <h3 className="font-medium text-eerie-black">
                    Location Filter
                  </h3>
                  <p className="text-sm text-slate-gray">
                    {selectedState !== "All States"
                      ? selectedCity !== "All Cities"
                        ? `${selectedCity}, ${selectedState}`
                        : `All cities in ${selectedState}`
                      : "All locations"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* State Selector */}
                <div className="relative">
                  <div className="flex items-center relative">
                    <label
                      htmlFor="state-selector"
                      className="absolute left-3 text-sm font-medium text-slate-gray sr-only"
                    >
                      State:
                    </label>
                    <select
                      id="state-selector"
                      className="h-10 w-full min-w-[160px] border border-platinum rounded-md pl-4 pr-8 py-2 shadow-sm hover:border-french-gray focus:outline-none bg-white text-sm appearance-none"
                      value={selectedState}
                      onChange={handleStateChange}
                    >
                      {STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 h-4 w-4 pointer-events-none text-slate-gray" />
                  </div>
                </div>

                {/* City Selector - Only show if a specific state is selected */}
                {selectedState !== "All States" && (
                  <div className="relative">
                    <div className="flex items-center relative">
                      <label
                        htmlFor="city-selector"
                        className="absolute left-3 text-sm font-medium text-slate-gray sr-only"
                      >
                        City:
                      </label>
                      <select
                        id="city-selector"
                        className="h-10 w-full min-w-[160px] border border-platinum rounded-md pl-4 pr-8 py-2 shadow-sm hover:border-french-gray focus:outline-none bg-white text-sm appearance-none"
                        value={selectedCity}
                        onChange={handleCityChange}
                      >
                        {availableCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 h-4 w-4 pointer-events-none text-slate-gray" />
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="default"
                  className="gap-1.5 border-platinum bg-white shadow-sm hover:bg-platinum hover:text-outer-space"
                >
                  <Plus className="h-4 w-4" />
                  Add Property
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Kanban Board styled after the reference image */}
        <div className="bg-white px-4 py-4 rounded-lg border border-platinum shadow-sm">
          <div className="grid grid-cols-4 gap-6">
            {STAGES.map((stage) => {
              const stageColors = STAGE_COLORS[stage];
              return (
                <div key={stage} className="flex flex-col">
                  {/* Stage header with color coding */}
                  <div
                    className={`mb-3 px-3 py-1.5 flex items-center justify-between ${stageColors.bg} rounded-md`}
                  >
                    <h3 className={`text-sm font-medium ${stageColors.text}`}>
                      {stage}
                    </h3>
                    <div className="flex items-center">
                      <span className={`text-xs ${stageColors.text}`}>
                        {filteredProperties[stage]?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Properties column */}
                  <div className="space-y-2">
                    {filteredProperties[stage]?.length > 0 ? (
                      // Show filtered properties for the stage
                      filteredProperties[stage].map((property, index) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-md shadow-sm hover:shadow transition-all cursor-pointer relative overflow-hidden mb-3"
                        >
                          <div className="p-3">
                            {/* Property name (bold, prominent) */}
                            <h4 className="font-medium text-gray-800 mb-1 text-sm">
                              {property.address}
                            </h4>

                            {/* Status detail (smaller text) */}
                            <p className="text-xs text-gray-500 mb-1">
                              {property.status}
                            </p>

                            {/* Color-coded tag for the stage - simplified to match reference image */}
                            <div className="mt-2 pt-1 border-t border-gray-100">
                              <span
                                className={`inline-block text-xs ${stageColors.text}`}
                              >
                                {stage}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-16 my-4 text-center">
                        <p className={`text-sm ${stageColors.text}`}>
                          No properties
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add property button removed */}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RealEstatePipeline;
