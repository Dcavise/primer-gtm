
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/Navbar';
import { Building2, BarChart3, Search, LogIn, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Primer Dashboard</h1>
            <Navbar />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Welcome to Primer Dashboard</h2>
            {!user && (
              <Link to="/auth">
                <Button>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/real-estate-pipeline">
              <div className="bg-card hover:bg-card/80 border rounded-lg p-6 transition-colors">
                <div className="flex items-center mb-4">
                  <Building2 className="h-6 w-6 mr-2 text-primary" />
                  <h3 className="text-xl font-semibold">Real Estate Pipeline</h3>
                </div>
                <p className="text-muted-foreground">Track and manage real estate properties in the development pipeline.</p>
              </div>
            </Link>
            
            <Link to="/property_research">
              <div className="bg-card hover:bg-card/80 border rounded-lg p-6 transition-colors">
                <div className="flex items-center mb-4">
                  <Home className="h-6 w-6 mr-2 text-primary" />
                  <h3 className="text-xl font-semibold">Property Research</h3>
                </div>
                <p className="text-muted-foreground">Research property data including schools, zoning, and permits.</p>
              </div>
            </Link>
            
            <Link to="/salesforce-leads">
              <div className="bg-card hover:bg-card/80 border rounded-lg p-6 transition-colors">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-6 w-6 mr-2 text-primary" />
                  <h3 className="text-xl font-semibold">Salesforce Dashboard</h3>
                </div>
                <p className="text-muted-foreground">View and analyze Salesforce leads and opportunities metrics.</p>
              </div>
            </Link>
            
            <Link to="/find-contacts">
              <div className="bg-card hover:bg-card/80 border rounded-lg p-6 transition-colors">
                <div className="flex items-center mb-4">
                  <Search className="h-6 w-6 mr-2 text-primary" />
                  <h3 className="text-xl font-semibold">Find Contacts</h3>
                </div>
                <p className="text-muted-foreground">Search and find contact information for various organizations.</p>
              </div>
            </Link>
          </div>
          
          {!user && (
            <div className="mt-8 bg-muted rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">Sign in to unlock all features</h3>
              <p className="text-muted-foreground mb-4">
                Sign in to access all the features of the dashboard, including commenting on property records.
              </p>
              <Link to="/auth">
                <Button>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In / Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
