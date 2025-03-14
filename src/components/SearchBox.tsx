import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, ArrowRight, Users, Briefcase, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

/**
 * Format a campus ID to be more readable
 * @param campusId The campus ID to format
 * @returns A more readable version of the campus ID
 */
const formatCampusId = (campusId: string | undefined): string => {
  if (!campusId) return "Not Assigned";

  // If it's already a readable name, return it
  if (!campusId.startsWith("a0NUH")) return campusId;

  // Remove the prefix and any numbers
  return campusId.replace(/^a0NUH/, "").replace(/[0-9]/g, "") || campusId;
};

// Search result interface for dynamic search results
interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "Family" | "Student" | "Campus";
  url: string;
  extraData?: {
    contact_count?: number;
    opportunity_count?: number;
    current_campus_c?: string;
    current_campus_name?: string;
  };
}

// Mock family data for search
const mockFamilies = [
  { 
    id: "00170000013GHZXAA4", 
    name: "Smith Family", 
    campus: "Atlanta", 
    contact_count: 2,
    opportunity_count: 3
  },
  { 
    id: "00170000013GHZYBB5", 
    name: "Johnson Family", 
    campus: "Miami", 
    contact_count: 1,
    opportunity_count: 2
  },
  { 
    id: "00170000013GHZZCC6", 
    name: "Williams Family", 
    campus: "New York", 
    contact_count: 3,
    opportunity_count: 4
  },
  { 
    id: "00170000013GHAADD7", 
    name: "Brown Family", 
    campus: "Birmingham", 
    contact_count: 2,
    opportunity_count: 1
  },
  { 
    id: "00170000013GHBBEE8", 
    name: "Garcia Family", 
    campus: "Chicago", 
    contact_count: 2,
    opportunity_count: 2
  },
  { 
    id: "00170000013GHCCFF9", 
    name: "Miller Family", 
    campus: "Atlanta", 
    contact_count: 1,
    opportunity_count: 1
  },
  { 
    id: "00170000013GHDDGG0", 
    name: "Davis Family", 
    campus: "Miami", 
    contact_count: 2,
    opportunity_count: 3
  },
  { 
    id: "00170000013GHEEHH1", 
    name: "Rodriguez Family", 
    campus: "New York", 
    contact_count: 3,
    opportunity_count: 2
  },
  { 
    id: "00170000013GHFFII2", 
    name: "Martinez Family", 
    campus: "Birmingham", 
    contact_count: 1,
    opportunity_count: 1
  },
  { 
    id: "00170000013GHGGJJ3", 
    name: "Hernandez Family", 
    campus: "Chicago", 
    contact_count: 2,
    opportunity_count: 3
  },
];

interface SearchBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  initialQuery?: string;
  inline?: boolean; // Prop to determine if the search box should be inline
  hideResults?: boolean; // Prop to hide search results from displaying in the component
}

const SearchBox: React.FC<SearchBoxProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialQuery = "",
  inline = false,
  hideResults = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
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
      setSearchQuery(initialQuery || "");
      setSelectedIndex(0);
    }
  }, [isOpen, initialQuery]);

  // Function to search mock family data
  const searchMockFamilies = (query: string) => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      const filteredFamilies = mockFamilies.filter(family => 
        family.name.toLowerCase().includes(query.toLowerCase())
      );
      
      // Convert to SearchResult format
      const familyResults: SearchResult[] = filteredFamilies.map(family => ({
        id: family.id,
        title: family.name,
        description: `${family.campus} - ${family.contact_count} contacts, ${family.opportunity_count} opportunities`,
        category: "Family",
        url: `/family-mock/${family.id}`,
        extraData: {
          contact_count: family.contact_count,
          opportunity_count: family.opportunity_count,
          current_campus_name: family.campus
        }
      }));
      
      setResults(familyResults);
      setLoading(false);
    }, 300);
  };

  // Create a debounced version of the search function to avoid making too many requests
  // Using a memoized debounced function for search
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      
      searchMockFamilies(query);
      
      // If onSearch callback is provided, call it with the current query
      if (onSearch) {
        onSearch(query);
      }
    }, 300),
    [onSearch]
  );

  // Call the debounced search function when the search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setResults([]);
    }

    // Clean up the debounced function when the component unmounts
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(results[selectedIndex].url);
            onClose();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, navigate, onClose]);

  const handleItemClick = (url: string, result: SearchResult) => {
    // If a search callback is provided, call it with the current query
    if (onSearch) {
      onSearch(searchQuery);
    }
    navigate(url);
    onClose();
  };

  // If not open and not inline, return null
  if (!isOpen && !inline) return null;

  // Determine the container component and its props based on inline mode
  const OuterContainer = inline ? "div" : "div";
  const outerContainerProps = inline
    ? { className: "w-full" }
    : {
        className:
          "fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all duration-200 ease-in-out",
        onClick: onClose,
        style: { animation: "fadeIn 0.15s ease-in-out" },
      };

  // Determine the inner container component and its props
  const innerContainerProps = inline
    ? {
        className: "w-full bg-white rounded-lg overflow-hidden border border-gray-200",
      }
    : {
        className:
          "w-full max-w-xl bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 transform transition-all duration-200",
        style: { animation: "scaleIn 0.15s ease-out" },
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      };

  return (
    <OuterContainer {...outerContainerProps}>
      <div {...innerContainerProps}>
        <div className="flex items-center p-3 border-b">
          <Search className="h-5 w-5 text-gray-400 mr-2" />
          <input
            ref={searchInputRef}
            type="text"
            className="flex-1 outline-none bg-transparent"
            placeholder="Search for families..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {!inline && (
            <button className="p-1 rounded-full hover:bg-gray-100" onClick={onClose}>
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Only show loading, no results message, and results list if hideResults is false */}
        {!hideResults && loading && <div className="p-4 text-center text-gray-500">Loading...</div>}

        {!hideResults && !loading && results.length === 0 && searchQuery && (
          <div className="p-4 text-center text-gray-500">No results found</div>
        )}

        {!hideResults && !loading && results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <li
                key={result.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  index === selectedIndex ? "bg-blue-50" : ""
                }`}
                onClick={() => handleItemClick(result.url, result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {result.category === "Family" ? (
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : result.category === "Student" ? (
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
                    {result.extraData?.current_campus_name && (
                      <div className="text-sm text-gray-500">{result.extraData.current_campus_name}</div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 mt-1 ml-2" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!inline && (
          <div className="p-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between">
              <span>
                Press <kbd className="px-2 py-1 bg-gray-100 rounded border">↑</kbd>{" "}
                <kbd className="px-2 py-1 bg-gray-100 rounded border">↓</kbd> to navigate
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded border">Enter</kbd> to select
              </span>
              <span>
                <kbd className="px-2 py-1 bg-gray-100 rounded border">Esc</kbd> to close
              </span>
            </div>
          </div>
        )}
      </div>
    </OuterContainer>
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
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(document.createTextNode(animationKeyframes));
  document.head.appendChild(style);
}

export default SearchBox;