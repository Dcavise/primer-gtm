import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getNavigationFeatures } from '../../registry';
import { useLayout } from '../../../contexts/LayoutContext';
import { cn } from '@/utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Shield, 
  Settings, 
  HelpCircle
} from 'lucide-react';

/**
 * MainLayout component that provides consistent navigation styling across all pages
 * This component wraps the main content of each page and ensures the navigation
 * appears consistently throughout the application
 */
const MainLayout: React.FC = () => {
  // Mock user profile data since auth has been removed
  const mockProfile = { full_name: 'Demo User' };
  const features = getNavigationFeatures();
  const location = useLocation();
  const navItems = features.flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));
    
  // Use the layout context for compatibility
  const { showUserProfile } = useLayout();
  
  // No longer need control logic for sidebar elements
  
  // No user profile avatar is needed anymore

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-[203px] bg-[#000000] text-white flex flex-col sticky top-0" style={{ minHeight: '100vh' }}>
          {/* Logo */}
          <div className="h-24 flex items-center justify-center">
            <img 
              src="/logos/PrimerWhite.png" 
              alt="Primer Logo" 
              width="90" 
              height="90" 
              className="object-contain" 
            />
          </div>
          {/* Navigation Links */}
          <div className="px-3 pt-4 space-y-1">
            {/* Dashboard - always first */}
            <Link to="/dashboard" 
              className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
                (location.pathname === '/' || location.pathname.startsWith('/dashboard')) 
                  ? "bg-white/10 text-white" 
                  : "text-white/70 hover:bg-white/10 hover:text-white")}>
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            
            {/* Dynamic navigation items from features registry */}
            {navItems
              .filter(item => item.path !== '/dashboard') // Filter out Dashboard since we have a static link
              .map(item => (
              <Link 
                key={item.path}
                to={item.path} 
                className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
                  location.pathname.includes(item.path.slice(1)) 
                    ? "bg-white/10 text-white" 
                    : "text-white/70 hover:bg-white/10 hover:text-white")}>
                {/* Render appropriate icon based on path */}
                {item.path.includes('admissions') && <Users className="h-5 w-5 mr-3" />}
                {item.path.includes('real-estate') && <FileText className="h-5 w-5 mr-3" />}
                {item.path.includes('ats') && <HelpCircle className="h-5 w-5 mr-3" />}
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Bottom spacer */}
          <div className="flex-1"></div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-[#f8f9fa]">
          <main className="p-6" style={{ minHeight: '100vh' }}>
            {/* Render outlet */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;