import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getNavigationFeatures } from '../../registry';
import { useAuth } from '../../../contexts/AuthContext';
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
  ChevronLeft, 
  LogOut
} from 'lucide-react';

/**
 * MainLayout component that provides consistent navigation styling across all pages
 * This component wraps the main content of each page and ensures the navigation
 * appears consistently throughout the application
 */
const MainLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const features = getNavigationFeatures();
  const location = useLocation();
  const navItems = features.flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));
  
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
    <div className="min-h-screen flex bg-[#f8f9fa]">
      {/* Sidebar Navigation */}
      <aside className="w-[203px] bg-[#000000] text-white flex flex-col min-h-screen">
        {/* Logo & Title - Top Section */}
        <div className="p-4 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v5.7c0 4.83-3.38 8.94-7 10-3.62-1.06-7-5.17-7-10V6.3l7-3.12z"/>
              </svg>
            </div>
            <h1 className="text-lg font-medium">Dashboard</h1>
          </div>
        </div>
        
        {/* Navigation Links */}
        <div className="px-3 space-y-1">
          {/* Dashboard - matches the location if at root or starts with /dashboard */}
          <Link to="/" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              (location.pathname === '/' || location.pathname.startsWith('/dashboard')) 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          
          {/* Admissions Analytics */}
          <Link to="/admissions-analytics" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('admissions-analytics') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <Users className="h-5 w-5 mr-3" />
            Admissions Analytics
          </Link>
          
          {/* Real Estate Pipeline */}
          <Link to="/real-estate-pipeline" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('real-estate-pipeline') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <FileText className="h-5 w-5 mr-3" />
            Real Estate Pipeline
          </Link>
          
          {/* CRM Pipeline */}
          <Link to="/crm-pipeline" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('crm-pipeline') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <UserPlus className="h-5 w-5 mr-3" />
            CRM Pipeline
          </Link>
          
          {/* Property Research */}
          <Link to="/property-research" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('property-research') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <Shield className="h-5 w-5 mr-3" />
            Property Research
          </Link>
          
          {/* Contact Finding */}
          <Link to="/contact-finding" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('contact-finding') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <CreditCard className="h-5 w-5 mr-3" />
            Contact Finding
          </Link>
          
          {/* ATS */}
          <Link to="/ats" 
            className={cn("flex items-center px-2 py-2 rounded-md text-sm", 
              location.pathname.includes('ats') 
                ? "bg-white/10 text-white" 
                : "text-white/70 hover:bg-white/10 hover:text-white")}>
            <HelpCircle className="h-5 w-5 mr-3" />
            ATS
          </Link>
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Back to Admin */}
        <div className="px-3 py-3 border-t border-white/10">
          <button 
            onClick={() => {}} 
            className="flex items-center px-2 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white w-full">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </button>
        </div>
        
        {/* User Profile */}
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
              onClick={() => signOut()} 
              className="text-white/50 hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1">
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;