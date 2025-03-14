import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import App from "./App";
import "./index.css";
// Import Ant Design styles
import "antd/dist/reset.css";
import NotFound from "./pages/NotFound";
import { logger } from "./utils/logger";
import { toast } from "sonner";
import { getAuthenticatedRoutes } from "./features/registry";
import MainLayout from "./features/common/components/MainLayout";
import Dashboard from "./pages/Dashboard";
import GridListDemoPage from "./pages/GridListDemoPage";
import FamilyProfile from "./pages/FamilyProfile";
import FamilyDetail from "./pages/FamilyDetail";
import EnhancedFamilyDetail from "./components/EnhancedFamilyDetail";
import Search from "./pages/Search";
import TypographyExample from "./pages/TypographyExample"; // Import the TypographyExample component

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
    logger.error("Application error:", error);
    logger.error("Error info:", errorInfo);
  }

  handleResetError = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-anti-flash">
          <div className="w-full max-w-md p-6 bg-seasalt rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-outer-space mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <pre className="bg-platinum p-3 rounded text-sm overflow-auto max-h-40 mb-4">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={this.handleResetError}
              className="w-full py-2 px-4 bg-outer-space text-seasalt rounded hover:bg-onyx transition-colors"
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
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled Promise Rejection:", event.reason);

  // Show a generic error toast for unhandled rejections
  const errorMessage = event.reason?.message || String(event.reason);
  toast.error("An error occurred", {
    description: "Please try again",
    action: {
      label: "Refresh",
      onClick: () => window.location.reload(),
    },
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
        element: <Navigate to="/dashboard" replace />,
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
          // Grid List Demo Page
          {
            path: "grid-list-demo",
            element: <GridListDemoPage />,
          },
          // Family Profile Page
          {
            path: "family/:familyId",
            element: <FamilyProfile />,
          },
          // Family Detail Page (using the enhanced view)
          {
            path: "family-detail/:familyId",
            element: <EnhancedFamilyDetail />,
          },
          // Add an alternative route for different ID format handling
          {
            path: "family/:familyId/detail",
            element: <EnhancedFamilyDetail />,
          },
          // New Family Detail Page with mock data
          {
            path: "family-mock/:familyId",
            element: <FamilyDetail />,
          },
          // Search Page
          {
            path: "search",
            element: <Search />,
          },
          // Typography Example Page
          {
            path: "typography-example",
            element: <TypographyExample />,
          },
          // Include all other routes from features
          ...getAuthenticatedRoutes(),
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <RouterProvider
        router={router}
        fallbackElement={
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-outer-space"></div>
          </div>
        }
      />
    </ErrorBoundary>
  </React.StrictMode>
);
