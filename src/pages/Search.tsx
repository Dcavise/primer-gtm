import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import SearchBox from '../components/SearchBox';
import { Search as SearchIcon, Users, Briefcase, Building } from 'lucide-react';
import { useFamilyData } from '@/hooks/useFamilyData';
import { FamilySearchResult } from '@/integrations/supabase-client';
import { supabase } from '@/integrations/supabase-client';

// Define interface for campus data returned from RPC
interface CampusData {
  id: string;
  name: string;
}

// Define search result item interface
interface SearchResultItem {
  id: string | number; // Updated to accept both string and number IDs
  type: 'Family' | 'Student' | 'Campus';
  name: string;
  details: string;
  hasWonOpportunities?: boolean; // Flag indicating if family has won opportunities
  wonOpportunityDetails?: {
    schoolYears: string[];
    campuses: string[];
  }; // Details of won opportunities
  familyIds?: { // Optional object to store all family ID formats for debugging
    standard_id?: string;
    family_id?: string;
    alternate_id?: string;
  };
}

// Define mock results interface
interface MockResultsData {
  all: SearchResultItem[];
  families: SearchResultItem[];
  students: SearchResultItem[];
  campuses: SearchResultItem[];
  [key: string]: SearchResultItem[];
}

/**
 * Search page component
 * Provides functionality to search across different data entities
 */
const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  // Removed tabs functionality to focus solely on family search
  // Removed search box toggle since it's now always visible
  const navigate = useNavigate();
  const [campusMap, setCampusMap] = useState<Record<string, string>>({});
  
  // Use our custom hook for family data operations
  const { 
    loading: isSearching, 
    error: searchError, 
    searchResults: familySearchResults,
    searchFamilies 
  } = useFamilyData();
  
  // Transform family search results to match our SearchResultItem interface
  const searchResults = useMemo(() => {
    return familySearchResults.map(family => {
      // Log the available IDs for debugging
      const standardId = family.standard_id || '';
      const familyId = family.family_id || '';
      const alternateId = family.alternate_id || '';
      
      console.log('Family search result with IDs:', {
        standard_id: standardId,
        family_id: familyId,
        alternate_id: alternateId
      });
      
      // Find the indices of won opportunities
      const wonOpportunityIndices: number[] = [];
      if (Array.isArray(family.opportunity_is_won_flags)) {
        family.opportunity_is_won_flags.forEach((isWon, index) => {
          if (isWon === true) {
            wonOpportunityIndices.push(index);
          }
        });
      }
      
      // Get details of won opportunities
      const wonSchoolYears: string[] = [];
      const wonCampuses: string[] = [];
      
      wonOpportunityIndices.forEach(index => {
        if (Array.isArray(family.opportunity_school_years) && family.opportunity_school_years[index]) {
          wonSchoolYears.push(family.opportunity_school_years[index]);
        }
        if (Array.isArray(family.opportunity_campuses) && family.opportunity_campuses[index]) {
          wonCampuses.push(family.opportunity_campuses[index]);
        }
      });
      
      // Get campus name from campus map, but don't display raw IDs even if name not found
      const campusId = family.current_campus_c || '';
      // Instead of showing the ID, just show 'Unknown Campus' if mapping not found
      const campusName = campusId ? (campusMap[campusId] || 'Unknown Campus') : 'None';
      
      return {
        // Use the standardized ID as our primary ID for consistent navigation
        id: standardId || familyId || alternateId,
        // Store all IDs for debugging and fallback
        familyIds: {
          standard_id: standardId,
          family_id: familyId,
          alternate_id: alternateId
        },
        type: 'Family' as const,
        name: family.family_name || 'Unnamed Family',
        details: `Campus: ${campusName}, Contacts: ${family.contact_count || 0}, Opportunities: ${family.opportunity_count || 0}`,
        hasWonOpportunities: wonOpportunityIndices.length > 0,
        wonOpportunityDetails: wonOpportunityIndices.length > 0 ? {
          schoolYears: wonSchoolYears,
          campuses: wonCampuses
        } : undefined
      };
    });
  }, [familySearchResults, campusMap]);

  // Mock search results for demonstration using useMemo to avoid re-creation on each render
  const mockResults = useMemo<MockResultsData>(() => ({
    all: [
      { id: 1, type: 'Family', name: 'Smith Family', details: 'Parents: John & Jane Smith' },
      { id: 2, type: 'Student', name: 'Emily Johnson', details: 'Grade: 10, Campus: Main' },
      { id: 3, type: 'Campus', name: 'Downtown Campus', details: '120 Students Enrolled' },
    ],
    families: [
      { id: 1, type: 'Family', name: 'Smith Family', details: 'Parents: John & Jane Smith' },
      { id: 4, type: 'Family', name: 'Williams Family', details: 'Parents: Robert & Sarah Williams' },
    ],
    students: [
      { id: 2, type: 'Student', name: 'Emily Johnson', details: 'Grade: 10, Campus: Main' },
      { id: 5, type: 'Student', name: 'Michael Brown', details: 'Grade: 8, Campus: North' },
    ],
    campuses: [
      { id: 3, type: 'Campus', name: 'Downtown Campus', details: '120 Students Enrolled' },
      { id: 6, type: 'Campus', name: 'North Campus', details: '85 Students Enrolled' },
    ],
  }), []);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    
    // Always search for families
    await searchFamilies(query);
  }, [searchFamilies]);
  
  // Effect to perform search when search query changes from SearchBox
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  }, [searchQuery, handleSearch]);

  // Fetch campus data from fivetran_views.campus_c
  useEffect(() => {
    const fetchCampusData = async () => {
      try {
        // Use the RPC function to access the fivetran_views schema
        // Call the function directly without schema qualification as per user memories
        const { data, error } = await supabase
          .rpc('query_campus_data');

        if (error) {
          console.error('Error fetching campus data:', error);
          return;
        }

        if (data && Array.isArray(data)) {
          // Create a map of campus IDs to campus names
          const campusMapping: Record<string, string> = {};
          // With the new function, data is now a simpler array of objects with id and name
          (data as CampusData[]).forEach((campus) => {
            if (campus && campus.id && campus.name) {
              campusMapping[campus.id] = campus.name;
            }
          });
          setCampusMap(campusMapping);
          console.log('Campus mapping loaded:', Object.keys(campusMapping).length, 'campuses');
        }
      } catch (error) {
        console.error('Failed to fetch campus data:', error);
      }
    };

    fetchCampusData();
  }, []);
  
  // Removed tab-change effect as we now only focus on family search
  
  // Removed keyboard shortcut listener since search is now always visible

  // Removed tab change handler as we now only focus on family search

  const handleResultClick = (result: SearchResultItem) => {
    // Navigate based on result type
    switch (result.type) {
      case 'Family':
        // Using the new comprehensive family detail page with the standardized ID
        // Log detailed information to help diagnose any ID format issues
        console.log('Navigating to family detail with:', {
          id: result.id,
          allIds: result.familyIds
        });
        
        if (!result.id) {
          console.error('Cannot navigate - missing family ID', result);
          alert('Error: Could not find a valid ID for this family');
          return;
        }
        
        navigate(`/family-detail/${result.id}`);
        break;
      case 'Student':
        // Replace with actual student profile route when available
        navigate(`/student/${result.id}`);
        break;
      case 'Campus':
        // Replace with actual campus detail route when available
        navigate(`/campus/${result.id}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-outer-space mb-6">Search</h1>
      
      <div className="mb-8">
        {/* Inline SearchBox Component */}
        <SearchBox 
          isOpen={true} 
          onClose={() => {}} 
          onSearch={setSearchQuery}
          initialQuery={searchQuery}
          inline={true}
          hideResults={true}
        />
      </div>

      {searchQuery.trim() && (
        <div className="grid gap-4">
          {isSearching ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-outer-space"></div>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((result) => (
              <Card 
                key={result.id} 
                className={`p-4 hover:shadow-md cursor-pointer transition-shadow ${result.hasWonOpportunities ? 'border-l-4 border-l-green-500' : ''}`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    {result.type === 'Family' ? (
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    ) : result.type === 'Student' ? (
                      <div className="bg-green-100 p-2 rounded-full">
                        <Briefcase className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Building className="h-5 w-5 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center text-sm text-slate-gray mb-1">
                      <span>{result.type}</span>
                      {result.hasWonOpportunities && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Won Opportunity</span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-outer-space">{result.name}</h3>
                    <p className="text-slate-gray mt-1">{result.details}</p>
                    {result.hasWonOpportunities && result.wonOpportunityDetails && (
                      <div className="mt-2">
                        {result.wonOpportunityDetails.schoolYears.length > 0 && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">School Year:</span> {result.wonOpportunityDetails.schoolYears.join(', ')}
                          </p>
                        )}
                        {result.wonOpportunityDetails.campuses.length > 0 && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">Campus:</span> {result.wonOpportunityDetails.campuses.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-gray">No results found for "{searchQuery}"</p>
              <p className="text-sm text-slate-gray mt-1">Try a different search term or category</p>
              {searchError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm">
                  Error: {searchError}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
