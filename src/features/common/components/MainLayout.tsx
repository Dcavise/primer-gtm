import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { useLayout } from "../../../contexts/LayoutContext";
import { Sidebar, SidebarBody } from "@/components/ui/animated-sidebar";
import { Search } from "lucide-react";

/**
 * MainLayout component that provides consistent layout structure across all pages
 * This component wraps the main content of each page with the sidebar navigation
 */
const MainLayout: React.FC = () => {
  // State for sidebar open/closed state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Use the layout context for compatibility
  const { showUserProfile } = useLayout();

  return (
    <div className="min-h-screen h-screen flex overflow-hidden">
      {/* Animated Sidebar Navigation */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody />
      </Sidebar>

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

export default MainLayout;
