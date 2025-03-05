
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import Fellows from './pages/Fellows.tsx'
import Campuses from './pages/Campuses.tsx'
import SalesforceLeadsPage from './pages/SalesforceLeads.tsx'
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
        path: "fellows",
        element: <Fellows />
      },
      {
        path: "campuses",
        element: <Campuses />
      },
      {
        path: "salesforce-leads",
        element: <SalesforceLeadsPage />
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
