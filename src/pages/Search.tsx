import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useNavigate } from 'react-router-dom';

// Define search result item interface
interface SearchResultItem {
  id: number;
  type: 'Family' | 'Student' | 'Campus';
  name: string;
  details: string;
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
  const [selectedTab, setSelectedTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const navigate = useNavigate();

  // Mock search results for demonstration
  const mockResults: MockResultsData = {
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
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setSearchResults(mockResults[selectedTab as keyof typeof mockResults] || []);
      setIsSearching(false);
    }, 500);
  };

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate API call with timeout
      setTimeout(() => {
        setSearchResults(mockResults[value as keyof typeof mockResults] || []);
        setIsSearching(false);
      }, 300);
    }
  };

  const handleResultClick = (result: SearchResultItem) => {
    // Navigate based on result type
    switch (result.type) {
      case 'Family':
        navigate(`/family/${result.id}`);
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
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search for families, students, or campuses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isSearching || !searchQuery.trim()}>
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </form>
      </div>

      <Tabs defaultValue="all" className="mb-6" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="families">Families</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="campuses">Campuses</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <h2 className="text-lg font-medium text-outer-space mb-4">All Results</h2>
        </TabsContent>
        <TabsContent value="families" className="mt-4">
          <h2 className="text-lg font-medium text-outer-space mb-4">Family Results</h2>
        </TabsContent>
        <TabsContent value="students" className="mt-4">
          <h2 className="text-lg font-medium text-outer-space mb-4">Student Results</h2>
        </TabsContent>
        <TabsContent value="campuses" className="mt-4">
          <h2 className="text-lg font-medium text-outer-space mb-4">Campus Results</h2>
        </TabsContent>
      </Tabs>

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
            <div className="text-center py-8 text-slate-gray">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
