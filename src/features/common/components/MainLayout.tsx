import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './Navigation';
import { MobileNavigation } from './MobileNavigation';
import { getNavigationFeatures } from '../../registry';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
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
  
  // Extract first letter of each word in the user's name for avatar
  const getInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name
      .split(' ')
      .map((name: string) => name[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-4 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-8 w-auto bg-white p-1 rounded"
              />
              <h1 className="text-xl font-semibold">Primer Property Explorer</h1>
            </div>
            <div className="flex items-center justify-between w-full ml-8">
              <div className="hidden md:block">
                <Navigation features={features} />
              </div>
              
              <div className="md:hidden">
                <MobileNavigation features={features} />
              </div>
              
              {/* User profile menu */}
              <div className="flex items-center gap-2">
                {/* User Profile */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full text-white">
                        <Avatar className="h-8 w-8 border border-white/20">
                          <AvatarFallback className="bg-blue-600">
                            {getInitials()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => signOut()} className="text-red-600 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-6 w-auto bg-white p-0.5 rounded"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Primer Property Explorer</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Primer Property Explorer. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;