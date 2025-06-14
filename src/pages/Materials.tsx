import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, MapPin, Package, DollarSign, Truck, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectMap, { MapLocation } from '@/components/ProjectMap';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';
import { useLanguage } from '@/contexts/LanguageContext';

type Material = Database['public']['Tables']['materials']['Row'];
type Workspace = Database['public']['Tables']['workspaces']['Row'];

// Enhanced MapLocation interface to include warehouse shape data
interface EnhancedMapLocation extends MapLocation {
  warehouseShape?: { lat: number; lng: number }[];
  warehouseShapeType?: 'polygon' | 'rectangle' | 'circle';
  adresse?: string;
}

const Materials = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const queryClient = useQueryClient();

  // Fetch materials with workspaces from Supabase
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          workspace:workspaces(
            id,
            name,
            location,
            status,
            contact_manager,
            contact_phone
          )
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch workspaces from Supabase
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Delete material mutation
  const deleteMaterial = useMutation({
    mutationFn: async (materialId: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast({
        title: t("materials.deleted"),
        description: t("materials.deleted_success"),
      });
    },
    onError: (error) => {
      toast({
        title: t("materials.error"),
        description: t("materials.delete_error"),
        variant: "destructive",
      });
    }
  });

  const handleDeleteMaterial = (materialId: string) => {
    if (window.confirm(t("materials.confirm_delete"))) {
      deleteMaterial.mutate(materialId);
    }
  };

  // Filter and sort materials
  const filteredMaterials = materials
    .filter(material => {
      const matchesSearch = (material as any).name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (material as any).description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || (material as any).category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'price':
          return Number((a as any).price_per_unit) - Number((b as any).price_per_unit);
        case 'quantity':
          return Number((b as any).available_quantity) - Number((a as any).available_quantity);
        case 'name':
        default:
          return (a as any).name?.localeCompare((b as any).name) || 0;
      }
    });

  // Convert materials to enhanced map locations with warehouse shapes
  const materialLocations: EnhancedMapLocation[] = useMemo(() => {
    console.log('Processing materials for map:', filteredMaterials.length);
    
    return filteredMaterials
      .filter(material => {
        const hasCoords = (material as any).coordinates_latitude && (material as any).coordinates_longitude;
        console.log(`Material ${(material as any).name}: hasCoords=${hasCoords}, localisation=`, (material as any).localisation);
        return hasCoords;
      })
      .map(material => {
        const baseLocation: EnhancedMapLocation = {
          id: (material as any).id,
          name: (material as any).name,
          type: 'material' as const,
          latitude: Number((material as any).coordinates_latitude!),
          longitude: Number((material as any).coordinates_longitude!),
          region: (material as any).origin_location || '',
          adresse: (material as any).adresse || ''
        };

        // Add warehouse shape data if available
        const localisation = (material as any).localisation;
        console.log(`Processing localisation for ${(material as any).name}:`, localisation);
        
        if (localisation && Array.isArray(localisation)) {
          // Check if any item in the localisation array has warehouseShape
          for (const item of localisation) {
            if (item && item.warehouseShape && Array.isArray(item.warehouseShape) && item.warehouseShape.length > 0) {
              console.log(`Found warehouse shape for ${(material as any).name}:`, item.warehouseShape);
              baseLocation.warehouseShape = item.warehouseShape;
              baseLocation.warehouseShapeType = item.warehouseShapeType || 'polygon';
              break;
            }
          }
        }
        
        // Also check if localisation is directly a warehouse shape object
        if (localisation && typeof localisation === 'object' && !Array.isArray(localisation)) {
          if (localisation.warehouseShape && Array.isArray(localisation.warehouseShape) && localisation.warehouseShape.length > 0) {
            console.log(`Found direct warehouse shape for ${(material as any).name}:`, localisation.warehouseShape);
            baseLocation.warehouseShape = localisation.warehouseShape;
            baseLocation.warehouseShapeType = localisation.warehouseShapeType || 'polygon';
          }
        }

        console.log(`Final location for ${(material as any).name}:`, baseLocation);
        return baseLocation;
      });
  }, [filteredMaterials]);

  // Get unique categories
  const categories = [...new Set(materials.map(m => (m as any).category))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">{t("materials.loading")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{t("materials.error_loading")}</p>
            <Button onClick={() => window.location.reload()}>
              {t("materials.retry")}
            </Button>
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
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center mb-6">
            <motion.h1 
              className="text-3xl font-bold text-adrar-900 font-serif"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {t("materials.title")}
            </motion.h1>
            
            <Link to="/materials/create">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                <Plus className="h-4 w-4 mr-2" />
                {t("materials.add")}
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t("materials.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("materials.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("materials.all_categories")}</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue placeholder={t("materials.sort_by")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t("materials.sort.name")}</SelectItem>
                  <SelectItem value="price">{t("materials.sort.price")}</SelectItem>
                  <SelectItem value="quantity">{t("materials.sort.quantity")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Materials View */}
          <Tabs defaultValue="grid" className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("materials.grid")}
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("materials.map")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid" className="mt-6">
              {filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMaterials.map((material, index) => (
                    <motion.div
                      key={(material as any).id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                          <img 
                            src={(material as any).image || '/img/material-placeholder.jpg'}
                            alt={(material as any).name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-adrar-800 line-clamp-1">
                              {(material as any).name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {(material as any).category}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {(material as any).description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm text-adrar-600">
                            <div className="flex justify-between">
                              <span>{t("materials.unit_price")}:</span>
                              <span className="font-medium">
                                {Number((material as any).price_per_unit).toLocaleString()} MRU/{(material as any).unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("materials.available")}:</span>
                              <span className="font-medium">
                                {Number((material as any).available_quantity)} {(material as any).unit}
                              </span>
                            </div>

                            {/* --- Espace de travail et localisation --- */}
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-terracotta-500" />
                              <span className="font-semibold">{t("materials.workspace")}:</span>
                              <span>
                                {(material as any).workspace?.name || (
                                  <span className="italic text-gray-400">{t("materials.not_defined")}</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{t("materials.warehouse_location")}:</span>
                              <span>
                                {Array.isArray((material as any).localisation) && (material as any).localisation.length > 0
                                  ? (material as any).localisation.map((r: any) => r.name).join(', ')
                                  : (material as any).origin_location || t("materials.not_defined")}
                              </span>
                            </div>
                            {(material as any).adresse && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{t("materials.address")}:</span>
                                <span>{(material as any).adresse}</span>
                              </div>
                            )}
                            {(material as any).forme && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{t("materials.shape")}:</span>
                                <span>{(material as any).forme}</span>
                              </div>
                            )}
                            {/* --- End Espace de travail et localisation --- */}
                          </div>
                          <div className="flex justify-between mt-4">
                            <Link to={`/materials/${(material as any).id}/edit`}>
                              <Button variant="outline" size="sm">
                                {t("materials.edit")}
                              </Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMaterial((material as any).id)}
                              disabled={deleteMaterial.isPending}
                            >
                              {deleteMaterial.isPending ? t("materials.deleting") : t("materials.delete")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-adrar-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-adrar-800 mb-2">{t("materials.none_found")}</h3>
                  <p className="text-adrar-600 mb-4">
                    {searchQuery || categoryFilter !== 'all' 
                      ? t("materials.no_match")
                      : t("materials.add_first")
                    }
                  </p>
                  <Link to="/materials/create">
                    <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("materials.add")}
                    </Button>
                  </Link>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="map" className="mt-6">
              <div className="h-[600px]">
                {materialLocations.length > 0 ? (
                  <ProjectMap
                    locations={materialLocations}
                    defaultCenter={[18.079052, -15.965634]} // Nouakchott, Mauritania
                    defaultZoom={6}
                    height="600px"
                    className="rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-elegant p-8 text-center h-full flex items-center justify-center">
                    <div>
                      <MapPin className="h-12 w-12 text-adrar-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-adrar-800 mb-2">{t("materials.no_geolocated")}</h3>
                      <p className="text-adrar-600">
                        {t("materials.geolocated_hint")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Materials;
