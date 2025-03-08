
import { Campus } from '@/types';
import { CampusSelector as FeatureCampusSelector } from '@/features/salesforce/components/CampusSelector';

/**
 * @deprecated Use the CampusSelector from @/features/salesforce/components/CampusSelector instead.
 * This is a wrapper around the feature component to maintain backwards compatibility.
 */
export const CampusSelector: React.FC<{
  campuses: Campus[];
  selectedCampusIds: string[];
  onSelectCampuses: (campusIds: string[], campusNames: string[]) => void;
}> = (props) => {
  return <FeatureCampusSelector {...props} />;
};
