import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useLayout } from "../../../contexts/LayoutContext";
import { 
  LayoutDashboard,
  Search,
  Building,
  Users,
  LogOut
} from "lucide-react";
import { cn } from "@/utils/cn";
import AntSidebar from "@/components/AntSidebar";

/**
 * MainLayout component that provides consistent layout structure across all pages
 * This component wraps the main content of each page with the sidebar navigation
 */
const MainLayout: React.FC = () => {
  // Use the layout context for compatibility
  const { showUserProfile } = useLayout();
  const location = useLocation();
  
  // Get current path for AntSidebar default selection
  const getCurrentPathKey = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/search')) return 'search';
    if (path.startsWith('/real-estate')) return 'real-estate';
    if (path.startsWith('/campus-staff')) return 'campus-staff';
    return 'home'; // default
  };

  return (
    <div className="min-h-screen h-screen flex overflow-hidden">
      {/* Ant Design Sidebar */}
      <div className="h-full bg-white shadow-sm py-6 px-3 rounded-r-3xl">
        <div className="px-3 mb-6">
          <LogoBlock />
        </div>
        <AntSidebar defaultSelectedKey={getCurrentPathKey()} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#f8f9fa]">
        <main className="p-6">
          {/* Render outlet */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Logo component
const LogoBlock = () => {
  return (
    <Link
      to="/"
      className="flex items-center"
    >
      <img 
        src="/logos/001_1 Primer Logo - Small.png" 
        alt="Primer Logo" 
        className="h-10"
      />
    </Link>
  );
};

export default MainLayout;
