
import React, { useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Campus } from '@/hooks/use-salesforce-data';
import { marketCoordinates } from '@/utils/marketCoordinates';

interface MarketSelectorProps {
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
  campuses: Campus[];
  isLoading?: boolean;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({ 
  selectedMarketId, 
  onSelectMarket,
  campuses,
  isLoading = false
}) => {
  useEffect(() => {
    // Log for debugging
    console.log("All campuses:", campuses);
    console.log("Market coordinates keys:", Object.keys(marketCoordinates));
  }, [campuses]);

  // Modified to be more permissive in matching campuses to market coordinates
  const availableCampuses = campuses.filter(campus => {
    // Check if the campus ID matches any key in marketCoordinates (case insensitive)
    const matchById = Object.keys(marketCoordinates).some(key => 
      key.toLowerCase() === campus.campus_id.toLowerCase()
    );
    
    // Check if the campus name matches any name in marketCoordinates (case insensitive)
    const matchByName = Object.values(marketCoordinates).some(coords => 
      coords.name.toLowerCase().includes(campus.campus_name.toLowerCase()) ||
      campus.campus_name.toLowerCase().includes(coords.name.toLowerCase())
    );
    
    return matchById || matchByName;
  });
  
  // Log the filtered campuses
  console.log("Available campuses after filtering:", availableCampuses);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Select
          value={selectedMarketId}
          onValueChange={onSelectMarket}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={isLoading ? "Loading campuses..." : "Select market"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">All Markets</SelectItem>
            {availableCampuses.length > 0 ? (
              availableCampuses.map((campus) => (
                <SelectItem key={campus.campus_id} value={campus.campus_id}>
                  {campus.campus_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-markets" disabled>
                No markets available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {selectedMarketId !== 'default' 
            ? `Viewing ${campuses.find(c => c.campus_id === selectedMarketId)?.campus_name || 'selected market'}` 
            : 'Viewing all markets'}
        </span>
      </div>
    </div>
  );
};
