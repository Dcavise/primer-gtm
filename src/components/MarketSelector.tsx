
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Campus } from '@/hooks/salesforce/types';

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
  // Sort campuses alphabetically by name
  const sortedCampuses = [...campuses].sort((a, b) => 
    a.campus_name.localeCompare(b.campus_name)
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Select
          value={selectedMarketId}
          onValueChange={onSelectMarket}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder={isLoading ? "Loading campuses..." : "Select campus"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">All Campuses</SelectItem>
            {sortedCampuses.length > 0 ? (
              sortedCampuses.map((campus) => (
                <SelectItem key={campus.campus_id} value={campus.campus_id}>
                  {campus.campus_name}{campus.State ? `, ${campus.State.trim()}` : ''}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-markets" disabled>
                No campuses available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {selectedMarketId !== 'default' 
            ? `Viewing ${campuses.find(c => c.campus_id === selectedMarketId)?.campus_name || 'selected campus'}` 
            : 'Viewing all campuses'}
        </span>
      </div>
    </div>
  );
};
