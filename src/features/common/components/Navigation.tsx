import { NavLink } from "react-router-dom";
import { FeatureRoutes } from "../routes";
import { MessageSquare, Zap, BarChart3, Users, Settings } from "lucide-react";

interface NavigationProps {
  features: FeatureRoutes[];
}

// Map of icons for navigation items
const navIcons: Record<string, React.ReactNode> = {
  Build: <MessageSquare className="h-5 w-5" />,
  Improve: <Zap className="h-5 w-5" />,
  Measure: <BarChart3 className="h-5 w-5" />,
  Conversations: <Users className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
};

export const Navigation = ({ features }: NavigationProps) => {
  // Collect all nav items from all features
  const navItems = features
    .flatMap((feature) => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <nav className="flex flex-col space-y-0.5 px-4">
      {navItems.map((item) => {
        const icon = navIcons[item.label] || <MessageSquare className="h-5 w-5" />;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center rounded-md pl-4 pr-3 py-3 text-sm ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              }`
            }
          >
            <span className="mr-3 opacity-90 flex items-center justify-center">{icon}</span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
};
