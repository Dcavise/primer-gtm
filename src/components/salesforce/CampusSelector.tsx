
import React, { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Campus } from '@/hooks/salesforce/types';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectAll, setSelectAll] = useState<boolean>(true);
  
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
        }
        
        console.log('Valid campuses for selector:', validCampuses);
      } catch (err) {
        console.error('Error processing campus data:', err);
      }
    };
    
    filterValidCampuses();
  }, [campuses]);

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

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3">Campus Selection</h3>
      <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-md border border-slate-200">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
          <Checkbox 
            id="select-all"
            checked={selectAll}
            onCheckedChange={(checked) => handleSelectAllToggle(!!checked)}
          />
          <Label htmlFor="select-all" className="font-medium">
            All Campuses
          </Label>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {validCampuses.map(campus => (
            <div key={campus.campus_id} className="flex items-center gap-2">
              <Checkbox 
                id={campus.campus_id}
                checked={selectedCampusIds.includes(campus.campus_id)}
                onCheckedChange={(checked) => handleCampusToggle(campus.campus_id, !!checked)}
              />
              <Label htmlFor={campus.campus_id}>{campus.campus_name}</Label>
            </div>
          ))}
        </div>
        
        <div className="mt-3 text-sm text-muted-foreground">
          {selectedCampusIds.length === 0 
            ? 'No campuses selected' 
            : selectedCampusIds.length === validCampuses.length 
              ? 'Showing aggregated data for all campuses' 
              : `Showing aggregated data for ${selectedCampusIds.length} selected ${selectedCampusIds.length === 1 ? 'campus' : 'campuses'}`
          }
        </div>
      </div>
    </div>
  );
};
