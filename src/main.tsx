
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
import Auth from './pages/Auth.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />
  },
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <ProtectedRoute><Index /></ProtectedRoute>
      },
      {
        path: "property-research",
        element: <ProtectedRoute><PropertyResearch /></ProtectedRoute>
      },
      {
        path: "salesforce-leads",
        element: <ProtectedRoute><SalesforceLeadsPage /></ProtectedRoute>
      },
      {
        path: "find-contacts",
        element: <ProtectedRoute><FindContactsPage /></ProtectedRoute>
      },
      {
        path: "real-estate-pipeline",
        element: <ProtectedRoute><RealEstatePipeline /></ProtectedRoute>
      },
      {
        path: "real-estate-pipeline/property/:id",
        element: <ProtectedRoute><PropertyDetail /></ProtectedRoute>
      }
    ],
    errorElement: <NotFound />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider 
      router={router} 
      fallbackElement={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    />
  </React.StrictMode>,
)
