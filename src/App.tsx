import React from 'react';
import './App.css';
import SalesforceLeadsPage from './pages/SalesforceLeads';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { PermitMap } from './components/PermitMap';
import { PermitSearch } from './components/PermitSearch';
import RealEstatePipelinePage from "./pages/RealEstatePipeline";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PermitSearch />} />
        <Route path="/permits" element={<PermitMap />} />
        <Route path="/salesforce-leads" element={<SalesforceLeadsPage />} />
        <Route path="real-estate-pipeline" element={<RealEstatePipelinePage />} />
      </Routes>
    </Router>
  );
}

export default App;
