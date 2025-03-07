import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import Index from './pages/Index.tsx'
import PropertyResearch from './pages/PropertyResearch.tsx'
import FindContactsPage from './pages/FindContacts.tsx'
import RealEstatePipeline from './pages/RealEstatePipeline.tsx'
import PropertyDetail from './pages/PropertyDetail.tsx'
import PLHiring from './pages/PLHiring.tsx'
import NotFound from './pages/NotFound.tsx'
import Auth from './pages/Auth.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import MainLayout from './components/MainLayout.tsx'
import { logger } from './utils/logger'
import { toast } from 'sonner'

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
    window.location.href = '/auth';
  };

  render() {
    if (this.state.hasError) {
      // Check if it's an authentication error
      const isAuthError = this.state.error?.message.toLowerCase().includes('auth') || 
                          this.state.error?.message.toLowerCase().includes('unauthorized') ||
                          this.state.error?.message.toLowerCase().includes('unauthenticated');

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </h2>
            <p className="text-gray-700 mb-4">
              {isAuthError 
                ? 'There was a problem with your authentication. Please try signing in again.'
                : 'An unexpected error occurred. Please try refreshing the page.'}
            </p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40 mb-4">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={this.handleResetError}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {isAuthError ? 'Go to Login Page' : 'Try Again'}
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
  
  // Check if it's an authentication error
  const errorMessage = event.reason?.message || String(event.reason);
  if (
    errorMessage.toLowerCase().includes('auth') ||
    errorMessage.toLowerCase().includes('unauthorized') ||
    errorMessage.toLowerCase().includes('unauthenticated')
  ) {
    toast.error('Authentication Error', {
      description: 'Please try signing in again',
      action: {
        label: 'Sign In',
        onClick: () => window.location.href = '/auth'
      }
    });
  }
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "auth",
        element: <Auth />
      },
      {
        element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
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
          },
          {
            path: "pl-hiring",
            element: <PLHiring />
          }
        ]
      }
    ],
    errorElement: <NotFound />
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
