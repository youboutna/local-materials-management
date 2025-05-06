import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Building, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectMap from '@/components/ProjectMap';
import MaterialSources from '@/components/MaterialSources';

// Sample data for material sources
const materialSourcesData = [
  {
    id: "1",
    name: "Carrière d'Atar",
    type: "Pierre d'Atar",
    location: "Atar, Adrar",
    availability: 85,
    lastUpdated: "2023-12-15",
    coordinates: { latitude: 20.5169, longitude: -13.0499 }
  },
  {
    id: "2",
    name: "Dépôt d'Argile de Chinguetti",
    type: "Argile naturelle",
    location: "Chinguetti, Adrar",
    availability: 62,
    lastUpdated: "2024-01-20",
    coordinates: { latitude: 20.4675, longitude: -12.3675 }
  },
  {
    id: "3",
    name: "Sable du Trarza",
    type: "Sable fin",
    location: "Rosso, Trarza",
    availability: 94,
    lastUpdated: "2024-02-10",
    coordinates: { latitude: 16.5130, longitude: -15.8141 }
  },
  {
    id: "4",
    name: "Pierre calcaire de Zouérat",
    type: "Pierre calcaire",
    location: "Zouérat, Tiris Zemmour",
    availability: 45,
    lastUpdated: "2024-01-05",
    coordinates: { latitude: 22.7324, longitude: -12.4522 }
  }
];

// Map locations that combine both projects and material sources
const mapLocations = [
  ...materialSourcesData.map(source => ({
    id: source.id,
    name: source.name,
    type: 'material' as const,
    latitude: source.coordinates.latitude,
    longitude: source.coordinates.longitude
  })),
  {
    id: "p1",
    name: "Restauration du Fort d'Atar",
    type: 'project' as const,
    latitude: 20.5169,
    longitude: -13.0499
  },
  {
    id: "p2",
    name: "Centre Culturel en Argile",
    type: 'project' as const,
    latitude: 18.0735,
    longitude: -15.9582
  },
  {
    id: "p3",
    name: "École Communautaire Durable",
    type: 'project' as const,
    latitude: 16.6088,
    longitude: -11.4375
  }
];

const Materials = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSources, setFilteredSources] = useState(materialSourcesData);
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredSources(materialSourcesData);
    } else {
      const filtered = materialSourcesData.filter(
        source => 
          source.name.toLowerCase().includes(query.toLowerCase()) ||
          source.type.toLowerCase().includes(query.toLowerCase()) ||
          source.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSources(filtered);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-serif font-bold text-adrar-800"
            >
              Matériaux Locaux
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-adrar-600"
            >
              Gestion des ressources et sources de matériaux de construction locaux
            </motion.p>
          </div>
          
          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-elegant p-4 mb-8"
          >
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
                <Input
                  placeholder="Rechercher un matériau ou une source..."
                  className="pl-9 border-sandstone-200 focus-visible:ring-terracotta-500"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
              
              <Link to="/materials/new">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600 w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle source
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Map section - larger on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <ProjectMap locations={mapLocations} className="h-full" />
            </motion.div>
            
            {/* Materials listing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <MaterialSources sources={filteredSources} className="h-full" />
            </motion.div>
          </div>
          
          {/* Material types section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-serif font-bold text-adrar-800 mb-6">
              Types de matériaux locaux
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
