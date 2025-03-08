import React, { useState, useEffect, useRef } from 'react';
import { X, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

interface SearchBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ isOpen, onClose }) => {
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
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Fetch search results when query changes
    const fetchResults = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/assets/data/searchbox.json');
        const data: SearchResult[] = await response.json();
        
        // Filter results based on search query and exclude campus staff profiles
        const filteredResults = data.filter(item => {
          // First, check if it's a campus staff profile (if so, exclude it)
          if (item.category.toLowerCase().includes('campus staff')) {
            return false;
          }
          
          // Then, check if it matches the search query
          return item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.category.toLowerCase().includes(searchQuery.toLowerCase());
        });
        
        setResults(filteredResults);
        setSelectedIndex(0); // Reset selection when results change
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchQuery]);

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

  const handleItemClick = (url: string) => {
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
                onClick={() => handleItemClick(result.url)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start">
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
