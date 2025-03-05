
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RealEstatePipelineSync from '@/components/RealEstatePipelineSync';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin } from 'lucide-react';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

const RealEstatePipelinePage: React.FC = () => {
  const [properties, setProperties] = useState<RealEstateProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<RealEstateProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProperties(properties);
    } else {
      const lowercasedSearch = searchTerm.toLowerCase();
      const filtered = properties.filter(property => {
        return (
          (property.address?.toLowerCase().includes(lowercasedSearch)) || 
          (property.site_name_type?.toLowerCase().includes(lowercasedSearch)) ||
          (property.market?.toLowerCase().includes(lowercasedSearch)) ||
          (property.status?.toLowerCase().includes(lowercasedSearch))
        );
      });
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('Error fetching properties:', error);
        return;
      }
      
      setProperties(data || []);
      setFilteredProperties(data || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-200';
    
    status = status.toLowerCase();
    if (status.includes('active') || status.includes('approved')) return 'bg-green-100 text-green-800';
    if (status.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    if (status.includes('hold')) return 'bg-orange-100 text-orange-800';
    if (status.includes('rejected') || status.includes('dead')) return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8 px-6">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-2xl md:text-3xl font-semibold">Real Estate Pipeline</h1>
          <p className="text-white/80 mt-2">
            Track and manage real estate opportunities
          </p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <RealEstatePipelineSync />
          </div>
          
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>
                      {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} in pipeline
                    </CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchProperties}>
                    Refresh
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search properties..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <p>Loading properties...</p>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No properties match your search' : 'No properties found'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProperties.map((property) => (
                      <div 
                        key={property.id} 
                        className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{property.site_name_type || 'Unnamed Property'}</h3>
                            <div className="flex items-center text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="text-sm">{property.address || 'No address'}</span>
                            </div>
                          </div>
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                              {property.status || 'No Status'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Market:</span>{' '}
                            <span className="font-medium">{property.market || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size:</span>{' '}
                            <span className="font-medium">{property.sf_available || 'Unknown'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Fellow:</span>{' '}
                            <span className="font-medium">{property.fellow || 'Unassigned'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phase:</span>{' '}
                            <span className="font-medium">{property.phase || 'Unknown'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Last Update:</span>{' '}
                            <span className="font-medium">
                              {property.last_updated
                                ? new Date(property.last_updated).toLocaleDateString()
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        {property.property_notes && (
                          <div className="mt-3 text-sm text-muted-foreground border-t pt-2">
                            <p className="line-clamp-2">{property.property_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RealEstatePipelinePage;
