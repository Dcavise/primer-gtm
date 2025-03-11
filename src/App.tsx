import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { LayoutProvider } from "./contexts/LayoutContext";
import { CMDKPatcher } from "./patches/cmdk-patch";
import SearchBox from "./components/SearchBox";
import { useState, useEffect } from "react";

// Initialize the query client
const queryClient = new QueryClient();

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if 'k' key is pressed and not inside an input or textarea
      if (
        event.key === "k" &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <LayoutProvider>
          {/* Apply the CMDK patch globally */}
          <CMDKPatcher />
          {/* Direct outlet for router content */}
          <Outlet />
          <SonnerToaster position="bottom-right" />
          {/* Global Search Box */}
          <SearchBox isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </LayoutProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
