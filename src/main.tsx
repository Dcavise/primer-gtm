import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import NotFound from './pages/NotFound.tsx'
import { logger } from './utils/logger'
import { toast } from 'sonner'
import { getAuthenticatedRoutes } from './features/registry'
import MainLayout from './features/common/components/MainLayout'
import Dashboard from './pages/Dashboard.tsx'

// Global error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Application error:', error);
    logger.error('Error info:', errorInfo);
  }

  handleResetError = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-700 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={this.handleResetError}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize error handlers
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection:', event.reason);
  
  // Show a generic error toast for unhandled rejections
  const errorMessage = event.reason?.message || String(event.reason);
  toast.error('An error occurred', {
    description: 'Please try again',
    action: {
      label: 'Refresh',
      onClick: () => window.location.reload()
    }
  });
});

// Create the router with feature-based routes
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Dashboard is the main page (redirect to dashboard)
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      
      // All routes wrapped in MainLayout (auth has been removed)
      {
        element: <MainLayout />,
        children: [
          // Explicitly adding the Dashboard route
          {
            path: "dashboard",
            element: <Dashboard />,
          },
          // Include all other routes from features
          ...getAuthenticatedRoutes()
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider 
        router={router} 
        fallbackElement={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }
      />
    </ErrorBoundary>
  </React.StrictMode>,
)
