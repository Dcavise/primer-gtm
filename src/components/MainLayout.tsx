import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Outlet } from 'react-router-dom';

/**
 * MainLayout component that provides consistent navigation styling across all pages
 * This component wraps the main content of each page and ensures the navigation
 * appears consistently throughout the application
 */
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-4 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-8 w-auto bg-white p-1 rounded"
              />
              <h1 className="text-xl font-semibold">Primer Property Explorer</h1>
            </div>
            <Navbar />
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-slate-50 dark:bg-slate-900 py-6 px-4 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-6 w-auto bg-white p-0.5 rounded"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Primer Property Explorer</span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <p>© {new Date().getFullYear()} Primer Property Explorer. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 