
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import SalesforceLeadsPage from './pages/SalesforceLeads.tsx'
import FindContactsPage from './pages/FindContacts.tsx'
import RealEstatePipeline from './pages/RealEstatePipeline.tsx'
import Index from './pages/Index.tsx'
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
