
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

type Material = Database['public']['Tables']['materials']['Row'];
type Workspace = Database['public']['Tables']['workspaces']['Row'];

const Materials = () => {
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
        title: "Matériau supprimé",
        description: "Le matériau a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériau.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteMaterial = (materialId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce matériau ?')) {
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

  // Convert materials to map locations
  const materialLocations: MapLocation[] = useMemo(() => {
    return filteredMaterials
      .filter(material => (material as any).coordinates_latitude && (material as any).coordinates_longitude)
      .map(material => ({
        id: (material as any).id,
        name: (material as any).name,
        type: 'material' as const,
        latitude: Number((material as any).coordinates_latitude!),
        longitude: Number((material as any).coordinates_longitude!),
        region: (material as any).origin_location || ''
      }));
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
            <p className="text-adrar-600">Chargement des matériaux...</p>
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
            <p className="text-red-600 mb-4">Erreur lors du chargement des matériaux</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
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
              Matériaux de construction
            </motion.h1>
            
            <Link to="/materials/create">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau matériau
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un matériau..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortOption} onValueChange={setSortOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nom</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="quantity">Quantité</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Materials View */}
          <Tabs defaultValue="grid" className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="grid" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Grille
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Carte
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
                              <span>Prix unitaire:</span>
                              <span className="font-medium">
                                {Number((material as any).price_per_unit).toLocaleString()} MRU/{(material as any).unit}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Disponible:</span>
                              <span className="font-medium">
                                {Number((material as any).available_quantity)} {(material as any).unit}
                              </span>
                            </div>

                            {/* --- Espace de travail et localisation --- */}
                            <div className="flex items-center gap-2 mt-2">
                              <MapPin className="h-4 w-4 text-terracotta-500" />
                              <span className="font-semibold">Espace de travail:</span>
                              <span>
                                {(material as any).workspace?.name || (
                                  <span className="italic text-gray-400">Non défini</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Localisation de l'entrepôt:</span>
                              <span>
                                {Array.isArray((material as any).localisation) && (material as any).localisation.length > 0
                                  ? (material as any).localisation.map((r: any) => r.name).join(', ')
                                  : (material as any).origin_location || 'Non défini'}
                              </span>
                            </div>
                            {(material as any).adresse && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Adresse (Lat/Lng):</span>
                                <span>
                                  {((material as any).adresse.lat).toFixed(5)}, {((material as any).adresse.lng).toFixed(5)}
                                </span>
                              </div>
                            )}
                            {(material as any).forme && (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Forme:</span>
                                <span>{(material as any).forme}</span>
                              </div>
                            )}
                            {/* --- End Espace de travail et localisation --- */}
                          </div>
                          <div className="flex justify-between mt-4">
                            <Button variant="outline" size="sm">
                              Modifier
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMaterial((material as any).id)}
                              disabled={deleteMaterial.isPending}
                            >
                              {deleteMaterial.isPending ? 'Suppression...' : 'Supprimer'}
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
                  <h3 className="text-lg font-medium text-adrar-800 mb-2">Aucun matériau trouvé</h3>
                  <p className="text-adrar-600 mb-4">
                    {searchQuery || categoryFilter !== 'all' 
                      ? 'Aucun matériau ne correspond à vos critères de recherche.'
                      : 'Commencez par ajouter votre premier matériau.'
                    }
                  </p>
                  <Link to="/materials/create">
                    <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un matériau
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
                      <h3 className="text-lg font-medium text-adrar-800 mb-2">Aucun matériau géolocalisé</h3>
                      <p className="text-adrar-600">
                        Les matériaux avec des coordonnées géographiques s'afficheront ici.
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
