import React, { useState, useEffect, useRef } from 'react';
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
  const [formData, setFormData] = useState<Partial<EnhancedMaterial>>({});
  const formRef = useRef<any>(null);
  const [mapData, setMapData] = useState<{
    center?: { lat: number; lng: number };
    polygon?: { lat: number; lng: number }[];
    warehouseShape?: { lat: number; lng: number }[];
    address?: string;
    warehouseShapeType?: 'polygon' | 'rectangle' | 'circle';
  }>({});

  // Regional coordinates for Mauritania wilayas
  const REGION_COORDINATES = {
    'NKC': [18.0735, -15.9582], // Nouakchott
    'NDB': [20.9000, -17.0347], // Nouadhibou
    'ADR': [20.5279, -10.0309], // Adrar
    'ASB': [16.3333, -11.0000], // Assaba
    'BRK': [16.5500, -12.8833], // Brakna
    'DKL': [21.0000, -17.0000], // Dakhlet Nouadhibou
    'GRL': [16.2500, -11.7500], // Gorgol
    'GDM': [15.7500, -12.2500], // Guidimaka
    'HEC': [18.5000, -7.0000],  // Hodh Ech Chargui
    'HEG': [16.5000, -9.5000],  // Hodh El Gharbi
    'ICH': [19.5000, -16.0000], // Inchiri
    'TAG': [18.5000, -9.5000],  // Tagant
    'TZM': [22.6667, -11.4000], // Tiris Zemmour
    'TRZ': [17.5000, -15.5000]  // Trarza
  } as const;

  // Update map center when region changes
  useEffect(() => {
    if (selectedRegion && REGION_COORDINATES[selectedRegion as keyof typeof REGION_COORDINATES]) {
      const [lat, lng] = REGION_COORDINATES[selectedRegion as keyof typeof REGION_COORDINATES];
      setMapData(prev => ({
        ...prev,
        center: { lat, lng }
      }));
    }
  }, [selectedRegion]);

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

  const handleFormDataChange = (data: Partial<EnhancedMaterial>) => {
    console.log('Form data changed:', data);
    setFormData(data);
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    console.log('Form data:', formData);
    console.log('Selected region:', selectedRegion);
    console.log('Map data:', mapData);
    
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error(t('materials.error.name_required'));
      }

      // Get region name for location
      const region = MAURITANIA_REGIONS.find(r => r.code === selectedRegion);
      const locationName = region ? region.name : (formData.location || Location.Nouakchott);

      // Transform enhanced material data to match current database schema
      const dbData = {
        name: formData.name,
        description: formData.description || '',
        category: (formData as any).category || 'Construction',
        unit: formData.unit || 'kg',
        price_per_unit: formData.pricePerUnit || 0,
        available_quantity: formData.availableQuantity || 0,
        origin_location: locationName,
        image: '/img/material-placeholder.jpg',
        workspace_id: selectedWorkspaceId || null,
        adresse: mapData.center ? JSON.stringify(mapData.center) : null,
        localisation: mapData.polygon ? JSON.stringify(mapData.polygon) : null,
        forme: mapData.warehouseShape ? 
          (mapData.warehouseShapeType || 'polygon') : null,
        coordinates_latitude: mapData.center?.lat || null,
        coordinates_longitude: mapData.center?.lng || null
      };

      console.log('Saving material with enhanced location data:', {
        selectedRegion,
        locationName,
        center: mapData.center,
        polygon: mapData.polygon,
        warehouseShape: mapData.warehouseShape,
        warehouseShapeType: mapData.warehouseShapeType,
        formData,
        dbData
      });

      const { data, error } = await supabase
        .from('materials')
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('materials.toast.created'),
        description: `${t('materials.toast.created_description')} ${formData.name}`,
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

  // Check if form is ready for submission
  const isFormValid = selectedRegion && formData.name && formData.name.length > 0;

  console.log('Form validation:', {
    selectedRegion,
    formDataName: formData.name,
    isFormValid,
    loading
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-32">
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
                    ref={formRef}
                    onSubmit={handleFormDataChange}
                    workspaces={workspaces}
                    showSubmitButton={false}
                    language={language}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Enhanced Interactive Map */}
            <div className="space-y-6">
              <div className="sticky top-24">
                <InteractiveMap
                  value={mapData}
                  onChange={setMapData}
                  title="Position GPS et forme de l'entrepôt"
                  description={selectedRegion ? 
                    `Définissez la position GPS et tracez la forme de stockage pour la région ${MAURITANIA_REGIONS.find(r => r.code === selectedRegion)?.name || selectedRegion}` :
                    "Sélectionnez d'abord une région pour positionner l'entrepôt"
                  }
                  allowPolygon={true}
                  className="h-[600px]"
                />
                
                {/* Map Status Information */}
                {selectedRegion && mapData.center && (
                  <Card className="mt-4">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Région:</span>
                          <span>{MAURITANIA_REGIONS.find(r => r.code === selectedRegion)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">GPS:</span>
                          <span>{mapData.center.lat.toFixed(4)}, {mapData.center.lng.toFixed(4)}</span>
                        </div>
                        {mapData.polygon && (
                          <div className="flex justify-between">
                            <span className="font-medium">Zone délimitée:</span>
                            <span>{mapData.polygon.length} points</span>
                          </div>
                        )}
                        {mapData.warehouseShape && (
                          <div className="flex justify-between">
                            <span className="font-medium">Forme entrepôt:</span>
                            <span>{mapData.warehouseShapeType || 'polygon'} - {mapData.warehouseShape.length} points</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button at Bottom with proper spacing */}
          <div className="mt-12 mb-8 flex justify-center">
            <Button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="bg-gradient-to-r from-terracotta-500 to-adrar-600 hover:from-terracotta-600 hover:to-adrar-700 text-white px-12 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
            >
              {loading ? t('materials.button.loading') : 'Enregistrer le matériau'}
            </Button>
          </div>
          
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
              <p><strong>Debug Info:</strong></p>
              <p>Selected Region: {selectedRegion}</p>
              <p>Form Name: {formData.name || 'Not set'}</p>
              <p>Is Valid: {isFormValid ? 'Yes' : 'No'}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MaterialCreate;
