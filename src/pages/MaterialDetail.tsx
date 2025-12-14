import MaterialAvailabilityCard from "@/components/materials/MaterialAvailabilityCard";
import MaterialLocationMap from "@/components/materials/MaterialLocationMap";
import WarehouseShapeTracer from "@/components/materials/WarehouseShapeTracer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Edit,
  Info,
  MapPin,
  Package,
  Warehouse,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

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
  const [warehouseShape, setWarehouseShape] = useState<
    { x: number; y: number }[]
  >([]);

  useEffect(() => {
    if (id) {
      fetchMaterialDetail();
    }
  }, [id]);

  const fetchMaterialDetail = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the Supabase data to match our interface
      const transformedMaterial: MaterialDetail = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        unit: data.unit,
        price_per_unit: data.price_per_unit,
        available_quantity: data.available_quantity,
        origin_location: data.origin_location || undefined,
        image: data.image || undefined,
        coordinates_latitude: data.coordinates_latitude || undefined,
        coordinates_longitude: data.coordinates_longitude || undefined,
        adresse: typeof data.adresse === "string" ? data.adresse : undefined,
        forme: data.forme || undefined,
        localisation: Array.isArray(data.localisation) ? data.localisation : [],
        workspace_id: data.workspace_id || undefined,
      };

      setMaterial(transformedMaterial);

      // Parse warehouse shape if it exists in forme field
      if (transformedMaterial.forme) {
        try {
          const shapeData = JSON.parse(transformedMaterial.forme);
          if (Array.isArray(shapeData)) {
            setWarehouseShape(shapeData);
          }
        } catch (e) {
          console.log("Could not parse warehouse shape data");
        }
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      toast({
        title: t('common.error'),
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Matériau non trouvé
            </h3>
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

  return (
    <div className="container mx-auto px-4 py-16">
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
            <h1 className="text-2xl font-bold text-adrar-900">
              {material.name}
            </h1>
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
                    {material.price_per_unit.toLocaleString("fr-FR")} MRU/
                    {material.unit}
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
          <MaterialAvailabilityCard material={material} />

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

              {material.coordinates_latitude &&
                material.coordinates_longitude && (
                  <div>
                    <p className="text-sm text-gray-600">Coordonnées GPS</p>
                    <p className="font-mono text-sm">
                      {material.coordinates_latitude.toFixed(6)},{" "}
                      {material.coordinates_longitude.toFixed(6)}
                    </p>
                  </div>
                )}

              {material.localisation && material.localisation.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">
                    Coordonnées de localisation
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {material.localisation.map((zone, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="font-mono text-xs"
                      >
                        {typeof zone === "object" && zone.lat && zone.lng
                          ? `${zone.lat.toFixed(4)}, ${zone.lng.toFixed(4)}`
                          : String(zone)}
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

        {/* Map and Image */}
        <div className="space-y-6">
          {/* Map */}
          <MaterialLocationMap material={material} height="400px" />

          {/* Material Image */}
          <Card>
            <CardHeader>
              <CardTitle>Image du matériau</CardTitle>
            </CardHeader>
            <CardContent>
              {material?.image && material.image.length > 0 ? (
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src =
                      window.location.origin + "/img/material-placeholder.jpg";
                  }}
                />
              ) : (
                <img
                  src={window.location.origin + "/img/material-placeholder.jpg"}
                  alt={material.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MaterialDetail;
