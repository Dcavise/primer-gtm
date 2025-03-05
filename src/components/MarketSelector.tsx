
import React from 'react';
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
  // Filter out campuses that don't have matching coordinates in the marketCoordinates object
  const availableCampuses = campuses.filter(campus => 
    Object.keys(marketCoordinates).some(key => 
      key.toLowerCase() === campus.campus_id.toLowerCase() || 
      marketCoordinates[key].name.toLowerCase() === campus.campus_name.toLowerCase()
    )
  );

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
            {availableCampuses.map((campus) => (
              <SelectItem key={campus.campus_id} value={campus.campus_id}>
                {campus.campus_name}
              </SelectItem>
            ))}
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
