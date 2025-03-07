
import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Campus } from '@/types';
import { supabase } from '@/integrations/supabase-client';
import { Building, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampusIds: string[];
  onSelectCampuses: (campusIds: string[], campusNames: string[]) => void;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({ 
  campuses, 
  selectedCampusIds, 
  onSelectCampuses 
}) => {
  const [validCampuses, setValidCampuses] = useState<Campus[]>([]);
  const [filteredCampuses, setFilteredCampuses] = useState<Campus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  useEffect(() => {
    // Filter the campuses prop to only include campuses from the public.campuses table
    const filterValidCampuses = async () => {
      try {
        const { data, error } = await supabase
          .from('campuses')
          .select('campus_id, campus_name');
        
        if (error) {
          console.error('Error fetching valid campuses:', error);
          return;
        }
        
        // Only include campuses that exist in the public.campuses table
        const validCampusIds = data.map((c: any) => c.campus_id);
        const filteredCampuses = campuses.filter(campus => 
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
            updated_at: new Date().toISOString()
          }));
          
          setValidCampuses(formattedCampuses);
          setFilteredCampuses(formattedCampuses);
        }
      } catch (err) {
        console.error('Error processing campus data:', err);
      }
    };
    
    filterValidCampuses();
  }, [campuses]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCampuses(validCampuses);
    } else {
      const filtered = validCampuses.filter(campus => 
        campus.campus_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCampuses(filtered);
    }
  }, [searchQuery, validCampuses]);

  const handleCampusToggle = (campusId: string, checked: boolean) => {
    let newSelectedIds: string[];
    
    if (checked) {
      // Add campus to selection
      newSelectedIds = [...selectedCampusIds, campusId];
    } else {
      // Remove campus from selection
      newSelectedIds = selectedCampusIds.filter(id => id !== campusId);
    }
    
    // Get campus names for the selected IDs
    const selectedNames = validCampuses
      .filter(campus => newSelectedIds.includes(campus.campus_id))
      .map(campus => campus.campus_name);
    
    onSelectCampuses(newSelectedIds, selectedNames);
    
    // Update selectAll checkbox state
    setSelectAll(newSelectedIds.length === validCampuses.length);
  };

  const handleSelectAllToggle = (checked: boolean) => {
    setSelectAll(checked);
    
    if (checked) {
      // Select all campuses
      const allCampusIds = validCampuses.map(campus => campus.campus_id);
      const allCampusNames = validCampuses.map(campus => campus.campus_name);
      onSelectCampuses(allCampusIds, allCampusNames);
    } else {
      // Deselect all campuses
      onSelectCampuses([], []);
    }
  };

  const handleClearSelection = () => {
    setSelectAll(false);
    onSelectCampuses([], []);
  };

  const handleTogglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-6">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="rounded-md border border-slate-200 overflow-hidden shadow-sm"
      >
        <CollapsibleTrigger asChild onClick={handleTogglePanel}>
          <div className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Building className="h-5 w-5 text-slate-700" />
              <div>
                <h3 className="font-medium text-slate-800">Campus Selection</h3>
                <p className="text-sm text-slate-500">
                  {selectedCampusIds.length === 0 
                    ? 'No campuses selected' 
                    : selectedCampusIds.length === validCampuses.length 
                      ? 'All campuses selected' 
                      : `${selectedCampusIds.length} ${selectedCampusIds.length === 1 ? 'campus' : 'campuses'} selected`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {selectedCampusIds.length > 0 && selectedCampusIds.length < 3 && (
                <div className="flex gap-1 mr-2">
                  {validCampuses
                    .filter(campus => selectedCampusIds.includes(campus.campus_id))
                    .slice(0, 2)
                    .map(campus => (
                      <Badge key={campus.campus_id} variant="outline" className="bg-slate-100">
                        {campus.campus_name}
                      </Badge>
                    ))}
                  {selectedCampusIds.length > 2 && (
                    <Badge variant="outline" className="bg-slate-100">
                      +{selectedCampusIds.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex items-center mb-3 space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                  type="text" 
                  placeholder="Search campuses..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white border-slate-300 focus-visible:ring-slate-400"
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
            
            <div className="flex items-center gap-2 mb-3 p-2 bg-white rounded border border-slate-200">
              <Checkbox 
                id="select-all"
                checked={selectAll}
                onCheckedChange={(checked) => handleSelectAllToggle(!!checked)}
                className="data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
              />
              <Label htmlFor="select-all" className="font-medium">
                All Campuses
              </Label>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1">
              {filteredCampuses.length === 0 ? (
                <div className="text-center p-4 text-slate-500">
                  No campuses found matching "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredCampuses.map(campus => (
                    <div 
                      key={campus.campus_id} 
                      className={`flex items-center gap-2 p-2 rounded hover:bg-white transition-colors ${
                        selectedCampusIds.includes(campus.campus_id) ? 'bg-white border border-slate-200' : ''
                      }`}
                    >
                      <Checkbox 
                        id={campus.campus_id}
                        checked={selectedCampusIds.includes(campus.campus_id)}
                        onCheckedChange={(checked) => handleCampusToggle(campus.campus_id, !!checked)}
                        className="data-[state=checked]:bg-slate-700 data-[state=checked]:border-slate-700"
                      />
                      <Label 
                        htmlFor={campus.campus_id} 
                        className="truncate cursor-pointer"
                        title={campus.campus_name}
                      >
                        {campus.campus_name}
                      </Label>
                      {selectedCampusIds.includes(campus.campus_id) && (
                        <Check className="h-3.5 w-3.5 ml-auto text-slate-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-slate-500 p-2 bg-white rounded border border-slate-200">
              {selectedCampusIds.length === 0 
                ? 'No campuses selected - showing all data' 
                : selectedCampusIds.length === validCampuses.length 
                  ? 'Showing data for all campuses' 
                  : `Showing data for ${selectedCampusIds.length} selected ${selectedCampusIds.length === 1 ? 'campus' : 'campuses'}`
              }
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
