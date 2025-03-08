import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';
import { CMDKPatcher } from './patches/cmdk-patch';

// Initialize the query client
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <LayoutProvider>
          {/* Apply the CMDK patch globally */}
          <CMDKPatcher />
          {/* Direct outlet for router content */}
          <Outlet />
          <SonnerToaster position="bottom-right" />
        </LayoutProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
