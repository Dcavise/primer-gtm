import { NavLink } from "react-router-dom";
import { FeatureRoutes } from "../routes";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileNavigationProps {
  features: FeatureRoutes[];
}

export const MobileNavigation = ({ features }: MobileNavigationProps) => {
  // Collect all nav items from all features
  const navItems = features
    .flatMap((feature) => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-md px-3 py-1.5 h-auto border border-white/20"
          >
            <span className="sr-only">Navigation</span>
            Menu <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-56 mt-2 bg-slate-800 border border-slate-700 shadow-lg"
        >
          {navItems.map((item) => (
            <DropdownMenuItem
              key={item.path}
              asChild
              className="focus:bg-slate-700"
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center w-full px-3 py-2 cursor-pointer ${isActive ? "text-white font-medium" : "text-white/80 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
