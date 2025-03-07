import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CMDKPatcher } from './patches/cmdk-patch';

// Initialize the query client
const queryClient = new QueryClient();

// A simple component to display the current route for testing
const RouteDisplay = () => {
  const location = useLocation();
  const isTestMode = new URLSearchParams(location.search).get('test') === 'true';
  
  if (!isTestMode) {
    return <Outlet />;
  }
  
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">Route Test Mode</h1>
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <p className="font-medium">Current path:</p>
          <code className="block bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
            {location.pathname}
          </code>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Navigation is working correctly! The sidebar is properly routing to this path.
        </p>
        <a 
          href="/" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* Apply the CMDK patch globally */}
          <CMDKPatcher />
          {/* For development, we'll directly display the content */}
          <RouteDisplay />
          <SonnerToaster position="bottom-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
