import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { geocodeAddress, createBoundingBox } from "@/utils/geocoding";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, Loader2, Info } from "lucide-react";

interface SearchFormProps {
  onSearch: (params: any, address: string) => void;
  isSearching: boolean;
  searchType: "permits" | "zoning" | "census" | "schools";
}

export const SearchForm = ({ onSearch, isSearching, searchType }: SearchFormProps) => {
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please enter an address to search", {
        description: "The address field cannot be empty.",
      });
      return;
    }

    try {
      console.log(`Starting ${searchType} search for address: ${address.trim()}`);

      // For zoning searches, we can pass the address directly without geocoding
      if (searchType === "zoning") {
        console.log("Zoning search: using address directly without geocoding");
        toast.info(`Searching for zoning data at ${address.trim()}`);
        onSearch(address.trim(), address.trim());
        return;
      }

      // For other search types, we need to geocode first
      toast.info(`Searching for ${address.trim()}`, {
        description: "Looking up location coordinates...",
      });

      const geocodeResult = await geocodeAddress(address.trim());

      if (!geocodeResult) {
        console.error("Geocoding failed, cannot proceed with search");
        return; // Error is already handled in geocodeAddress
      }

      const { coordinates } = geocodeResult;
      toast.success(`Address found: ${geocodeResult.address}`, {
        description: `Searching for ${searchType} in this area...`,
      });

      // Different handling for different search types
      if (searchType === "schools") {
        // Just for schools
        onSearch(
          {
            lat: coordinates.lat,
            lon: coordinates.lng,
          },
          geocodeResult.address
        );
      } else if (searchType === "census") {
        // For census (which could use just address like zoning)
        onSearch(geocodeResult.address, geocodeResult.address);
      } else if (searchType === "permits") {
        // For permit searches, we use a very small bounding box
        const radiusInMeters = 10; // Very small radius (10 meters) to get exact matches only
        const { bottomLeft, topRight } = createBoundingBox(coordinates, radiusInMeters);

        onSearch(
          {
            bottom_left_lat: bottomLeft.lat,
            bottom_left_lng: bottomLeft.lng,
            top_right_lat: topRight.lat,
            top_right_lng: topRight.lng,
            exact_address: geocodeResult.address, // Pass the exact address for matching
          },
          geocodeResult.address
        );
      }
    } catch (error) {
      console.error(`Error in ${searchType} search:`, error);
      toast.error("Search failed", {
        description: `There was a problem with the ${searchType} search. Please try again.`,
      });
    }
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
          <p>
            {searchType === "census"
              ? "Census data shows demographic information within a 5-mile radius of the address."
              : searchType === "schools"
                ? "Find schools within a 5-mile radius of the property including ratings, contact info, and more."
                : 'For best results, include the full address with state and ZIP code (e.g., "831 N California Ave, Chicago, IL 60622")'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
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
              `Search ${
                searchType === "permits"
                  ? "Permits"
                  : searchType === "zoning"
                    ? "Zoning"
                    : searchType === "census"
                      ? "Census Data"
                      : "Schools"
              }`
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
