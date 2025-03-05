
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Index from '@/pages/Index';
import PropertyDetail from '@/pages/PropertyDetail';
import PropertyResearch from '@/pages/PropertyResearch';
import RealEstatePipeline from '@/pages/RealEstatePipeline';
import SalesforceLeads from '@/pages/SalesforceLeads';
import FindContacts from '@/pages/FindContacts';
import NotFound from '@/pages/NotFound';
import Auth from '@/pages/Auth';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRouteWrapper } from '@/components/ProtectedRouteWrapper';
import { Toaster } from "@/components/ui/toaster";
import './App.css';
import { Toaster as SonnerToaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SonnerToaster position="top-right" />
          <Toaster />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/property_research" element={<PropertyResearch />} />
            <Route path="/find-contacts" element={<FindContacts />} />
            
            {/* Protected routes */}
            <Route path="/real-estate-pipeline" element={
              <ProtectedRouteWrapper>
                <RealEstatePipeline />
              </ProtectedRouteWrapper>
            } />
            <Route path="/real-estate-pipeline/property/:id" element={
              <ProtectedRouteWrapper>
                <PropertyDetail />
              </ProtectedRouteWrapper>
            } />
            <Route path="/salesforce-leads" element={
              <ProtectedRouteWrapper>
                <SalesforceLeads />
              </ProtectedRouteWrapper>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
