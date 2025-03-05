
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Campus } from '@/hooks/use-salesforce-data';

interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampusId: string | null;
  onSelectCampus: (campusId: string | null) => void;
}

export const CampusSelector: React.FC<CampusSelectorProps> = ({ 
  campuses, 
  selectedCampusId, 
  onSelectCampus 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <Select
          value={selectedCampusId || "all"}
          onValueChange={(value) => onSelectCampus(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select campus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campuses</SelectItem>
            {campuses.map(campus => (
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
