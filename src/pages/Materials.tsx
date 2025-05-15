import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectMap from '@/components/ProjectMap';
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { supabase } from '@/integrations/supabase/client';

// Define the Material type to match what we're getting from Supabase
interface Material {
  id: string;
  name: string;
  category: string;
  price_per_unit: number;
  available_quantity: number;
  image: string | null;
  origin_location: string | null;
  coordinates_latitude?: number | null;
  coordinates_longitude?: number | null;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const [mapLocations, setMapLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        setMaterials(data as Material[]);
        const locations = data.map(item => ({
          id: item.id,
          name: item.name,
          type: 'material' as const,
          latitude: item.coordinates_latitude ?? 0,
          longitude: item.coordinates_longitude ?? 0,
          region: item.origin_location || '',
        })).filter(item => item.latitude !== 0 && item.longitude !== 0);
        setMapLocations(locations);
      }
    } catch (error: any) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des matériaux.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center justify-between"
          >
            <h1 className="text-3xl font-serif font-bold text-adrar-900">Matériaux</h1>
            <Link to="/materials/create">
              <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un matériau
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <Input
              type="text"
              placeholder="Rechercher un matériau..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-xl shadow-elegant overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-500">
                Chargement des matériaux...
              </div>
            ) : (
              <Table>
                <TableCaption>Liste des matériaux disponibles.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix par unité</TableHead>
                    <TableHead>Quantité disponible</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={material.image || "/img/project-placeholder.jpg"} />
                          <AvatarFallback>
                            <Search />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>{material.price_per_unit} MRU</TableCell>
                      <TableCell>{material.available_quantity}</TableCell>
                      <TableCell>
                        <Link to={`/materials/${material.id}`}>
                          <Button variant="secondary" size="sm">
                            Voir détails
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={6}>
                      {filteredMaterials.length} matériaux au total
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
          </motion.div>

          {mapLocations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              <h2 className="text-2xl font-serif font-bold text-adrar-900 mb-4">
                Localisation des matériaux
              </h2>
              <div className="h-[400px] rounded-xl overflow-hidden shadow-elegant">
                <ProjectMap locations={mapLocations} interactive={true} />
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Materials;
