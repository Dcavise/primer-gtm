
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
import { Toaster } from "@/components/ui/toaster";
import './App.css';
import { Toaster as SonnerToaster } from 'sonner';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SonnerToaster position="top-right" />
        <Toaster />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/property_research" element={<PropertyResearch />} />
          <Route path="/real-estate-pipeline" element={<RealEstatePipeline />} />
          <Route path="/real-estate-pipeline/property/:id" element={<PropertyDetail />} />
          <Route path="/salesforce-leads" element={<SalesforceLeads />} />
          <Route path="/find-contacts" element={<FindContacts />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
