
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { 
  Building, 
  FileTextIcon, 
  SearchIcon, 
  UserRound, 
  LayoutDashboard 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();
  
  const features = [
    {
      title: "Property Research",
      description: "Search property data including permits, zoning, and schools",
      icon: <SearchIcon className="h-10 w-10 text-blue-500 mb-4" />,
      path: "/property-research",
      color: "bg-blue-50"
    },
    {
      title: "Real Estate Pipeline",
      description: "Track and manage your real estate investment opportunities",
      icon: <Building className="h-10 w-10 text-green-500 mb-4" />,
      path: "/real-estate-pipeline",
      color: "bg-green-50"
    },
    {
      title: "Salesforce Analytics",
      description: "Analyze your Salesforce data and track performance metrics",
      icon: <LayoutDashboard className="h-10 w-10 text-purple-500 mb-4" />,
      path: "/salesforce-leads",
      color: "bg-purple-50"
    },
    {
      title: "Find Contacts",
      description: "Search and connect with property owners and industry contacts",
      icon: <UserRound className="h-10 w-10 text-orange-500 mb-4" />,
      path: "/find-contacts",
      color: "bg-orange-50"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12 px-6 md:py-16 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/532db431-7977-460c-a6f0-28a7513e5091.png" 
                alt="Primer Logo" 
                className="h-10 w-auto bg-white p-1 rounded"
              />
              <h1 className="text-xl md:text-3xl font-semibold">Primer Property Explorer</h1>
            </div>
            <Navbar />
          </div>
          
          <motion.div 
            className="text-center md:text-left max-w-3xl mx-auto md:mx-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
              Comprehensive property data and analytics to power your real estate investments and decision-making.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-8 py-16 max-w-6xl">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Start Exploring</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose from our suite of real estate tools to research properties, analyze markets, and build your investment pipeline.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            >
              <NavLink to={feature.path} className="block h-full">
                <Card className={`h-full border-none shadow-md hover:shadow-lg transition-shadow ${feature.color} dark:bg-slate-800`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-col items-center md:items-start">
                      {feature.icon}
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center md:text-left dark:text-slate-400">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 py-8 px-4 border-t border-slate-200 dark:border-slate-800">
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

export default Index;
