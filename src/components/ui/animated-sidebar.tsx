"use client";

import { cn } from "@/utils/cn";
import { Link as RouterLink, LinkProps, useLocation } from "react-router-dom";
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, Users, FileText, HelpCircle, Settings, Building } from "lucide-react";
import { useSidebar, SidebarProvider } from "./sidebar-context";
import { getNavigationFeatures } from "@/features/registry";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody: React.FC<React.PropsWithChildren<React.ComponentProps<typeof motion.div>>> = ({ ...props }) => {
  // Create a safe version of props for the mobile sidebar
  const safeProps = { ...props } as unknown as React.ComponentProps<"div">;
  
  return (
    <>
      {/* Desktop sidebar - only shown on md screens and larger */}
      <DesktopSidebar {...props} />
      
      {/* Mobile sidebar container - only shown on smaller than md screens */}
      <div className="md:hidden block">
        <MobileSidebar {...safeProps} />
      </div>
    </>
  );
};

// Helper function to get icon for a nav item
const getNavItemIcon = (path: string) => {
  if (path === '/dashboard' || path === '/') {
    return <LayoutDashboard className="h-5 w-5 flex-shrink-0" />;
  } else if (path.includes('admissions')) {
    return <Users className="h-5 w-5 flex-shrink-0" />;
  } else if (path.includes('real-estate')) {
    return <Building className="h-5 w-5 flex-shrink-0" />;
  } else if (path.includes('campus-staff')) {
    return <HelpCircle className="h-5 w-5 flex-shrink-0" />;
  } else {
    return <Settings className="h-5 w-5 flex-shrink-0" />;
  }
};

export const DesktopSidebar = ({
  className,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const location = useLocation();
  
  // Get navigation items from the registry
  const features = getNavigationFeatures();
  const navItems = features.flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));
  
  // Create navigation links for the sidebar including Dashboard
  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: getNavItemIcon('/dashboard')
    },
    // Map the rest of the nav items
    ...navItems
      .filter(item => item.path !== '/dashboard')
      .map(item => ({
        label: item.label,
        href: item.path,
        icon: getNavItemIcon(item.path)
      }))
  ];
  
  return (
    <motion.div
      className={cn(
        "min-h-screen h-full px-4 py-6 hidden md:flex md:flex-col bg-neutral-50 border-r border-gray-200 w-[280px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "60px") : "300px",
      }}
      onMouseEnter={() => animate && setOpen(true)}
      onMouseLeave={() => animate && setOpen(false)}
      {...props}
    >
      {/* Logo */}
      <div className="flex items-center mb-8 justify-center">
        <img 
          src="/logos/029 - Small.png" 
          alt="Logo" 
          width="40" 
          height="40" 
          className="object-contain" 
        />
      </div>

      {/* Navigation Links */}
      <div className="flex flex-col space-y-1">
        {sidebarLinks.map((link, idx) => (
          <SidebarLink 
            key={idx} 
            link={link} 
            className={cn(
              location.pathname === link.href || 
              (link.href !== '/dashboard' && location.pathname.includes(link.href.slice(1))) 
                ? "bg-blue-50 text-blue-700" 
                : "hover:bg-gray-100 text-gray-700"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  
  // Get navigation items from the registry
  const features = getNavigationFeatures();
  const navItems = features.flatMap(feature => feature.navItems || [])
    .sort((a, b) => (a.order || 999) - (b.order || 999));
  
  // Create navigation links for the sidebar including Dashboard
  const sidebarLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: getNavItemIcon('/dashboard')
    },
    // Map the rest of the nav items
    ...navItems
      .filter(item => item.path !== '/dashboard')
      .map(item => ({
        label: item.label,
        href: item.path,
        icon: getNavItemIcon(item.path)
      }))
  ];
  
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-neutral-50 border-b border-gray-200 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-gray-700 cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-neutral-50 p-6 z-[100] flex flex-col",
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-gray-700 cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              
              {/* Logo */}
              <div className="flex items-center mb-8 px-4 mt-6 justify-center">
                <img 
                  src="/logos/029 - Small.png" 
                  alt="Logo" 
                  width="40" 
                  height="40" 
                  className="object-contain" 
                />
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-1 px-3">
                {sidebarLinks.map((link, idx) => (
                  <SidebarLink 
                    key={idx} 
                    link={link}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href || 
                  (link.href !== '/dashboard' && location.pathname.includes(link.href.slice(1)));

  return (
    <RouterLink
      to={link.href}
      className={cn(
        "flex items-center px-3 py-2.5 rounded-md font-medium text-sm group/sidebar transition duration-200 ease-in-out",
        isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100",
        className
      )}
      {...props}
    >
      <div className={cn(
        "flex-shrink-0 mr-3",
        isActive ? "text-blue-700" : "text-gray-500"
      )}>
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "group-hover/sidebar:translate-x-0.5 transition duration-150 whitespace-pre",
          isActive ? "font-medium" : "font-normal"
        )}
      >
        {link.label}
      </motion.span>
    </RouterLink>
  );
};
