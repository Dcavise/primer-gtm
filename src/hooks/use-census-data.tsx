
import { useState } from 'react';
import { supabase } from '@/integrations/supabase-client';
import { toast } from 'sonner';

export type CensusCategory = {
  name: string;
  value: string;
};

export type CensusData = {
  totalPopulation: number;
  medianHouseholdIncome: number;
  medianHomeValue: number;
  educationLevelHS: number;
  educationLevelBachelor: number;
  unemploymentRate: number;
  povertyRate: number;
  medianAge: number;
  categories: {
    demographic: CensusCategory[];
    economic: CensusCategory[];
    housing: CensusCategory[];
    education: CensusCategory[];
  };
};

export type CensusStatus = 'idle' | 'loading' | 'success' | 'error';

export const useCensusData = () => {
  const [censusData, setCensusData] = useState<CensusData | null>(null);
  const [status, setStatus] = useState<CensusStatus>('idle');
  const [searchedAddress, setSearchedAddress] = useState('');
  const [isMockData, setIsMockData] = useState(false);

  const fetchCensusData = async (address: string) => {
    try {
      setStatus('loading');
      console.log('Fetching census data for address:', address);

      const { data, error } = await supabase.functions.invoke('census-data', {
        body: { address }
      });

      if (error) {
        console.error('Error fetching census data:', error);
        setStatus('error');
        toast.error('Error retrieving census data', {
          description: error.message || 'Please try again later'
        });
        return;
      }

      if (data) {
        console.log('Census data received:', data);
        setCensusData(data.data);
        setSearchedAddress(data.searchedAddress || address);
        setIsMockData(data.isMockData || false);
        setStatus('success');

        if (data.isMockData) {
          toast.warning('Using estimated census data', {
            description: data.error || 'Unable to find precise data for this location'
          });
        } else {
          const tractsMessage = data.tractsIncluded ? `Including ${data.tractsIncluded} census tracts` : '';
          const blocksMessage = data.blockGroupsIncluded ? `${data.blockGroupsIncluded} block groups` : '';
          const radiusMessage = data.radiusMiles ? `${data.radiusMiles} mile radius` : '';
          
          const details = [tractsMessage, blocksMessage, radiusMessage]
            .filter(msg => msg.length > 0)
            .join(', ');

          toast.success('Census data retrieved', {
            description: details ? `Data covers ${details}` : 'Based on the provided address'
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching census data:', err);
      setStatus('error');
      toast.error('Error retrieving census data', {
        description: 'An unexpected error occurred, please try again'
      });
    }
  };

  const reset = () => {
    setCensusData(null);
    setStatus('idle');
    setSearchedAddress('');
    setIsMockData(false);
  };

  return {
    censusData,
    status,
    searchedAddress,
    isMockData,
    fetchCensusData,
    reset
  };
};
