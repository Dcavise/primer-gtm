
import { CensusData, CensusResponse } from "@/types";
import { LoadingState } from "@/components/LoadingState";
import { CensusHeader } from "./census/CensusHeader";
import { CensusEmptyState } from "./census/CensusEmptyState";
import { CensusOverviewStats } from "./census/CensusOverviewStats";
import { CensusDetailedData } from "./census/CensusDetailedData";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircleIcon } from "lucide-react";

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

  // Extract tract information from raw data if available
  const tractsInfo = censusData.rawData?.tractsInRadius ? 
    censusData.rawData.tractsInRadius.map(tract => ({
      state: tract.state,
      county: tract.county,
      tract: tract.tract,
      distance: tract.distance ? `${tract.distance.toFixed(2)} miles` : 'unknown'
    })) : [];

  // Extract block group information if available in the new approach
  const blockGroupsInfo = censusData.rawData?.blockGroupsInRadius ?
    censusData.rawData.blockGroupsInRadius.map(bg => ({
      state: bg.state,
      county: bg.county,
      tract: bg.tract,
      blockGroup: bg.blockGroup,
      distance: bg.distance ? `${bg.distance.toFixed(2)} miles` : 'unknown'
    })) : [];

  // Determine if we're using mock data - prioritize the response flag, then check other indicators
  const isUsingMockData = censusResponse?.isMockData === true || isMockData === true;

  return (
    <div className="py-6 space-y-6">
      <CensusHeader searchedAddress={searchedAddress} />
      
      {isUsingMockData && (
        <Alert className="bg-amber-50 border-amber-200">
          <InfoIcon className="h-4 w-4 text-amber-500" />
          <AlertTitle>Using Demo Data</AlertTitle>
          <AlertDescription>
            Showing sample census data for demonstration purposes. This is not real data for the specified location.
          </AlertDescription>
        </Alert>
      )}
      
      {searchedAddress && censusData.totalPopulation && censusData.totalPopulation < 100 && !isUsingMockData && (
        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertTitle>Using Approximate Data</AlertTitle>
          <AlertDescription>
            The census data shown is for the Census tract containing this address. Census tracts are small statistical subdivisions of counties with 1,200-8,000 residents.
          </AlertDescription>
        </Alert>
      )}

      {censusResponse && (
        <Alert className="bg-indigo-50 border-indigo-200">
          <InfoIcon className="h-4 w-4 text-indigo-500" />
          <AlertTitle>Census Data Source</AlertTitle>
          <AlertDescription>
            <div className="text-xs">
              {censusResponse.blockGroupsIncluded ? (
                <p>Data collected from {censusResponse.blockGroupsIncluded} census block group(s) within {censusResponse.radiusMiles} miles.</p>
              ) : (
                <p>Data collected from {censusResponse.tractsIncluded} census tract(s) within {censusResponse.radiusMiles} miles.</p>
              )}
              
              {blockGroupsInfo.length > 0 ? (
                <div className="mt-2">
                  <p className="font-semibold">Block groups used:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {blockGroupsInfo.map((bg, index) => (
                      <li key={index}>
                        State: {bg.state}, County: {bg.county}, Tract: {bg.tract}, Block Group: {bg.blockGroup}, Distance: {bg.distance}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : tractsInfo.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Tracts used:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {tractsInfo.map((tract, index) => (
                      <li key={index}>
                        State: {tract.state}, County: {tract.county}, Tract: {tract.tract}, Distance: {tract.distance}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <CensusOverviewStats censusData={censusData} />
      <CensusDetailedData censusData={censusData} />
    </div>
  );
};
