
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Eye, Plus, Search, MapPin, Package2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectMap, { MapLocation } from '@/components/ProjectMap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import { MAURITANIA_REGIONS } from '@/types/mauritania';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location: string;
  image: string;
  workspace_id?: string;
  adresse?: string;
  localisation?: string;
  forme?: string;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
}

const Materials = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Fetch materials from Supabase
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Material[];
    }
  });

  // Process materials to create map locations with warehouse shapes
  const mapLocations: MapLocation[] = materials
    .filter(material => material.coordinates_latitude && material.coordinates_longitude)
    .map(material => {
      console.log(`Processing material for map: ${material.name}`);
      console.log('Raw localisation data:', material.localisation);
      console.log('Forme field:', material.forme);
      
      let warehouseShape: { lat: number; lng: number }[] | undefined;
      let warehouseShapeType: 'polygon' | 'rectangle' | 'circle' | undefined;
      
      // Parse localisation data if it exists
      if (material.localisation) {
        try {
          let parsedData;
          // Handle both string and already parsed JSON
          if (typeof material.localisation === 'string') {
            parsedData = JSON.parse(material.localisation);
          } else {
            parsedData = material.localisation;
          }
          
          console.log('Parsed localisation data:', parsedData);
          
          // Check if it's an array of coordinates (warehouse shape)
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            // Verify the structure has lat/lng properties
            if (parsedData[0] && typeof parsedData[0] === 'object' && 'lat' in parsedData[0] && 'lng' in parsedData[0]) {
              warehouseShape = parsedData.map(point => ({
                lat: point.lat,
                lng: point.lng
              }));
              warehouseShapeType = (material.forme as 'polygon' | 'rectangle' | 'circle') || 'polygon';
              console.log(`Successfully parsed warehouse shape for ${material.name}:`, warehouseShape, 'type:', warehouseShapeType);
            }
          }
        } catch (error) {
          console.error(`Error parsing localisation for ${material.name}:`, error);
        }
      }
      
      const location: MapLocation = {
        id: material.id,
        name: material.name,
        type: 'material',
        latitude: material.coordinates_latitude!,
        longitude: material.coordinates_longitude!,
        region: material.origin_location,
        adresse: material.adresse || '',
        warehouseShape,
        warehouseShapeType
      };
      
      console.log(`Final map location for ${material.name}:`, location);
      return location;
    });

  console.log('Total map locations with warehouse shapes:', mapLocations.filter(loc => loc.warehouseShape).length);

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || material.category === categoryFilter;
    const matchesRegion = !regionFilter || material.origin_location === regionFilter;
    
    return matchesSearch && matchesCategory && matchesRegion;
  });

  // Filter out empty, null, or undefined values and ensure strings are not empty
  const categories = [...new Set(materials
    .map(m => m.category)
    .filter(category => category && typeof category === 'string' && category.trim() !== '')
  )];
  
  const regions = [...new Set(materials
    .map(m => m.origin_location)
    .filter(region => region && typeof region === 'string' && region.trim() !== '')
  )];

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: t('materials.toast.deleted'),
        description: t('materials.toast.deleted_description'),
      });

      queryClient.invalidateQueries({ queryKey: ['materials'] });
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: t('materials.toast.error'),
        description: t('materials.toast.error_description'),
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Rupture', color: 'bg-red-500' };
    if (quantity < 10) return { status: 'Faible', color: 'bg-orange-500' };
    return { status: 'Disponible', color: 'bg-green-500' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">Chargement...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-adrar-900 mb-2">
                {t('materials.title')}
              </h1>
              <p className="text-gray-600">
                Gérez vos matériaux de construction et leur localisation
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowMap(!showMap)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {showMap ? 'Masquer la carte' : 'Voir sur la carte'}
              </Button>
              <Button 
                onClick={() => navigate('/materials/create')}
                className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('materials.new')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un matériau..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les régions</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setRegionFilter('');
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Map View */}
          {showMap && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation des matériaux ({mapLocations.length} matériaux géolocalisés)
                  {mapLocations.filter(loc => loc.warehouseShape).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {mapLocations.filter(loc => loc.warehouseShape).length} avec formes d'entrepôt
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectMap
                  locations={mapLocations}
                  height="500px"
                  defaultZoom={6}
                  className="rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* Materials Grid */}
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Aucun matériau trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || categoryFilter || regionFilter
                    ? "Essayez de modifier vos critères de recherche"
                    : "Commencez par ajouter votre premier matériau"
                  }
                </p>
                <Button onClick={() => navigate('/materials/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un matériau
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => {
                const stockStatus = getStockStatus(material.available_quantity);
                
                return (
                  <Card key={material.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-adrar-900 line-clamp-2">
                          {material.name}
                        </CardTitle>
                        <Badge className={`${stockStatus.color} text-white text-xs`}>
                          {stockStatus.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {material.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Catégorie:</span>
                            <br />
                            <span className="text-gray-600">{material.category}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Unité:</span>
                            <br />
                            <span className="text-gray-600">{material.unit}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Prix:</span>
                            <br />
                            <span className="text-terracotta-600 font-semibold">
                              {material.price_per_unit} MRU
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Stock:</span>
                            <br />
                            <span className="text-gray-600">{material.available_quantity}</span>
                          </div>
                        </div>
                        
                        {material.origin_location && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-600">{material.origin_location}</span>
                          </div>
                        )}

                        <div className="flex gap-2 pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/materials/${material.id}`)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/materials/${material.id}/edit`)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(material.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Materials;
