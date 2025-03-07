import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getNavigationFeatures } from '../../registry';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  FileText, 
  Shield, 
  CreditCard, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react';

/**
 * MainLayout component that provides consistent navigation styling across all pages
 * This component wraps the main content of each page and ensures the navigation
 * appears consistently throughout the application
 */
const MainLayout: React.FC = () => {
  const auth = useAuth();
  const { profile, signOut } = auth;
  const features = getNavigationFeatures();
  const location = useLocation();
  const navItems = features.flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));
    
  // Use the global layout context
  const { showUserProfile, setShowUserProfile } = useLayout();
  
  // Control sidebar elements based on the current route
  useEffect(() => {
    // Default configuration for all routes
    let showProfile = true;
    
    // Route-specific configurations
    if (location.pathname.includes('/dashboard')) {
      // Dashboard should have no user profile
      showProfile = false;
    } 
    else if (location.pathname.includes('/contact-finding')) {
      // Contact finding has no user profile
      showProfile = false;
    }
    else if (location.pathname.includes('/real-estate-pipeline')) {
      // Real estate pipeline has no user profile
      showProfile = false;
    }
    else if (location.pathname.includes('/property-research')) {
      // Property research has no user profile
      showProfile = false;
    }
    else if (location.pathname.includes('/ats')) {
      // ATS has user profile
      showProfile = true;
    }
    else if (location.pathname.includes('/crm')) {
      // CRM pipeline has user profile
      showProfile = true;
    }
    
    // Update the context state
    setShowUserProfile(showProfile);
  }, [location.pathname, setShowUserProfile]);
  
  // Get the initials of the user for the avatar
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ')
        .map(name => name[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="w-full bg-[#000000] text-white h-16 z-10 sticky top-0">
        <div className="h-full flex justify-between items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.83-3.38 8.94-7 10-3.62-1.06-7-5.17-7-10V6.3l7-3.12z"/>
              </svg>
            </div>
            <h1 className="text-xl font-medium">Primer Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-white/70 hover:text-white flex items-center gap-1 p-2 rounded-md hover:bg-white/10">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button className="text-white/70 hover:text-white flex items-center gap-1 p-2 rounded-md hover:bg-white/10">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 pl-4 ml-2 border-l border-white/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white text-black rounded-full text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{profile?.full_name || 'User'}</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="w-[203px] bg-[#000000] text-white flex flex-col sticky top-16" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          {/* Logo & Title - Top Section */}
          <div className="p-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium">Navigation</h1>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="px-3 space-y-1">
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
                {item.path.includes('crm') && <UserPlus className="h-5 w-5 mr-3" />}
                {item.path.includes('property-research') && <Shield className="h-5 w-5 mr-3" />}
                {item.path.includes('contact-finding') && <CreditCard className="h-5 w-5 mr-3" />}
                {item.path.includes('ats') && <HelpCircle className="h-5 w-5 mr-3" />}
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>
          
          {/* User Profile - Consistently shown when showUserProfile is true */}
          {showUserProfile && (
            <div className="px-3 py-3">
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-white text-black rounded-full text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{profile?.full_name || 'User'}</span>
                </div>
                <button 
                  onClick={() => { if (signOut) signOut(); }} 
                  className="text-white/50 hover:text-white">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </aside>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-[#f8f9fa]">
          <main className="p-6" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            {/* Render outlet */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;