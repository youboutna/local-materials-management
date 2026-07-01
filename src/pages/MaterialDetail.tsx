import MaterialAvailabilityCard from "@/components/materials/MaterialAvailabilityCard";
import MaterialLocationMap from "@/components/materials/MaterialLocationMap";
import GeoZoneEditorLazy from "@/components/gis/GeoZoneEditor";
import WarehouseShapeTracer from "@/components/materials/WarehouseShapeTracer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMaterialHex } from "@/hooks/hexagonal";
import {
  ArrowLeft,
  Edit,
  Info,
  MapPin,
  Package,
  Warehouse,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout";

const MaterialDetail = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const { material, isLoading: loading } = useMaterialHex(id ?? '');
  const [warehouseShape, setWarehouseShape] = useState<
    { x: number; y: number }[]
  >([]);

  // Parse warehouse shape when material loads
  useEffect(() => {
    if (material?.forme) {
      try {
        const shapeData = JSON.parse(material.forme);
        if (Array.isArray(shapeData)) {
          setWarehouseShape(shapeData);
        }
      } catch (e) {
        console.log("Could not parse warehouse shape data");
      }
    }
  }, [material]);

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

  // Transform material data for components that expect snake_case
  const materialData = {
    id: material.id,
    name: material.name,
    description: material.description,
    category: material.category,
    unit: material.unit,
    price_per_unit: material.pricePerUnit,
    available_quantity: material.availableQuantity,
    origin_location: material.originLocation ?? undefined,
    image: material.image,
    coordinates_latitude: material.coordinatesLatitude ?? undefined,
    coordinates_longitude: material.coordinatesLongitude ?? undefined,
    adresse: typeof material.adresse === 'string' ? material.adresse : undefined,
    forme: material.forme,
    localisation: material.localisation,
  };

  return (
    <AppLayout
      pageTitle={material.name}
      pageDescription={material.category}
      actions={
        <Button asChild>
          <Link to={`/materials/${material.id}/edit`} aria-label={`Modifier ${material.name}`}>
            <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
            Modifier
          </Link>
        </Button>
      }
    >
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link to="/materials" aria-label="Retour à la liste des matériaux">
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Retour
        </Link>
      </Button>

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
                    {material.pricePerUnit.toLocaleString("fr-FR")} MRU/
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
          <MaterialAvailabilityCard material={materialData} />

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
                  <p className="font-medium">{typeof material.adresse === 'string' ? material.adresse : ''}</p>
                </div>
              )}

              {material.originLocation && (
                <div>
                  <p className="text-sm text-gray-600">Origine</p>
                  <p className="font-medium">{material.originLocation}</p>
                </div>
              )}

              {material.coordinatesLatitude &&
                material.coordinatesLongitude && (
                  <div>
                    <p className="text-sm text-gray-600">Coordonnées GPS</p>
                    <p className="font-mono text-sm">
                      {material.coordinatesLatitude.toFixed(6)},{" "}
                      {material.coordinatesLongitude.toFixed(6)}
                    </p>
                  </div>
                )}

              {material.localisation && Array.isArray(material.localisation) && material.localisation.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600">
                    Coordonnées de localisation
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {material.localisation.map((zone: any, index: number) => (
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
          {/* Map — unified GeoZoneEditor (zones if present, fallback to single-point map) */}
          {(() => {
            const zones = (materialData as unknown as { interventionZones?: unknown[]; coverageZones?: unknown[] })
              .coverageZones ?? (materialData as unknown as { interventionZones?: unknown[] }).interventionZones;
            const zoneList = Array.isArray(zones)
              ? (zones as import('@/dtos/entities/InterventionZoneDTO').InterventionZoneDTO[])
              : [];
            console.info('[MaterialsMap] rendered', zoneList.length, 'coverage zones');
            if (zoneList.length > 0) {
              return (
                <GeoZoneEditorLazy
                  readOnly
                  showAddressBar={false}
                  value={zoneList}
                  title="Zones de couverture"
                  height={400}
                />
              );
            }
            return <MaterialLocationMap material={materialData} height="400px" />;
          })()}

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
    </AppLayout>
  );
};

export default MaterialDetail;
