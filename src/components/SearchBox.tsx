import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, ArrowRight, Users, Briefcase, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase-client';
import debounce from 'lodash.debounce';

// Search result interface for dynamic search results
interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: 'Family' | 'Student' | 'Campus';
  url: string;
  extraData?: {
    contact_count?: number;
    opportunity_count?: number;
    current_campus_c?: string;
  };
}

// Interface for local search data format from JSON
interface LocalSearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

// Interface for family search results from Supabase
interface FamilySearchResult {
  family_id: string;
  family_name: string;
  current_campus_c: string;
  contact_count: number;
  opportunity_count: number;
}

interface SearchBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

const SearchBox: React.FC<SearchBoxProps> = ({ isOpen, onClose, onSearch, initialQuery = '' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Focus the search input when the modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      // Use initialQuery if provided, otherwise clear the search
      setSearchQuery(initialQuery || '');
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Create a debounced version of the search function to avoid making too many requests
  // Using a memoized debounced function for search
  const fetchResultsWithDebounce = useCallback((query: string) => {
    // Create the debounced function inside the callback to avoid ESLint warnings
    const debouncedFn = debounce(async (searchTerm: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Use the searchFamilies method from the supabase client
        let familyData = [];
        try {
          // Use the searchFamilies helper method which properly handles the schema
          console.log(`Attempting to search for families with term: "${query}"`);
          const { success, data, error } = await supabase.searchFamilies(query);
          
          if (!success || error) {
            console.warn('Error searching families:', error);
            // Log more detailed error information if it's a JSON string
            try {
              const errorObj = typeof error === 'string' ? JSON.parse(error) : error;
              console.warn('Detailed error info:', errorObj);
            } catch (e) {
              // If it's not valid JSON, just log as-is
              console.warn('Error details:', error);
            }
            throw new Error(typeof error === 'string' ? error : 'Search failed');
          }
          
          console.log(`Search successful, found ${data?.length || 0} results`);
          familyData = data || [];
        } catch (searchError) {
          console.error('All database search attempts failed, falling back to local data:', searchError);
          // Fall back to local data if RPC fails
          const response = await fetch('/assets/data/searchbox.json');
          const localData = await response.json();
          
          // Using the LocalSearchItem interface defined at the top of the file
          
          // Filter results based on search query and exclude campus staff profiles
          familyData = localData.filter((item: LocalSearchItem) => {
            // First, check if it's a campus staff profile (if so, exclude it)
            if (item.category.toLowerCase().includes('campus staff')) {
              return false;
            }
            
            // Then, check if it matches the search query
            return item.title.toLowerCase().includes(query.toLowerCase()) || 
                  item.description.toLowerCase().includes(query.toLowerCase()) ||
                  item.category.toLowerCase().includes(query.toLowerCase());
          });
        }

        // Check if we're dealing with local data or RPC data
        const isLocalData = familyData.length > 0 && 'title' in familyData[0];
        
        // Convert family results to the SearchResult format
        // Using the LocalSearchItem interface defined at the top of the file
        
        const familyResults: SearchResult[] = isLocalData 
          ? familyData.map((item: LocalSearchItem) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              category: item.category.includes('Family') ? 'Family' : 
                       item.category.includes('Student') ? 'Student' : 'Campus',
              url: item.url
            }))
          : (familyData || []).map((family: FamilySearchResult) => ({
          id: family.family_id,
          title: family.family_name || 'Unnamed Family',
          description: `Campus: ${family.current_campus_c || 'None'}, Contacts: ${family.contact_count || 0}, Opportunities: ${family.opportunity_count || 0}`,
          category: 'Family',
          url: `/family-detail/${family.family_id}`,
          extraData: family
        }));

        // In the future, you could add more searches here, such as:
        // const { data: studentData } = await supabase.rpc('search_students', { search_term: query });
        // const { data: campusData } = await supabase.rpc('search_campuses', { search_term: query });
        
        // Combine all results (for now, just families)
        const allResults = [...familyResults];
        
        console.log('Search results:', allResults.length, 'items found');
        
        setResults(allResults);
        setSelectedIndex(0); // Reset selection when results change
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    // Execute the debounced function
    debouncedFn(query);
    
    // Return the cancel function for cleanup
    return debouncedFn.cancel;
  }, [] // No dependencies needed here since we're using useState setters which are stable
  );
  
  // Simple wrapper for the debounced function that returns the cancel function
  const debouncedSearch = useCallback((query: string) => {
    return fetchResultsWithDebounce(query);
  }, [fetchResultsWithDebounce]);

  // Call the debounced search function when the search query changes
  useEffect(() => {
    let cancelFn: (() => void) | undefined;
    
    if (searchQuery.trim()) {
      // Store the cancel function returned by fetchResultsWithDebounce
      cancelFn = debouncedSearch(searchQuery);
      
      // If onSearch callback is provided, call it with the current query
      // This helps to synchronize the search query with the parent component
      if (onSearch) {
        onSearch(searchQuery);
      }
    } else {
      setResults([]);
    }
    
    // Cancel the debounced function when the component unmounts or search query changes
    return () => {
      if (cancelFn) cancelFn();
    };
  }, [searchQuery, debouncedSearch, onSearch, fetchResultsWithDebounce]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(results[selectedIndex].url);
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  const handleItemClick = (url: string, result: SearchResult) => {
    // If a search callback is provided, call it with the current query
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate(url);
    onClose();
  };

  if (!isOpen) return null;

  // Add blur and animation effects
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all duration-200 ease-in-out"
      onClick={onClose}
      style={{ animation: 'fadeIn 0.15s ease-in-out' }}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 transform transition-all duration-200"
        style={{ animation: 'scaleIn 0.15s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center p-3 border-b">
          <Search className="h-5 w-5 text-gray-400 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            className="flex-1 outline-none bg-transparent"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        {loading && (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        )}
        
        {!loading && results.length === 0 && searchQuery && (
          <div className="p-4 text-center text-gray-500">No results found</div>
        )}
        
        {!loading && results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <li 
                key={result.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleItemClick(result.url, result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {result.category === 'Family' ? (
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : result.category === 'Student' ? (
                      <div className="bg-green-100 p-2 rounded-full">
                        <Briefcase className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="bg-purple-100 p-2 rounded-full">
                        <Building className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-gray-500">{result.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{result.category}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 mt-1 ml-2" />
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <div className="p-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between">
            <span>Press <kbd className="px-2 py-1 bg-gray-100 rounded border">↑</kbd> <kbd className="px-2 py-1 bg-gray-100 rounded border">↓</kbd> to navigate</span>
            <span><kbd className="px-2 py-1 bg-gray-100 rounded border">Enter</kbd> to select</span>
            <span><kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add animation keyframes
const animationKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

// Inject the keyframes into the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(animationKeyframes));
  document.head.appendChild(style);
}

export default SearchBox;
