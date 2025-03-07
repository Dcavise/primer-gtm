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
    <nav className="flex items-center justify-center w-full">
      <ul className="flex space-x-6">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "font-medium text-white underline decoration-2 underline-offset-4"
                  : "text-white/80 hover:text-white transition-colors duration-200"
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};