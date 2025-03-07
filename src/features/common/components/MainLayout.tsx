import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import { getNavigationFeatures } from '../../registry';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Play, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * MainLayout component that provides consistent navigation styling across all pages
 * This component wraps the main content of each page and ensures the navigation
 * appears consistently throughout the application
 */
const MainLayout: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const features = getNavigationFeatures();
  
  return (
    <div className="min-h-screen flex bg-[#e8eef4]">
      {/* Sidebar Navigation */}
      <aside className="w-[280px] bg-[#1f1b36] text-white flex flex-col min-h-screen">
        {/* Logo & Title - Top Section */}
        <div className="p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white w-10 h-10 rounded-md flex items-center justify-center">
              <div className="text-[#1f1b36] font-bold text-lg">a</div>
            </div>
            <h1 className="text-lg font-medium">Atlantis Air</h1>
          </div>
        </div>
        
        {/* Navigation Dropdown */}
        <div className="px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between px-0 py-2 h-auto hover:bg-transparent hover:text-white flex items-center">
                <span className="font-medium">Navigate</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-white">
              {features.flatMap(feature => feature.navItems || [])
                .sort((a, b) => (a.order || 999) - (b.order || 999))
                .map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <a href={item.path} className="cursor-pointer">
                      {item.label}
                    </a>
                  </DropdownMenuItem>
                ))
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Spacer */}
        <div className="flex-1"></div>
        
        {/* Test Bot Button */}
        <div className="px-4 py-3">
          <Button variant="ghost" className="w-full flex items-center justify-start text-white/70 hover:text-white hover:bg-transparent p-0">
            <Play className="h-5 w-5 mr-2" />
            <span>Test Bot</span>
          </Button>
        </div>
        
        {/* User Profile */}
        <div className="px-4 py-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-amber-400 text-white rounded-full">
                <span className="font-medium text-lg">G</span>
              </AvatarFallback>
            </Avatar>
            <span>George Byron</span>
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