
import { CensusData, CensusResponse } from "@/types";
import { LoadingState } from "@/components/LoadingState";
import { CensusHeader } from "./census/CensusHeader";
import { CensusEmptyState } from "./census/CensusEmptyState";
import { CensusOverviewStats } from "./census/CensusOverviewStats";
import { CensusDetailedData } from "./census/CensusDetailedData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface CensusListProps {
  censusData: CensusData | null;
  censusResponse?: CensusResponse | null;
  isLoading: boolean;
  searchedAddress: string;
  onTryMockData?: () => void;
  isMockData?: boolean;
}

export const CensusList = ({ 
  censusData, 
  isLoading, 
  searchedAddress, 
  onTryMockData,
  isMockData,
  censusResponse 
}: CensusListProps) => {
  if (isLoading) {
    return <LoadingState message="Retrieving census data..." />;
  }

  if (!censusData && !isLoading) {
    return <CensusEmptyState 
      searchedAddress={searchedAddress} 
      onTryMockData={onTryMockData}
    />;
  }

  if (!censusData) {
    return null;
  }

  return (
    <div className="py-6 space-y-6">
      <CensusHeader searchedAddress={searchedAddress} />
      
      {isMockData && (
        <Alert className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertTitle>Using Demo Data</AlertTitle>
          <AlertDescription>
            Showing sample census data for demonstration purposes. This is not real data for the specified location.
          </AlertDescription>
        </Alert>
      )}
      
      {searchedAddress && censusData.totalPopulation && censusData.totalPopulation < 100 && !isMockData && (
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>Using Approximate Data</AlertTitle>
          <AlertDescription>
            The census data shown is for the Census tract containing this address. Census tracts are small statistical subdivisions of counties with 1,200-8,000 residents.
          </AlertDescription>
        </Alert>
      )}
      
      <CensusOverviewStats censusData={censusData} />
      <CensusDetailedData censusData={censusData} />
    </div>
  );
};
