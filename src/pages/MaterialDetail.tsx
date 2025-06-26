
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ProjectMap, { MapLocation } from '@/components/ProjectMap';
import WarehouseShapeTracer from '@/components/materials/WarehouseShapeTracer';
import { ArrowLeft, MapPin, Package, Warehouse, Info, Edit } from 'lucide-react';

interface MaterialDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  origin_location?: string;
  image?: string;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  adresse?: string;
  forme?: string;
  localisation?: any[];
  workspace_id?: string;
}

const MaterialDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [warehouseShape, setWarehouseShape] = useState<{x: number; y: number}[]>([]);

  useEffect(() => {
    if (id) {
      fetchMaterialDetail();
    }
  }, [id]);

  const fetchMaterialDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setMaterial(data);
      
      // Parse warehouse shape if it exists in forme field
      if (data.forme) {
        try {
          const shapeData = JSON.parse(data.forme);
          if (Array.isArray(shapeData)) {
            setWarehouseShape(shapeData);
          }
        } catch (e) {
          console.log('Could not parse warehouse shape data');
        }
      }
    } catch (error) {
      console.error('Error fetching material:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du matériau.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return <Navigate to="/materials" replace />;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
        </div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Matériau non trouvé</h3>
            <p className="text-gray-600 mb-4">
              Le matériau demandé n'existe pas ou a été supprimé.
            </p>
            <Button asChild>
              <Link to="/materials">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux matériaux
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create map location from material data
  const mapLocations: MapLocation[] = [];
  if (material.coordinates_latitude && material.coordinates_longitude) {
    mapLocations.push({
      id: material.id,
      name: material.name,
      type: 'material',
      latitude: material.coordinates_latitude,
      longitude: material.coordinates_longitude,
      adresse: material.adresse,
      region: material.origin_location || 'Non spécifié'
    });
  }

  const availabilityStatus = material.available_quantity > 0 ? 'available' : 'unavailable';
  const availabilityColor = availabilityStatus === 'available' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/materials">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-adrar-900">{material.name}</h1>
            <p className="text-adrar-600">{material.category}</p>
          </div>
        </div>
        <Button asChild>
          <Link to={`/materials/${material.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Information */}
        <div className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{material.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Prix unitaire</p>
                  <p className="font-medium">
                    {material.price_per_unit.toLocaleString('fr-FR')} MRU/{material.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unité de mesure</p>
                  <p className="font-medium">{material.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Availability Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Disponibilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-adrar-900">
                    {material.available_quantity.toLocaleString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">{material.unit} disponibles</p>
                </div>
                <Badge 
                  className={`${availabilityColor} text-white`}
                >
                  {availabilityStatus === 'available' ? 'Disponible' : 'Rupture de stock'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {material.adresse && (
                <div>
                  <p className="text-sm text-gray-600">Adresse</p>
                  <p className="font-medium">{material.adresse}</p>
                </div>
              )}
              
              {material.origin_location && (
                <div>
                  <p className="text-sm text-gray-600">Origine</p>
                  <p className="font-medium">{material.origin_location}</p>
                </div>
              )}

              {material.coordinates_latitude && material.coordinates_longitude && (
                <div>
                  <p className="text-sm text-gray-600">Coordonnées GPS</p>
                  <p className="font-mono text-sm">
                    {material.coordinates_latitude.toFixed(6)}, {material.coordinates_longitude.toFixed(6)}
                  </p>
                </div>
              )}

              {material.localisation && material.localisation.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Zones de stockage</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {material.localisation.map((zone, index) => (
                      <Badge key={index} variant="outline">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warehouse Shape */}
          {warehouseShape.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Forme de l'entrepôt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WarehouseShapeTracer
                  value={warehouseShape}
                  onChange={setWarehouseShape}
                  title="Délimitation actuelle"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Carte de localisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mapLocations.length > 0 ? (
                <ProjectMap
                  locations={mapLocations}
                  height="400px"
                  defaultCenter={[material.coordinates_latitude!, material.coordinates_longitude!]}
                  defaultZoom={12}
                  interactive={true}
                />
              ) : (
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Aucune localisation GPS disponible</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Image */}
          {material.image && (
            <Card>
              <CardHeader>
                <CardTitle>Image du matériau</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/img/material-placeholder.jpg';
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
