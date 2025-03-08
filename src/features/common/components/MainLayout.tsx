import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../../contexts/LayoutContext';
import { Sidebar, SidebarBody } from '@/components/ui/animated-sidebar';
import { Search } from 'lucide-react';

/**
 * MainLayout component that provides consistent layout structure across all pages
 * This component wraps the main content of each page with the sidebar navigation
 */
const MainLayout: React.FC = () => {
  // State for sidebar open/closed state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Use the layout context for compatibility
  const { showUserProfile } = useLayout();

  return (
    <div className="min-h-screen h-screen flex overflow-hidden">
      {/* Animated Sidebar Navigation */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody />
      </Sidebar>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#f8f9fa]">
        {/* Search Shortcut Indicator - Centered */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-white transition-colors z-10">
          <Search className="h-3.5 w-3.5 mr-1" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-gray-800 font-sans font-medium text-xs">k</kbd>
          <span>to search</span>
        </div>
        <main className="p-6">
          {/* Render outlet */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;