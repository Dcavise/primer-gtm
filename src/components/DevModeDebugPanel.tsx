import React, { useState } from 'react';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bug, RefreshCw, Code, BarChart3, Database, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getMockData, generateMockData } from '@/utils/mockData';

/**
 * Developer Mode Debug Panel Component
 * 
 * A floating panel with developer tools and debug information
 * Only displayed when Developer Mode is active and showDevTools is enabled
 */
export const DevModeDebugPanel: React.FC = () => {
  const { isDeveloperMode, devModeOptions, updateDevModeOptions } = useDeveloperMode();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedTab, setSelectedTab] = useState('data');
  const [dataTypeFilter, setDataTypeFilter] = useState('');
  
  // Only render if dev mode is enabled and dev tools are on
  if (!isDeveloperMode || !devModeOptions.showDevTools) {
    return null;
  }
  
  // Mock data explorer states
  const [selectedMockDataType, setSelectedMockDataType] = useState('properties');
  const [mockDataPreview, setMockDataPreview] = useState<any>(null);
  
  // Mock data types 
  const mockDataTypes = [
    { id: 'properties', label: 'Properties' },
    { id: 'schools', label: 'Schools' },
    { id: 'zoning', label: 'Zoning Data' },
    { id: 'permits', label: 'Permits' },
    { id: 'comments', label: 'Comments' },
    { id: 'files', label: 'Files' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'census', label: 'Census Data' },
    { id: 'real-estate-pipeline', label: 'Real Estate Pipeline' },
    { id: 'campuses', label: 'Campuses' },
    { id: 'timeseries-up', label: 'Time Series (Up)' },
    { id: 'timeseries-down', label: 'Time Series (Down)' },
    { id: 'timeseries-seasonal', label: 'Time Series (Seasonal)' },
    { id: 'status-distribution', label: 'Status Distribution' }
  ];
  
  const filteredDataTypes = dataTypeFilter 
    ? mockDataTypes.filter(type => 
        type.label.toLowerCase().includes(dataTypeFilter.toLowerCase()) ||
        type.id.toLowerCase().includes(dataTypeFilter.toLowerCase()))
    : mockDataTypes;
  
  // Load preview data
  const loadMockDataPreview = () => {
    try {
      const data = getMockData(selectedMockDataType);
      setMockDataPreview(data);
      toast.success('Mock data loaded', {
        description: `Loaded ${selectedMockDataType} mock data`
      });
    } catch (error) {
      toast.error('Error loading mock data', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  // Format the JSON preview with syntax highlighting
  const formatPreview = (data: any): string => {
    if (!data) return 'Select a data type and click "Load Preview"';
    
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return 'Error formatting preview data';
    }
  };
  
  // Force a reload of all data by dispatching a dev mode change event
  const forceReload = () => {
    window.dispatchEvent(new CustomEvent('developer-mode-changed', { 
      detail: { isDeveloperMode, options: devModeOptions } 
    }));
    
    toast.success('Data reload triggered', {
      description: 'All components using dev mode data will reload'
    });
  };
  
  return (
    <div 
      className="fixed bottom-4 right-4 z-50 shadow-lg"
      style={{ maxWidth: isCollapsed ? '48px' : '450px', transition: 'max-width 0.3s ease-in-out' }}
    >
      {/* Collapsed toggle button */}
      {isCollapsed ? (
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          onClick={() => setIsCollapsed(false)}
        >
          <Bug className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-full">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Bug className="h-5 w-5 mr-2 text-indigo-500" />
                Dev Tools
              </CardTitle>
              <CardDescription>
                Debug and test with mock data
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsCollapsed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="pt-4">
            <Tabs defaultValue="data" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="w-full">
                <TabsTrigger value="data" className="flex items-center">
                  <Database className="h-4 w-4 mr-1" />
                  <span>Mock Data</span>
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center">
                  <Code className="h-4 w-4 mr-1" />
                  <span>Dev Tools</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <span>Visualize</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Data Explorer Tab */}
              <TabsContent value="data" className="space-y-3">
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Filter data types..."
                    value={dataTypeFilter}
                    onChange={(e) => setDataTypeFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={selectedMockDataType}
                    onValueChange={setSelectedMockDataType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mock data type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDataTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={loadMockDataPreview} size="sm">
                    Load Preview
                  </Button>
                </div>
                
                <div className="mt-2 h-48 overflow-auto bg-slate-50 p-2 rounded text-xs font-mono">
                  <pre>{formatPreview(mockDataPreview)}</pre>
                </div>
              </TabsContent>
              
              {/* Dev Tools Tab */}
              <TabsContent value="tools" className="space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-logging" className="cursor-pointer flex items-center">
                      <span>Console Logging</span>
                    </Label>
                    <Switch 
                      id="enable-logging" 
                      checked={devModeOptions.logDataFetching}
                      onCheckedChange={(checked) => 
                        updateDevModeOptions({ logDataFetching: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="simulate-delay" className="cursor-pointer flex items-center">
                      <span>Network Delay</span>
                    </Label>
                    <Switch 
                      id="simulate-delay" 
                      checked={devModeOptions.simulateNetworkDelay}
                      onCheckedChange={(checked) => 
                        updateDevModeOptions({ simulateNetworkDelay: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="delay-time" className="w-24">Delay (ms):</Label>
                    <Input
                      id="delay-time"
                      type="number"
                      min="0"
                      max="5000"
                      value={devModeOptions.defaultDelayMs}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          updateDevModeOptions({ defaultDelayMs: value });
                        }
                      }}
                      disabled={!devModeOptions.simulateNetworkDelay}
                    />
                  </div>
                  
                  <Button 
                    onClick={forceReload} 
                    variant="outline" 
                    className="w-full mt-2 flex items-center justify-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Reload All Mock Data</span>
                  </Button>
                </div>
              </TabsContent>
              
              {/* Charts & Visualization Tab - placeholder */}
              <TabsContent value="charts" className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Visualization tools are coming soon. This panel will allow you to:
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Preview generated charts with mock data</li>
                    <li>Test different data patterns and trends</li>
                    <li>Export visualization configurations</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="pt-0">
            <div className="w-full text-xs text-muted-foreground">
              Developer Mode active • <span className="text-green-500">Using mock data</span>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};