
import { CensusData } from "@/hooks/use-census-data";
import { LoadingState } from "@/components/LoadingState";
import { CensusHeader } from "./census/CensusHeader";
import { CensusEmptyState } from "./census/CensusEmptyState";
import { CensusOverviewStats } from "./census/CensusOverviewStats";
import { CensusDetailedData } from "./census/CensusDetailedData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface CensusListProps {
  censusData: CensusData | null;
  isLoading: boolean;
  searchedAddress: string;
}

export const CensusList = ({ censusData, isLoading, searchedAddress }: CensusListProps) => {
  if (isLoading) {
    return <LoadingState message="Retrieving census data..." />;
  }

  if (!censusData && !isLoading) {
    return <CensusEmptyState searchedAddress={searchedAddress} />;
  }

  if (!censusData) {
    return null;
  }

  return (
    <div className="py-6 space-y-6">
      <CensusHeader searchedAddress={searchedAddress} />
      
      {searchedAddress && censusData.totalPopulation && censusData.totalPopulation < 100 && (
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>Using Approximate Data</AlertTitle>
          <AlertDescription>
            Due to Census API limitations, we're showing you census data from a nearby area that might not exactly match your address.
          </AlertDescription>
        </Alert>
      )}
      
      <CensusOverviewStats censusData={censusData} />
      <CensusDetailedData censusData={censusData} />
    </div>
  );
};
