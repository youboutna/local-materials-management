
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Search, Filter, MapPin, Edit, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location?: string;
  image?: string;
  created_at: string;
}

const Materials = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const categories = [
    'Construction',
    'Électricité',
    'Plomberie',
    'Peinture',
    'Isolation',
    'Carrelage',
    'Menuiserie',
    'Métallerie',
    'Autres'
  ];

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Material interface
      const transformedMaterials: Material[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
        unit: item.unit,
        price_per_unit: item.price_per_unit,
        available_quantity: item.available_quantity,
        origin_location: item.origin_location || undefined, // Convert null to undefined
        image: item.image || undefined,
        created_at: item.created_at,
      }));
      
      setMaterials(transformedMaterials);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les matériaux.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce matériau ?')) return;

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Matériau supprimé",
        description: "Le matériau a été supprimé avec succès.",
      });

      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le matériau.",
        variant: "destructive",
      });
    }
  };

  const handleAddMaterialClick = () => {
    navigate('/materials/create');
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || material.category === selectedCategory;
    const matchesLocation = !selectedLocation || (material.origin_location && material.origin_location === selectedLocation);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const uniqueLocations = Array.from(new Set(materials.map(m => m.origin_location).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
        <Navbar />
        <main className="flex-grow flex items-center justify-center pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adrar-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des matériaux...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6 pt-24">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-terracotta-500" />
                Matériaux
              </h1>
              <p className="text-gray-600 mt-2">
                Gérez votre inventaire de matériaux de construction
              </p>
            </div>
            <Button 
              onClick={handleAddMaterialClick}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un matériau
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Rechercher
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Nom ou description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Catégorie
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Localisation
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les localisations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les localisations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials Grid */}
          {filteredMaterials.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {materials.length === 0 ? 'Aucun matériau' : 'Aucun résultat'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {materials.length === 0 
                    ? 'Commencez par ajouter vos premiers matériaux.'
                    : 'Aucun matériau ne correspond à vos critères de recherche.'
                  }
                </p>
                {materials.length === 0 && (
                  <Button 
                    onClick={handleAddMaterialClick}
                    className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un matériau
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    {material.image && (
                      <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                        <img 
                          src={material.image} 
                          alt={material.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {material.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {material.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{material.category}</Badge>
                        <Badge variant="outline">
                          {material.available_quantity} {material.unit}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Prix unitaire:</span>
                          <span className="font-medium">
                            {material.price_per_unit.toLocaleString('fr-FR')} MRU/{material.unit}
                          </span>
                        </div>
                        
                        {material.origin_location && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">{material.origin_location}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/materials/${material.id}`)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/materials/${material.id}/edit`)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Materials;
