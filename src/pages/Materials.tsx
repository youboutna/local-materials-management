
import { useState, useEffect } from 'react';
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
import ProjectMap, { statusColors } from '@/components/ProjectMap';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

const Materials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const queryClient = useQueryClient();

  // Fetch materials from Supabase
  const { data: materials = [], isLoading, error } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Material[];
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
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           material.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || material.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'price':
          return a.price_per_unit - b.price_per_unit;
        case 'quantity':
          return b.available_quantity - a.available_quantity;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Get unique categories
  const categories = [...new Set(materials.map(m => m.category))];

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
                      key={material.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                          <img 
                            src={material.image || '/img/material-placeholder.jpg'}
                            alt={material.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg text-adrar-800 line-clamp-1">
                              {material.name}
                            </CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {material.category}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {material.description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="space-y-2 text-sm text-adrar-600">
                            <div className="flex justify-between">
                              <span>Prix unitaire:</span>
                              <span className="font-medium">
                                {material.price_per_unit.toLocaleString()} MRU/{material.unit}
                              </span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span>Disponible:</span>
                              <span className="font-medium">
                                {material.available_quantity} {material.unit}
                              </span>
                            </div>
                            
                            {material.origin_location && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-terracotta-500" />
                                <span className="text-xs">{material.origin_location}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between mt-4">
                            <Button variant="outline" size="sm">
                              Modifier
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMaterial(material.id)}
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
                <p className="text-center text-adrar-600 mb-4">
                  Carte des matériaux (fonctionnalité à venir)
                </p>
                <div className="bg-white rounded-xl shadow-elegant p-8 text-center h-full flex items-center justify-center">
                  <div>
                    <MapPin className="h-12 w-12 text-adrar-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-adrar-800 mb-2">Carte des matériaux</h3>
                    <p className="text-adrar-600">
                      Cette fonctionnalité sera bientôt disponible pour visualiser la distribution géographique des matériaux.
                    </p>
                  </div>
                </div>
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
