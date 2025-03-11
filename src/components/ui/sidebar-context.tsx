import React, { useState, createContext, useContext } from "react";

/**
 * This file contains the Sidebar context and provider
 * It is imported by animated-sidebar.tsx for state management
 * Keeping context logic here improves React fast refresh capabilities
 */

export interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

/**
 * Hook to access sidebar state
 * Must be used within a SidebarProvider
 */
 
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  // Always force sidebar to be expanded regardless of actual state
  return {
    ...context,
    open: true,
    setOpen: (_: boolean) => {
      /* No-op function to prevent sidebar collapse */
    },
  };
};

/**
 * Provider component that wraps your sidebar
 * Makes the sidebar state available to any child component that calls useSidebar()
 */
export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  // Always keep sidebar expanded and ignore any props trying to collapse it
  const [openState, setOpenState] = useState(true);

  // Force open to always be true regardless of props
  const open = true;
  const setOpen = (_: boolean) => {
    /* No-op function */
  };

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
  );
};
