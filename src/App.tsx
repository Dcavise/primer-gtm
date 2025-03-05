
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import { Outlet } from 'react-router-dom';

// Initialize the query client
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <SonnerToaster position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
