
import React from 'react';
import './App.css';
import SalesforceLeadsPage from './pages/SalesforceLeads';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RealEstatePipelinePage from "./pages/RealEstatePipeline";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/salesforce-leads" element={<SalesforceLeadsPage />} />
        <Route path="real-estate-pipeline" element={<RealEstatePipelinePage />} />
      </Routes>
    </Router>
  );
}

export default App;
