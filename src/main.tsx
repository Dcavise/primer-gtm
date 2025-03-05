
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import Index from './pages/Index.tsx'
import PropertyResearch from './pages/PropertyResearch.tsx'
import SalesforceLeadsPage from './pages/SalesforceLeads.tsx'
import FindContactsPage from './pages/FindContacts.tsx'
import RealEstatePipeline from './pages/RealEstatePipeline.tsx'
import PropertyDetail from './pages/PropertyDetail.tsx'
import NotFound from './pages/NotFound.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Index />
      },
      {
        path: "property-research",
        element: <PropertyResearch />
      },
      {
        path: "salesforce-leads",
        element: <SalesforceLeadsPage />
      },
      {
        path: "find-contacts",
        element: <FindContactsPage />
      },
      {
        path: "real-estate-pipeline",
        element: <RealEstatePipeline />
      },
      {
        path: "real-estate-pipeline/property/:id",
        element: <PropertyDetail />
      }
    ],
    errorElement: <NotFound />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
