
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, LayoutDashboard, FileText, Home, UserRound, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { path: "/", name: "Property Explorer", icon: <Home className="mr-2 h-4 w-4" /> },
  { path: "/salesforce-leads", name: "Salesforce Analytics", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
  { path: "/real-estate-pipeline", name: "Real Estate Pipeline", icon: <FileText className="mr-2 h-4 w-4" /> },
  { path: "/find-contacts", name: "Find Contacts", icon: <UserRound className="mr-2 h-4 w-4" /> },
  { path: "/market-explorer", name: "Market Explorer", icon: <Map className="mr-2 h-4 w-4" /> },
];

export const Navbar = () => {
  return (
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
  );
};
