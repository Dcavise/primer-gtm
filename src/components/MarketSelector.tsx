
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { marketCoordinates } from '@/utils/marketCoordinates';

interface MarketSelectorProps {
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({ 
  selectedMarketId, 
  onSelectMarket 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Select
          value={selectedMarketId}
          onValueChange={onSelectMarket}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select market" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">All Markets</SelectItem>
            {Object.entries(marketCoordinates).map(([key, market]) => (
              key !== 'default' && (
                <SelectItem key={key} value={key}>
                  {market.name}
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {selectedMarketId !== 'default' 
            ? `Viewing ${marketCoordinates[selectedMarketId]?.name}` 
            : 'Viewing all markets'}
        </span>
      </div>
    </div>
  );
};
