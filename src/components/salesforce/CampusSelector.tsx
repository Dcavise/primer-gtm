
import React, { useEffect, useState } from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Campus } from '@/hooks/salesforce/types';
import { supabase } from '@/integrations/supabase/client';

interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampusId: string | null;
  onSelectCampus: (campusId: string | null, campusName: string | null) => void;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({ 
  campuses, 
  selectedCampusId, 
  onSelectCampus 
}) => {
  const [validCampuses, setValidCampuses] = useState<Campus[]>([]);
  
  useEffect(() => {
    // Filter the campuses prop to only include campuses from the public.campuses table
    const filterValidCampuses = async () => {
      try {
        const { data, error } = await supabase
          .from('campuses')
          .select('campus_id, campus_name, State');
        
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
        const finalCampuses = filteredCampuses.length > 0 ? filteredCampuses : 
          data.map((c: any) => ({
            campus_id: c.campus_id,
            campus_name: c.campus_name,
            State: c.State
          }));
        
        console.log('Valid campuses for selector:', finalCampuses);
        setValidCampuses(finalCampuses);
      } catch (err) {
        console.error('Error processing campus data:', err);
      }
    };
    
    filterValidCampuses();
  }, [campuses]);

  const handleCampusChange = (value: string) => {
    if (value === "all") {
      onSelectCampus(null, null);
    } else {
      const selectedCampus = validCampuses.find(campus => campus.campus_id === value);
      onSelectCampus(value, selectedCampus?.campus_name || null);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Select
          value={selectedCampusId || "all"}
          onValueChange={handleCampusChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            {validCampuses.map(campus => (
              <SelectItem key={campus.campus_id} value={campus.campus_id}>
                {campus.campus_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {selectedCampusId ? `Showing data for selected campus` : 'Showing data for all campuses'}
        </span>
      </div>
    </div>
  );
};
