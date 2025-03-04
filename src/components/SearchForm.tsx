
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeAddress, createBoundingBox } from "@/utils/geocoding";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, Loader2, Info } from "lucide-react";

interface SearchFormProps {
  onSearch: (
    params: {
      top_right_lat: number;
      top_right_lng: number;
      bottom_left_lat: number;
      bottom_left_lng: number;
    } | string,
    address: string
  ) => void;
  isSearching: boolean;
  searchType: "permits" | "zoning";
}

export const SearchForm = ({ onSearch, isSearching, searchType }: SearchFormProps) => {
  const [address, setAddress] = useState("");
  const [searchRadius, setSearchRadius] = useState(650); // Default radius in feet (about 200 meters)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.trim()) {
      toast.error("Please enter an address to search", {
        description: "The address field cannot be empty."
      });
      return;
    }
    
    // For zoning searches, we pass the address directly
    if (searchType === "zoning") {
      onSearch(address.trim(), address.trim());
      return;
    }
    
    // For permit searches, we use geocoding and bounding box
    const geocodeResult = await geocodeAddress(address.trim());
    
    if (!geocodeResult) return; // Error is already handled in geocodeAddress
    
    const { coordinates } = geocodeResult;
    toast.success(`Address found: ${geocodeResult.address}`, {
      description: `Searching for ${searchType} in this area...`
    });
    
    // Convert feet to meters for the bounding box calculation
    const radiusInMeters = searchRadius * 0.3048;
    const { bottomLeft, topRight } = createBoundingBox(coordinates, radiusInMeters);
    
    onSearch({
      bottom_left_lat: bottomLeft.lat,
      bottom_left_lng: bottomLeft.lng,
      top_right_lat: topRight.lat,
      top_right_lng: topRight.lng
    }, geocodeResult.address);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="relative">
          <Input
            className="h-12 pl-10 pr-4 bg-white/20 border-white/30 focus:border-white/50 focus:ring-1 focus:ring-white/50 text-white placeholder:text-white/70 text-base"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter a full address (e.g., 123 Main St, City, State, ZIP)"
            disabled={isSearching}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-5 w-5" />
        </div>
        
        <div className="bg-white/10 p-3 rounded-md text-sm text-white/80 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>For best results, include the full address with state and ZIP code (e.g., "831 N California Ave, Chicago, IL 60622")</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {searchType === "permits" && (
            <div className="flex-1">
              <label className="text-sm text-white/80 mb-1 block">Search Radius (feet)</label>
              <Input
                type="range"
                min="150"
                max="1650"
                step="150"
                value={searchRadius}
                onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                className="w-full accent-white"
                disabled={isSearching}
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>150ft</span>
                <span>{searchRadius}ft</span>
                <span>1650ft</span>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="h-12 px-8 transition-all bg-white text-blue-600 hover:bg-white/90"
            disabled={isSearching || !address.trim()}
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              `Search ${searchType === "permits" ? "Permits" : "Zoning"}`
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
