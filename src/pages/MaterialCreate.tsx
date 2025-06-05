
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EnhancedMaterialForm from '@/components/materials/EnhancedMaterialForm';
import InteractiveMap from '@/components/map/InteractiveMap';
import { EnhancedMaterial, Location, OperationalStatus } from '@/types/mauritania';
import { useQuery } from '@tanstack/react-query';

const MaterialCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mapData, setMapData] = useState<{
    center?: { lat: number; lng: number };
    polygon?: { lat: number; lng: number }[];
    warehouseShape?: { lat: number; lng: number }[];
    address?: string;
  }>({});

  // Fetch workspaces from Supabase
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*');
      if (error) throw error;
      return data.map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        location: workspace.location as Location,
        status: workspace.status as OperationalStatus
      }));
    }
  });

  const handleSubmit = async (materialData: Partial<EnhancedMaterial>) => {
    setLoading(true);
    
    try {
      // Validate required fields
      if (!materialData.name) {
        throw new Error('Le nom du matériau est requis');
      }

      // Transform enhanced material data to match current database schema
      const dbData = {
        name: materialData.name,
        description: materialData.description || '',
        category: materialData.category || 'Construction',
        unit: materialData.unit || 'kg',
        price_per_unit: materialData.pricePerUnit || 0,
        available_quantity: materialData.availableQuantity || 0,
        origin_location: materialData.location || Location.Nouakchott,
        image: '/img/material-placeholder.jpg',
        workspace_id: materialData.workspaceId || null,
        localisation: mapData.polygon ? JSON.stringify(mapData.polygon) : null,
        adresse: mapData.center ? JSON.stringify(mapData.center) : null,
        forme: materialData.forme || null,
        warehouse_shape: mapData.warehouseShape ? JSON.stringify(mapData.warehouseShape) : null,
        // Add coordinates if available
        coordinates_latitude: mapData.center?.lat || null,
        coordinates_longitude: mapData.center?.lng || null
      };

      const { data, error } = await supabase
        .from('materials')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Matériau créé",
        description: `Le matériau "${materialData.name}" a été créé avec succès.`,
      });

      navigate('/materials');
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le matériau. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-adrar-900">
                  Créer un nouveau matériau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Enhanced Material Form */}
                <EnhancedMaterialForm
                  onSubmit={handleSubmit}
                  workspaces={workspaces}
                />
              </CardContent>
            </Card>

            {/* Right Column - Map */}
            <div className="space-y-4">
              <InteractiveMap
                value={mapData}
                onChange={setMapData}
                title="Localisation de l'entrepôt"
                description="Définissez la position GPS de l'entrepôt et tracez sa forme et zone de stockage"
                allowPolygon={true}
                allowCoordinateSelection={true}
                allowWarehouseTracing={true}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
