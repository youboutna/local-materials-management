
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, Search, Plus, Grid, Map as MapIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapLocation } from '@/components/ProjectMap';
import ProjectMap from '@/components/ProjectMap';

const Materials = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setMaterials(data || []);
        
        // Extract unique categories
        const categories = new Set<string>();
        data?.forEach(material => {
          if (material.category) {
            categories.add(material.category);
          }
        });
        setAvailableCategories(Array.from(categories));
        
        // Convert materials with locations to map markers
        const locations: MapLocation[] = data
          ?.filter(material => 
            material.coordinates_latitude && 
            material.coordinates_longitude
          )
          .map(material => ({
            id: material.id,
            name: material.name,
            type: 'material',
            latitude: material.coordinates_latitude,
            longitude: material.coordinates_longitude,
          })) || [];
        
        setMapLocations(locations);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, []);
  
  // Filter materials based on search query and category
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchQuery === '' || 
      material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold">Matériaux</h1>
            <Link to="/materials/create">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau matériau
              </Button>
            </Link>
          </div>
          
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Rechercher un matériau..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select 
                  value={categoryFilter} 
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrer par catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {availableCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="grid" onValueChange={(value) => setViewMode(value as 'grid' | 'map')}>
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="grid" className="flex items-center gap-1">
                  <Grid className="h-4 w-4" />
                  Liste
                </TabsTrigger>
                <TabsTrigger value="map" className="flex items-center gap-1">
                  <MapIcon className="h-4 w-4" />
                  Carte
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="grid">
              {filteredMaterials.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-elegant">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Aucun matériau trouvé</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Aucun matériau ne correspond à votre recherche. Essayez de modifier vos critères ou ajoutez un nouveau matériau.
                  </p>
                  <Button asChild className="mt-6 bg-terracotta-500 hover:bg-terracotta-600">
                    <Link to="/materials/create">
                      Ajouter un matériau
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material) => (
                    <Link to={`/materials/${material.id}`} key={material.id}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl">{material.name}</CardTitle>
                            <Badge variant="outline" className="bg-gray-100">
                              {material.category}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 line-clamp-2">{material.description}</p>
                          <div className="mt-4 text-sm grid grid-cols-2 gap-y-2">
                            <div>
                              <span className="text-gray-500">Prix:</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{material.price_per_unit.toLocaleString()} MRU/{material.unit}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Disponible:</span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{material.available_quantity} {material.unit}</span>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {material.origin_location || 'Origine inconnue'}
                          </div>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="map">
              {mapLocations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-elegant">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">Aucun matériau géolocalisé</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Aucun matériau avec des coordonnées géographiques n'a été trouvé.
                  </p>
                </div>
              ) : (
                <div className="h-[600px]">
                  <ProjectMap
                    locations={mapLocations}
                    height="600px"
                    defaultCenter={[20.5279, -10.0309]}
                    defaultZoom={6}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Materials;
