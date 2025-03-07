import { NavLink } from 'react-router-dom';
import { FeatureRoutes } from '../routes';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileNavigationProps {
  features: FeatureRoutes[];
}

export const MobileNavigation = ({ features }: MobileNavigationProps) => {
  // Collect all nav items from all features
  const navItems = features
    .flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-white px-2 py-1 h-auto">
            <span className="sr-only">Navigation</span>
            Navigate <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-white">
          {navItems.map((item) => (
            <DropdownMenuItem key={item.path} asChild>
              <NavLink
                to={item.path}
                className="flex items-center w-full px-2 py-1.5 cursor-pointer"
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