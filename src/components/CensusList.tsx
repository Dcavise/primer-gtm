
import { CensusData } from "@/hooks/use-census-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { Building2, TrendingUp, Home, GraduationCap, Users } from "lucide-react";
import { formatNumber, formatPercent } from "@/utils/format";
import { motion } from "framer-motion";

interface CensusListProps {
  censusData: CensusData | null;
  isLoading: boolean;
  searchedAddress: string;
}

export const CensusList = ({ censusData, isLoading, searchedAddress }: CensusListProps) => {
  if (isLoading) {
    return <LoadingState message="Retrieving census data..." />;
  }

  if (!censusData && !isLoading && !searchedAddress) {
    return (
      <motion.div 
        className="py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-2xl font-medium mb-3">Enter an address to get started</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore detailed demographic data from the U.S. Census Bureau for your property's location. 
          This information helps you understand:
        </p>
        <ul className="mt-4 text-muted-foreground max-w-lg mx-auto text-left list-disc pl-8">
          <li className="mb-2">Population demographics and household composition</li>
          <li className="mb-2">Income levels and economic indicators</li>
          <li className="mb-2">Housing market characteristics</li>
          <li className="mb-2">Education levels and workforce statistics</li>
          <li className="mb-2">Community profile attributes relevant to property investment</li>
        </ul>
      </motion.div>
    );
  }

  if (!censusData && !isLoading) {
    return (
      <div className="py-8 text-center">
        <h2 className="text-xl font-medium mb-2">No census data available</h2>
        <p className="text-muted-foreground">
          We couldn't retrieve census data for this location. Please try a different address or check that you've entered a valid US address.
        </p>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {searchedAddress && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-lg md:text-xl font-medium mb-1">Census data for</h2>
          <p className="text-muted-foreground">{searchedAddress}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Population
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {censusData?.totalPopulation ? formatNumber(censusData.totalPopulation) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total population in census tract
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                Median Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {censusData?.medianHouseholdIncome ? `$${formatNumber(censusData.medianHouseholdIncome)}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Median household income
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <Home className="h-4 w-4 mr-2 text-orange-500" />
                Home Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {censusData?.medianHomeValue ? `$${formatNumber(censusData.medianHomeValue)}` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Median home value
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base font-medium">
                <GraduationCap className="h-4 w-4 mr-2 text-purple-500" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {censusData?.educationLevelBachelor ? `${formatPercent(censusData.educationLevelBachelor)}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Bachelor's degree or higher
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {censusData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  Demographics
                </CardTitle>
                <CardDescription>Population characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {censusData.categories.demographic.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{typeof item.value === 'number' ? 
                        (item.name.toLowerCase().includes('percent') ? `${formatPercent(item.value)}%` : formatNumber(item.value)) 
                        : item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Economic
                </CardTitle>
                <CardDescription>Income and employment data</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {censusData.categories.economic.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{typeof item.value === 'number' ? 
                        (item.name.toLowerCase().includes('income') ? `$${formatNumber(item.value)}` :
                         item.name.toLowerCase().includes('percent') ? `${formatPercent(item.value)}%` : 
                         formatNumber(item.value)) 
                        : item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2 text-orange-500" />
                  Housing
                </CardTitle>
                <CardDescription>Housing characteristics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {censusData.categories.housing.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{typeof item.value === 'number' ? 
                        (item.name.toLowerCase().includes('value') ? `$${formatNumber(item.value)}` :
                         item.name.toLowerCase().includes('percent') ? `${formatPercent(item.value)}%` : 
                         formatNumber(item.value)) 
                        : item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-purple-500" />
                  Education
                </CardTitle>
                <CardDescription>Educational attainment</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {censusData.categories.education.map((item, i) => (
                    <li key={i} className="flex justify-between items-center text-sm border-b pb-2">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-medium">{typeof item.value === 'number' ? 
                        (item.name.toLowerCase().includes('percent') ? `${formatPercent(item.value)}%` : formatNumber(item.value)) 
                        : item.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
