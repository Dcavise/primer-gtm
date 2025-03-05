
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import Index from './pages/Index';
import Fellows from './pages/Fellows';
import NotFound from './pages/NotFound';

// Initialize the query client
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fellows" element={<Fellows />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <SonnerToaster position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
