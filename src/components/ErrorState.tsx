import React from "react";

interface ErrorStateProps {
  message?: string;
  error?: Error | unknown;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = "An error occurred while loading data.",
  error,
}) => {
  // Format the error message if an error object is provided
  const errorDetail =
    error instanceof Error ? error.message : error ? String(error) : "Unknown error";

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50 text-red-800">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 text-red-500 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-medium mb-2">{message}</h3>
      <div className="text-sm bg-white p-3 rounded border border-red-200 max-w-full overflow-auto">
        <pre className="whitespace-pre-wrap">{errorDetail}</pre>
      </div>
      <div className="mt-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default ErrorState;
