import React, { createContext, useContext, useState } from "react";

interface LayoutContextProps {
  showUserProfile: boolean;
  setShowUserProfile: (show: boolean) => void;
}

const LayoutContext = createContext<LayoutContextProps | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showUserProfile, setShowUserProfile] = useState(true);

  return (
    <LayoutContext.Provider
      value={{
        showUserProfile,
        setShowUserProfile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextProps => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};
