import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  LayoutDashboard, 
  Home, 
  UserRound, 
  Building, 
  Search,
  LogOut,
  BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const routes = [
  { path: "/", name: "Home", icon: <Home className="mr-2 h-4 w-4" /> },
  { path: "/property-research", name: "Property Research", icon: <Search className="mr-2 h-4 w-4" /> },
  { path: "/salesforce-leads", name: "Salesforce Leads", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
  { path: "/salesforce-metrics", name: "Salesforce Metrics", icon: <BarChart className="mr-2 h-4 w-4" /> },
  { path: "/real-estate-pipeline", name: "Real Estate Pipeline", icon: <Building className="mr-2 h-4 w-4" /> },
  { path: "/find-contacts", name: "Find Contacts", icon: <UserRound className="mr-2 h-4 w-4" /> },
];

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  
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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-4">
          {routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center text-sm font-medium transition-colors",
                  isActive 
                    ? "text-white" 
                    : "text-white/80 hover:text-white"
                )
              }
            >
              {route.name}
            </NavLink>
          ))}
        </div>
        
        {/* Mobile dropdown navigation */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white px-2 py-1 h-auto">
                <span className="sr-only">Navigation</span>
                Navigate <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white">
              {routes.map((route) => (
                <DropdownMenuItem key={route.path} asChild>
                  <NavLink
                    to={route.path}
                    className="flex items-center w-full px-2 py-1.5 cursor-pointer"
                  >
                    {route.icon}
                    {route.name}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* User profile menu */}
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
  );
};
