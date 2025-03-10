import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import SearchBox from '../components/SearchBox';
import { Search as SearchIcon, Users, Briefcase, Building } from 'lucide-react';
import { useFamilyData } from '@/hooks/useFamilyData';
import { FamilySearchResult } from '@/integrations/supabase-client';

// Define search result item interface
interface SearchResultItem {
  id: string | number; // Updated to accept both string and number IDs
  type: 'Family' | 'Student' | 'Campus';
  name: string;
  details: string;
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
  const [isSearchBoxOpen, setIsSearchBoxOpen] = useState(false);
  const navigate = useNavigate();
  
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
        details: `Campus: ${family.current_campus_c || 'None'}, Contacts: ${family.contact_count || 0}, Opportunities: ${family.opportunity_count || 0}`
      };
    });
  }, [familySearchResults]);

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
  
  // Removed tab-change effect as we now only focus on family search
  
  // Add keyboard shortcut listener for 'k' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if 'k' is pressed and no input/textarea is focused
      if (
        e.key === 'k' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchBoxOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <div className="relative">
          <Button 
            variant="outline" 
            className="flex w-full items-center justify-between py-5 px-4 shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onClick={() => setIsSearchBoxOpen(true)}
          >
            <div className="flex items-center text-gray-500">
              <SearchIcon className="h-5 w-5 mr-2" />
              <span>{searchQuery || 'Search for families, students, or campuses...'}</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center rounded border border-gray-200 px-2 py-1 text-xs font-medium text-gray-400">
              Press K
            </kbd>
          </Button>
        </div>
        
        {/* SearchBox Component */}
        <SearchBox 
          isOpen={isSearchBoxOpen} 
          onClose={() => setIsSearchBoxOpen(false)}
          onSearch={setSearchQuery}
          initialQuery={searchQuery}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-medium text-outer-space mb-4">Family Results</h2>
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
                className="p-4 hover:shadow-md cursor-pointer transition-shadow"
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
                    <div className="text-sm text-slate-gray mb-1">{result.type}</div>
                    <h3 className="text-lg font-medium text-outer-space">{result.name}</h3>
                    <p className="text-slate-gray mt-1">{result.details}</p>
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
