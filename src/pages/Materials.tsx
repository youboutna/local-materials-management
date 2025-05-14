
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, MapPin } from 'lucide-react';
import Footer from '@/components/Footer';
import ProjectMap from '@/components/ProjectMap';
import MaterialSources from '@/components/MaterialSources';
import CustomNavbar from '@/components/CustomNavbar';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MapLocation } from '@/components/ProjectMap';

// Sample data structure for material sources
interface MaterialSource {
  id: string;
  name: string;
  type: string;
  location: string;
  availability: number;
  lastUpdated: string;
  coordinates: { latitude: number; longitude: number };
}

const Materials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  
  // Fetch materials and projects from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch materials
        const { data: materialsData, error: materialsError } = await supabase
          .from('materials')
          .select('*');
        
        if (materialsError) throw materialsError;
        
        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, status, coordinates_latitude, coordinates_longitude, location, start_date');
          
        if (projectsError) throw projectsError;
        
        // Fetch project materials to know which materials are used in which projects
        const { data: projectMaterialsData, error: projectMaterialsError } = await supabase
          .from('project_materials')
          .select('project_id, material_id, quantity');
          
        if (projectMaterialsError) throw projectMaterialsError;
        
        // Set materials data
        setMaterials(materialsData || []);
        setFilteredMaterials(materialsData || []);
        
        // Create map locations from materials and projects
        const locations: MapLocation[] = [
          // Add material locations
          ...(materialsData || []).map(material => ({
            id: `material-${material.id}`,
            name: material.name,
            type: 'material' as const,
            latitude: extractCoordinates(material.origin_location)?.latitude || 0,
            longitude: extractCoordinates(material.origin_location)?.longitude || 0,
            region: material.origin_location?.split(',')[0] || material.category
          })).filter(loc => loc.latitude !== 0 && loc.longitude !== 0),
          
          // Add project locations
          ...(projectsData || [])
            .filter(project => project.coordinates_latitude && project.coordinates_longitude)
            .map(project => ({
              id: `project-${project.id}`,
              name: project.title,
              type: 'project' as const,
              latitude: Number(project.coordinates_latitude),
              longitude: Number(project.coordinates_longitude),
              status: project.status as any,
              region: project.location || '',
              startDate: project.start_date ? String(project.start_date) : undefined,
              endDate: undefined
            }))
        ];
        
        setMapLocations(locations);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Helper function to extract coordinates from location string
  const extractCoordinates = (locationString?: string) => {
    if (!locationString) return null;
    
    const latMatch = locationString.match(/Lat:\s*(-?\d+(\.\d+)?)/i);
    const longMatch = locationString.match(/Long:\s*(-?\d+(\.\d+)?)/i);
    
    if (latMatch && longMatch) {
      return {
        latitude: parseFloat(latMatch[1]),
        longitude: parseFloat(longMatch[1])
      };
    }
    
    return null;
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(
        material => 
          material.name.toLowerCase().includes(query.toLowerCase()) ||
          material.category.toLowerCase().includes(query.toLowerCase()) ||
          material.origin_location?.toLowerCase().includes(query.toLowerCase()) ||
          material.description?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMaterials(filtered);
      
      // Update map to only show matching materials
      const updatedLocations = mapLocations.filter(location => {
        // Always keep projects visible
        if (location.type === 'project') return true;
        
        // For materials, check if they match the search query
        const materialId = location.id.replace('material-', '');
        const matchingMaterial = filtered.find(m => m.id === materialId);
        return !!matchingMaterial;
      });
      
      setMapLocations(updatedLocations);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <CustomNavbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-serif font-bold text-adrar-800"
          >
            {t('materials.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-adrar-600"
          >
            {t('materials.subtitle')}
          </motion.p>
          
          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-elegant p-4 mb-8 mt-4"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                <Input
                  placeholder={t('materials.search')}
                  className="pl-9 border-sandstone-200 focus-visible:ring-terracotta-500"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <Link to="/materials/new">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600 w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('materials.add')}
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-terracotta-500"></div>
            </div>
          ) : (
            /* Main content */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Map section - larger on desktop */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="lg:col-span-2 h-[500px] bg-white rounded-lg shadow overflow-hidden"
              >
                <ProjectMap locations={mapLocations} defaultCenter={[20.5169, -13.0499]} defaultZoom={5} interactive className="h-full" />
              </motion.div>
              
              {/* Materials listing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                {filteredMaterials.length > 0 ? (
                  <div className="bg-white rounded-lg shadow p-4 h-[500px] overflow-auto">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <MapPin className="mr-2 h-4 w-4" />
                      Sources de matériaux ({filteredMaterials.length})
                    </h3>
                    <div className="space-y-3">
                      {filteredMaterials.map((material) => (
                        <div 
                          key={material.id} 
                          className="border rounded-md p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            // Find the map location for this material
                            const materialLocation = mapLocations.find(loc => loc.id === `material-${material.id}`);
                            if (materialLocation && materialLocation.latitude && materialLocation.longitude) {
                              // TODO: Center map on this material if needed
                            }
                          }}
                        >
                          <div className="flex justify-between">
                            <h4 className="font-medium">{material.name}</h4>
                            <span className="text-sm bg-blue-100 text-blue-800 rounded-full px-2">{material.category}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {material.origin_location || "Aucun emplacement spécifié"}
                          </div>
                          <div className="flex justify-between mt-2 text-sm">
                            <span>Stock: {material.available_quantity} {material.unit}</span>
                            <span className="font-medium text-terracotta-600">{material.price_per_unit} MRU/{material.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-8 text-center h-[500px] flex flex-col justify-center items-center">
                    <div className="text-gray-400 mb-4">
                      <Search className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Aucun matériau trouvé</h3>
                    <p className="text-gray-500">Essayez d'autres termes de recherche ou ajoutez de nouveaux matériaux.</p>
                    <Link to="/materials/new">
                      <Button className="mt-4 bg-terracotta-500 hover:bg-terracotta-600">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un matériau
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          )}
          
          {/* Material types section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-serif font-bold text-adrar-800 mb-6">
              {t('materials.types')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Pierre d'Atar",
                  description: "Pierre naturelle locale extraite des carrières d'Atar, idéale pour les constructions durables et traditionnelles",
                  image: "/img/project1.jpg"
                },
                {
                  title: "Argile",
                  description: "Matériau traditionnel polyvalent utilisé pour la construction d'habitations et de structures communautaires",
                  image: "/img/project3.jpg"
                },
                {
                  title: "Sable de dune",
                  description: "Sable fin utilisé dans les mélanges de mortier et de béton pour les constructions locales",
                  image: "/img/project5.jpg"
                }
              ].map((material, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={material.image} 
                      alt={material.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="font-serif text-adrar-800">{material.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-adrar-600 text-sm">{material.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Materials;
