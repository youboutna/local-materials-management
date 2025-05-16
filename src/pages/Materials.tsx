
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';

// Fix leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define the Material interface
interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  price_per_unit: number;
  unit: string;
  available_quantity: number;
  image: string | null;
  origin_location: string | null;
  coordinates_latitude?: number | null;
  coordinates_longitude?: number | null;
  created_at: string;
  updated_at: string;
}

const Materials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('materials')
          .select('*')
          .order('name');

        if (error) throw error;

        // Process data and set state
        const materialsWithCoordinates = (data || []).map((material) => ({
          ...material,
          coordinates_latitude: material.coordinates_latitude || null,
          coordinates_longitude: material.coordinates_longitude || null
        }));
        
        setMaterials(materialsWithCoordinates);
      } catch (error) {
        console.error('Error fetching materials:', error);
        toast({
          title: 'Error',
          description: 'Failed to load materials',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [toast]);

  const mapCenter: [number, number] = [18.0735, -15.9582]; // Nouakchott

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Matériaux</h1>
          <Link to="/materials/create">
            <Button className="bg-terracotta-500 hover:bg-terracotta-600">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un matériau
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-terracotta-500" />
          </div>
        ) : (
          <>
            {/* Map showing material origins */}
            <Card className="mb-8">
              <CardContent className="p-0">
                <div className="h-[400px] w-full">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={6} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                    />
                    
                    {materials.map(material => 
                      material.coordinates_latitude && material.coordinates_longitude ? (
                        <Marker 
                          key={material.id}
                          position={[material.coordinates_latitude, material.coordinates_longitude]}
                        >
                          <Popup>
                            <strong>{material.name}</strong>
                            <p>{material.origin_location}</p>
                          </Popup>
                        </Marker>
                      ) : null
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Material grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((material) => (
                <Card key={material.id} className="overflow-hidden">
                  <div className="h-48 bg-gray-100 relative">
                    {material.image ? (
                      <img 
                        src={material.image} 
                        alt={material.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-1">{material.name}</h3>
                    <div className="text-sm text-gray-500 mb-2">Catégorie: {material.category}</div>
                    <p className="text-sm mb-3 line-clamp-2">{material.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-terracotta-600">
                        {material.price_per_unit} MRU/{material.unit}
                      </span>
                      <span className="text-sm bg-adrar-100 text-adrar-800 px-2 py-1 rounded">
                        Stock: {material.available_quantity} {material.unit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Materials;
