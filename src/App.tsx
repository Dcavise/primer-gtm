import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DeveloperModeProvider } from './contexts/DeveloperModeContext';
import { CMDKPatcher } from './patches/cmdk-patch';

// Initialize the query client
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DeveloperModeProvider>
            {/* Apply the CMDK patch globally */}
            <CMDKPatcher />
            <Outlet />
            <SonnerToaster position="bottom-right" />
          </DeveloperModeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
