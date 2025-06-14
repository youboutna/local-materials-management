import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EnhancedMaterialForm from '@/components/materials/EnhancedMaterialForm';
import InteractiveMap from '@/components/map/InteractiveMap';
import { EnhancedMaterial, Location, OperationalStatus, MAURITANIA_REGIONS } from '@/types/mauritania';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from "@/contexts/LanguageContext";
import WorkspaceCreateDialog from '@/components/workspace/WorkspaceCreateDialog';

const MaterialCreate = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [mapData, setMapData] = useState<{
    center?: { lat: number; lng: number };
    polygon?: { lat: number; lng: number }[];
    warehouseShape?: { lat: number; lng: number }[];
    address?: string;
  }>({});

  // Fetch workspaces from Supabase
  const { data: workspaces = [], refetch: refetchWorkspaces } = useQuery({
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

  // Filter workspaces by selected region
  const filteredWorkspaces = selectedRegion
    ? workspaces.filter(workspace => {
        const region = MAURITANIA_REGIONS.find(r => r.code === selectedRegion);
        return workspace.location === region?.name;
      })
    : workspaces;

  const handleWorkspaceCreated = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    refetchWorkspaces();
  };

  const handleSubmit = async (materialData: Partial<EnhancedMaterial>) => {
    setLoading(true);
    
    try {
      // Validate required fields
      if (!materialData.name) {
        throw new Error(t('materials.error.name_required'));
      }

      // Get region name for location
      const region = MAURITANIA_REGIONS.find(r => r.code === selectedRegion);
      const locationName = region ? region.name : (materialData.location || Location.Nouakchott);

      // Transform enhanced material data to match current database schema
      const dbData = {
        name: materialData.name,
        description: materialData.description || '',
        category: (materialData as any).category || 'Construction',
        unit: materialData.unit || 'kg',
        price_per_unit: materialData.pricePerUnit || 0,
        available_quantity: materialData.availableQuantity || 0,
        origin_location: locationName,
        image: '/img/material-placeholder.jpg',
        workspace_id: materialData.workspaceId || null,
        adresse: mapData.center ? JSON.stringify(mapData.center) : null,
        localisation: mapData.polygon ? JSON.stringify(mapData.polygon) : null,
        forme: mapData.warehouseShape ? JSON.stringify(mapData.warehouseShape) : null,
        coordinates_latitude: mapData.center?.lat || null,
        coordinates_longitude: mapData.center?.lng || null
      };

      console.log('Saving material with location data:', {
        selectedRegion,
        locationName,
        center: mapData.center,
        polygon: mapData.polygon,
        warehouseShape: mapData.warehouseShape,
        dbData: {
          origin_location: dbData.origin_location,
          adresse: dbData.adresse,
          coordinates_latitude: dbData.coordinates_latitude,
          coordinates_longitude: dbData.coordinates_longitude
        }
      });

      const { data, error } = await supabase
        .from('materials')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('materials.toast.created'),
        description: `${t('materials.toast.created_description')} ${materialData.name}`,
      });

      navigate('/materials');
    } catch (error) {
      console.error('Error creating material:', error);
      toast({
        title: t('materials.toast.error'),
        description: error instanceof Error ? error.message : t('materials.toast.error_description'),
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
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column - Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-adrar-900">
                    {t('materials.new')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Region Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-adrar-700">
                      Région/Wilaya
                    </label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setSelectedWorkspaceId(''); // Reset workspace selection when region changes
                      }}
                      className="w-full px-3 py-2 border border-sandstone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                    >
                      <option value="">Sélectionner une région</option>
                      {MAURITANIA_REGIONS.map(region => (
                        <option key={region.code} value={region.code}>
                          {region.name} ({region.nameAr})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Workspace Selection with Add Button */}
                  {selectedRegion && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-adrar-700">
                          Espace de travail
                        </label>
                        <WorkspaceCreateDialog
                          selectedRegion={selectedRegion}
                          onWorkspaceCreated={handleWorkspaceCreated}
                        />
                      </div>
                      <select
                        value={selectedWorkspaceId}
                        onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                        className="w-full px-3 py-2 border border-sandstone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                      >
                        <option value="">Sélectionner un espace de travail</option>
                        {filteredWorkspaces.map(workspace => (
                          <option key={workspace.id} value={workspace.id}>
                            {workspace.name} - {workspace.location}
                          </option>
                        ))}
                      </select>
                      {filteredWorkspaces.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Aucun espace de travail disponible dans cette région. Cliquez sur "Ajouter un espace" pour en créer un.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Enhanced Material Form without submit button */}
                  <EnhancedMaterialForm
                    onSubmit={(data) => handleSubmit({ ...data, workspaceId: selectedWorkspaceId })}
                    workspaces={workspaces}
                    showSubmitButton={false}
                    language={language}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-6">
              <div className="sticky top-24">
                <InteractiveMap
                  value={mapData}
                  onChange={setMapData}
                  title={t('materials.map.title')}
                  description={t('materials.map.description')}
                  allowPolygon={true}
                  allowCoordinateSelection={true}
                  allowWarehouseTracing={true}
                  className="h-[700px]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button at Bottom */}
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={() => {
                // Trigger form submission with current map data
                const formElement = document.querySelector('form');
                if (formElement) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  formElement.dispatchEvent(submitEvent);
                }
              }}
              disabled={loading}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white px-12 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
            >
              {loading ? t('materials.button.loading') : t('materials.button.save')}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
