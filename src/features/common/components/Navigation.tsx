import { NavLink } from 'react-router-dom';
import { FeatureRoutes } from '../routes';

interface NavigationProps {
  features: FeatureRoutes[];
}

export const Navigation = ({ features }: NavigationProps) => {
  // Collect all nav items from all features
  const navItems = features
    .flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <nav className="flex space-x-4">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive
              ? "font-medium text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};