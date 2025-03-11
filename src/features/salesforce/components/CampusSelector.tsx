import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Campus } from "@/types";
import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";
import { Building, Check, ChevronDown, ChevronUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { handleError, tryCatch } from "@/utils/error-handler";

interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampusIds: string[];
  onSelectCampuses: (campusIds: string[], campusNames: string[]) => void;
}

/**
 * Campus selection component for filtering data by campus
 */
export const CampusSelector: React.FC<CampusSelectorProps> = memo(
  ({ campuses, selectedCampusIds, onSelectCampuses }) => {
    const [validCampuses, setValidCampuses] = useState<Campus[]>([]);
    const [filteredCampuses, setFilteredCampuses] = useState<Campus[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectAll, setSelectAll] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Fetch and filter valid campuses from database - runs once when component mounts or when campuses change
    useEffect(() => {
      const filterValidCampuses = async () => {
        await tryCatch(
          async () => {
            const { data, error } = await supabase
              .from("campuses")
              .select("campus_id, campus_name");

            if (error) {
              throw error;
            }

            // Only include campuses that exist in the public.campuses table
            const validCampusIds = data.map((c: any) => c.campus_id);
            const filteredCampuses = campuses.filter((campus) =>
              validCampusIds.includes(campus.campus_id)
            );

            // If no matching campuses were found in the props, use the data from the database
            // but ensure we properly map to the Campus type
            if (filteredCampuses.length > 0) {
              setValidCampuses(filteredCampuses);
              setFilteredCampuses(filteredCampuses);
            } else {
              // Create properly typed Campus objects
              const formattedCampuses: Campus[] = data.map((c: any) => ({
                id: c.campus_id, // Use campus_id as id to satisfy the Campus type
                campus_id: c.campus_id,
                campus_name: c.campus_name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }));

              setValidCampuses(formattedCampuses);
              setFilteredCampuses(formattedCampuses);
            }
          },
          "Failed to load campus data",
          true,
          { context: "CampusSelector.filterValidCampuses" }
        );
      };

      filterValidCampuses();
    }, [campuses]);

    // Filter campuses based on search query
    useEffect(() => {
      if (searchQuery.trim() === "") {
        setFilteredCampuses(validCampuses);
      } else {
        const searchTermLower = searchQuery.toLowerCase();
        const filtered = validCampuses.filter((campus) =>
          campus.campus_name.toLowerCase().includes(searchTermLower)
        );
        setFilteredCampuses(filtered);
      }
    }, [searchQuery, validCampuses]);

    // Memoized handler to toggle individual campus selection
    const handleCampusToggle = useCallback(
      (campusId: string, checked: boolean) => {
        let newSelectedIds: string[];

        if (checked) {
          // Add campus to selection
          newSelectedIds = [...selectedCampusIds, campusId];
        } else {
          // Remove campus from selection
          newSelectedIds = selectedCampusIds.filter((id) => id !== campusId);
        }

        // Get campus names for the selected IDs
        const selectedNames = validCampuses
          .filter((campus) => newSelectedIds.includes(campus.campus_id))
          .map((campus) => campus.campus_name);

        onSelectCampuses(newSelectedIds, selectedNames);

        // Update selectAll checkbox state
        setSelectAll(newSelectedIds.length === validCampuses.length);
      },
      [selectedCampusIds, validCampuses, onSelectCampuses]
    );

    // Memoized handler to toggle "select all" state
    const handleSelectAllToggle = useCallback(
      (checked: boolean) => {
        setSelectAll(checked);

        if (checked) {
          // Select all campuses
          const allCampusIds = validCampuses.map((campus) => campus.campus_id);
          const allCampusNames = validCampuses.map((campus) => campus.campus_name);
          onSelectCampuses(allCampusIds, allCampusNames);
        } else {
          // Deselect all campuses
          onSelectCampuses([], []);
        }
      },
      [validCampuses, onSelectCampuses]
    );

    // Memoized handler to clear selection
    const handleClearSelection = useCallback(() => {
      setSelectAll(false);
      onSelectCampuses([], []);
    }, [onSelectCampuses]);

    // Memoized handler to toggle panel expansion
    const handleTogglePanel = useCallback(() => {
      setIsOpen((prevState) => !prevState);
    }, []);

    // Memoized handler for search input changes
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    }, []);

    // Memoized selection summary text
    const selectionSummary = useMemo(() => {
      if (selectedCampusIds.length === 0) {
        return "No campuses selected";
      } else if (selectedCampusIds.length === validCampuses.length) {
        return "All campuses selected";
      } else {
        return `${selectedCampusIds.length} ${selectedCampusIds.length === 1 ? "campus" : "campuses"} selected`;
      }
    }, [selectedCampusIds.length, validCampuses.length]);

    // Memoized footer text
    const footerText = useMemo(() => {
      if (selectedCampusIds.length === 0) {
        return "No campuses selected - showing all data";
      } else if (selectedCampusIds.length === validCampuses.length) {
        return "Showing data for all campuses";
      } else {
        return `Showing data for ${selectedCampusIds.length} selected ${selectedCampusIds.length === 1 ? "campus" : "campuses"}`;
      }
    }, [selectedCampusIds.length, validCampuses.length]);

    // Memoized selected campus badges
    const selectedCampusBadges = useMemo(() => {
      if (selectedCampusIds.length === 0 || selectedCampusIds.length >= 3) {
        return null;
      }

      return (
        <div className="flex gap-1 mr-2">
          {validCampuses
            .filter((campus) => selectedCampusIds.includes(campus.campus_id))
            .slice(0, 2)
            .map((campus) => (
              <Badge key={campus.campus_id} variant="outline" className="bg-anti-flash">
                {campus.campus_name}
              </Badge>
            ))}
          {selectedCampusIds.length > 2 && (
            <Badge variant="outline" className="bg-anti-flash">
              +{selectedCampusIds.length - 2} more
            </Badge>
          )}
        </div>
      );
    }, [selectedCampusIds, validCampuses]);

    // Memoized campus grid items
    const campusGridItems = useMemo(() => {
      return filteredCampuses.map((campus) => (
        <div
          key={campus.campus_id}
          className={`flex items-center gap-2 p-2 rounded hover:bg-seasalt transition-colors ${
            selectedCampusIds.includes(campus.campus_id) ? "bg-seasalt border border-platinum" : ""
          }`}
        >
          <Checkbox
            id={campus.campus_id}
            checked={selectedCampusIds.includes(campus.campus_id)}
            onCheckedChange={(checked) => handleCampusToggle(campus.campus_id, !!checked)}
            className="data-[state=checked]:bg-onyx data-[state=checked]:border-onyx"
          />
          <Label
            htmlFor={campus.campus_id}
            className="truncate cursor-pointer"
            title={campus.campus_name}
          >
            {campus.campus_name}
          </Label>
          {selectedCampusIds.includes(campus.campus_id) && (
            <Check className="h-3.5 w-3.5 ml-auto text-slate-gray" />
          )}
        </div>
      ));
    }, [filteredCampuses, selectedCampusIds, handleCampusToggle]);

    return (
      <div className="mb-6">
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className="rounded-md border border-slate-200 overflow-hidden shadow-sm"
        >
          <CollapsibleTrigger asChild onClick={handleTogglePanel}>
            <div className="flex items-center justify-between p-4 bg-seasalt cursor-pointer hover:bg-anti-flash transition-colors">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-outer-space" />
                <div>
                  <h3 className="font-medium text-eerie-black">Campus Selection</h3>
                  <p className="text-sm text-slate-gray">{selectionSummary}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {selectedCampusIds.length > 0 &&
                  selectedCampusIds.length < 3 &&
                  selectedCampusBadges}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-slate-gray" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-gray" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="p-4 bg-anti-flash border-t border-platinum">
              <div className="flex items-center mb-3 space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-gray" />
                  <Input
                    type="text"
                    placeholder="Search campuses..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-9 bg-seasalt border-french-gray focus-visible:ring-slate-gray"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  disabled={selectedCampusIds.length === 0}
                  className="text-sm whitespace-nowrap"
                >
                  Clear
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-3 p-2 bg-seasalt rounded border border-platinum">
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={(checked) => handleSelectAllToggle(!!checked)}
                  className="data-[state=checked]:bg-onyx data-[state=checked]:border-onyx"
                />
                <Label htmlFor="select-all" className="font-medium">
                  All Campuses
                </Label>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1">
                {filteredCampuses.length === 0 ? (
                  <div className="text-center p-4 text-slate-gray">
                    No campuses found matching "{searchQuery}"
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{campusGridItems}</div>
                )}
              </div>

              <div className="mt-4 text-sm text-slate-gray p-2 bg-seasalt rounded border border-platinum">
                {footerText}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }
);
