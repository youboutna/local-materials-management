import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Package, Map, MapPin, Grid } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import InteractiveMap from '@/components/map/InteractiveMap';
import ProjectMap from '@/components/ProjectMap';
import { MapLocation } from '@/components/ProjectMap';
import { supabase } from '@/integrations/supabase/client';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  image?: string;
  origin_location?: string;
  minimum_quantity?: number;
  local_type?: string;
  adresse?: string;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  forme?: string;
  localisation?: any;
  is_active?: boolean;
}

const Materials: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocalType, setSelectedLocalType] = useState('');

  // Fetch materials from database
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');

        if (error) throw error;
        
        // Transform the data to match our Material interface
        const transformedData: Material[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          unit: item.unit,
          price_per_unit: item.price_per_unit,
          available_quantity: item.available_quantity,
          image: item.image || undefined,
          origin_location: item.origin_location || undefined,
          minimum_quantity: (item as any).minimum_quantity || undefined,
          local_type: (item as any).local_type || undefined,
          adresse: typeof item.adresse === 'string' ? item.adresse : undefined,
          coordinates_latitude: item.coordinates_latitude || undefined,
          coordinates_longitude: item.coordinates_longitude || undefined,
          forme: (item as any).forme || undefined,
          localisation: (item as any).localisation || undefined,
          is_active: (item as any).is_active !== undefined ? (item as any).is_active : true
        }));
        
        setMaterials(transformedData);
        setFilteredMaterials(transformedData);
        
        // Convert materials to map locations with proper adresse handling
        const locations: MapLocation[] = transformedData
          .filter(material => material.coordinates_latitude && material.coordinates_longitude)
          .map(material => ({
            id: material.id,
            name: material.name,
            type: 'material' as const,
            latitude: material.coordinates_latitude!,
            longitude: material.coordinates_longitude!,
            region: material.origin_location || '',
            adresse: material.adresse || '' // Ensure adresse is always a string
          }));
        
        setMapLocations(locations);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // Filter materials based on search and category
  useEffect(() => {
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(material => material.category === selectedCategory);
    }

    if (selectedLocalType && selectedLocalType !== 'all') {
      filtered = filtered.filter(material => material.local_type === selectedLocalType);
    }

    setFilteredMaterials(filtered);
    
    // Update map locations based on filtered materials with proper adresse handling
    const filteredLocations: MapLocation[] = filtered
      .filter(material => material.coordinates_latitude && material.coordinates_longitude)
      .map(material => ({
        id: material.id,
        name: material.name,
        type: 'material' as const,
        latitude: material.coordinates_latitude!,
        longitude: material.coordinates_longitude!,
        region: material.origin_location || '',
        adresse: material.adresse || '' // Ensure adresse is always a string
      }));
    
    setMapLocations(filteredLocations);
  }, [materials, searchTerm, selectedCategory, selectedLocalType]);

  const categories = Array.from(new Set(materials.map(m => m.category))).filter(Boolean);
  const localTypes = Array.from(new Set(materials.map(m => m.local_type))).filter(Boolean);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des matériaux...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matériaux</h1>
          <p className="text-gray-600 mt-1">
            Gérez votre inventaire de matériaux de construction
          </p>
        </div>
        <Button asChild className="bg-adrar-600 hover:bg-adrar-700">
          <Link to="/materials/create">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un matériau
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grid" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Vue Grille
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Carte des Matériaux
          </TabsTrigger>
          <TabsTrigger value="interactive" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Carte Interactive
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher des matériaux..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLocalType} onValueChange={setSelectedLocalType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {localTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setSelectedLocalType('');
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Materials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4" onClick={() => navigate(`/materials/${material.id}`)}>
                  <div className="space-y-3">
                    {material.image && (
                      <img 
                        src={material.image} 
                        alt={material.name}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-lg">{material.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{material.description}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{material.category}</Badge>
                      {material.local_type && (
                        <Badge variant="outline">{material.local_type}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prix:</span>
                        <span className="font-medium">{material.price_per_unit} MRO/{material.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className="font-medium">{material.available_quantity} {material.unit}</span>
                      </div>
                      {material.origin_location && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Origine:</span>
                          <span className="font-medium text-xs">{material.origin_location}</span>
                        </div>
                      )}
                      {material.coordinates_latitude && material.coordinates_longitude && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <MapPin className="h-3 w-3" />
                          <span>Géolocalisé</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun matériau trouvé</h3>
                <p className="text-gray-600">
                  Aucun matériau ne correspond à vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <ProjectMap 
                locations={mapLocations}
                height="600px"
                className="rounded-lg"
              />
            </CardContent>
          </Card>
          
          {mapLocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Matériaux Géolocalisés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mapLocations.map((location) => (
                    <div key={location.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{location.name}</h4>
                      <p className="text-sm text-gray-600">{location.region}</p>
                      {location.adresse && location.adresse.trim() !== '' && (
                        <p className="text-sm text-gray-600">{location.adresse}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interactive" className="space-y-6">
          <InteractiveMap
            title="Carte Interactive des Matériaux"
            description="Explorez tous les matériaux géolocalisés sur une carte interactive de la Mauritanie"
            allowPolygon={false}
            className="min-h-[600px]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Materials;
