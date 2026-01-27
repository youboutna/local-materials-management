import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Map, MapPin, Grid } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ProjectMap from "@/components/ProjectMap";
import { MapLocation } from "@/components/ProjectMap";
import MaterialFilters from "@/components/materials/MaterialFilters";
import MaterialGrid from "@/components/materials/MaterialGrid";
import { usePagination } from "@/hooks/usePagination";
import { useMaterialsFilter } from "@/hooks/useMaterialsFilter";
import InteractiveMaterialFilters from "@/components/materials/InteractiveMaterialFilters";
import InteractiveMaterialsList from "@/components/materials/InteractiveMaterialsList";
import EnhancedInteractiveMaterialMap from "@/components/materials/EnhancedInteractiveMaterialMap";
import { ElectricSpinner } from "@/components/loading-page";
import { useMaterialsHex } from "@/hooks/hexagonal";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  image?: string;
  origin_location?: string;
  minimum_quantity?: number;
  local_type?: string;
  adresse?: string | any; // Can be string or jsonb from database
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  forme?: string;
  localisation?: any;
  is_active?: boolean;
}

const Materials: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Use hexagonal architecture hook
  const { materials: hexMaterials, loading: isLoading, error } = useMaterialsHex();
  
  // Map domain entities to local Material interface for compatibility
  const materials: Material[] = useMemo(() => 
    hexMaterials.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      unit: m.unit,
      price_per_unit: m.pricePerUnit,
      available_quantity: m.availableQuantity,
      image: m.image ?? undefined,
      origin_location: m.originLocation ?? undefined,
      adresse: m.adresse ?? undefined,
      coordinates_latitude: m.coordinatesLatitude ?? undefined,
      coordinates_longitude: m.coordinatesLongitude ?? undefined,
      forme: m.forme ?? undefined,
      localisation: m.localisation ?? undefined,
    }))
  , [hexMaterials]);
  
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);

  // Use the custom hook for filtering with debouncing
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    selectedLocalType,
    filteredMaterials,
    interactiveSearchTerm,
    setInteractiveSearchTerm,
    selectedInteractiveCategory,
    selectedRegion,
    selectedStockLevel,
    filteredInteractiveMaterials,
    categories,
    localTypes,
    regions,
    handleResetFilters,
    handleResetInteractiveFilters,
    performSearch,
    performInteractiveSearch,
    setSelectedCategory,
    setSelectedLocalType,
    setSelectedInteractiveCategory,
    setSelectedRegion,
    setSelectedStockLevel,
  } = useMaterialsFilter(materials);

  // Helper function to safely extract address string - always returns a string
  const getAddressString = (adresse: any): string => {
    console.log("Processing address:", adresse);
    if (!adresse) return "";
    if (typeof adresse === "string") return adresse;
    if (typeof adresse === "object") {
      // If it's a JSON object, try to extract a meaningful address string
      if (adresse.address) return String(adresse.address);
      if (adresse.street) return String(adresse.street);
      if (Array.isArray(adresse) && adresse.length > 0)
        return String(adresse[0]);
      return JSON.stringify(adresse);
    }
    return String(adresse);
  };

  // Initialize map locations from hexagonal materials
  useEffect(() => {
    if (materials.length > 0) {
      const locations: MapLocation[] = materials
        .filter(
          (material) =>
            material.coordinates_latitude && material.coordinates_longitude
        )
        .map((material) => {
          const addressString = getAddressString(material.adresse);
          const baseLocation: MapLocation = {
            id: material.id,
            name: material.name,
            type: "material" as const,
            latitude: material.coordinates_latitude!,
            longitude: material.coordinates_longitude!,
            region: material.origin_location || "",
          };

          if (addressString && addressString.trim()) {
            return { ...baseLocation, adresse: addressString.trim() };
          }
          return baseLocation;
        });

      setMapLocations(locations);
    }
  }, [materials]);

  // Update map locations when filtered materials change
  useEffect(() => {
    const filteredLocations: MapLocation[] = filteredMaterials
      .filter(
        (material) =>
          material.coordinates_latitude && material.coordinates_longitude
      )
      .map((material) => {
        const addressString = getAddressString(material.adresse);

        const baseLocation: MapLocation = {
          id: material.id,
          name: material.name,
          type: "material" as const,
          latitude: material.coordinates_latitude!,
          longitude: material.coordinates_longitude!,
          region: material.origin_location || "",
        };

        // Only add adresse if it's a non-empty string
        if (addressString && addressString.trim()) {
          return { ...baseLocation, adresse: addressString.trim() };
        }

        return baseLocation;
      });

    setMapLocations(filteredLocations);
  }, [filteredMaterials]);

  // Pagination for materials
  const {
    currentData: paginatedMaterials,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
  } = usePagination({
    data: filteredMaterials,
    itemsPerPage: 20,
  });

  // Interactive materials map view component
  const InteractiveMaterialsMapView: React.FC<{ materials: Material[] }> = ({
    materials,
  }) => {
    const handleMaterialSelect = (material: Material) => {
      navigate(`/materials/${material.id}`);
    };

    return (
      <div className="space-y-6">
        <InteractiveMaterialFilters
          searchTerm={interactiveSearchTerm}
          onSearchChange={setInteractiveSearchTerm}
          onSearchSubmit={performInteractiveSearch}
          selectedCategory={selectedInteractiveCategory}
          selectedRegion={selectedRegion}
          selectedStockLevel={selectedStockLevel}
          categories={categories}
          regions={regions}
          onCategoryChange={setSelectedInteractiveCategory}
          onRegionChange={setSelectedRegion}
          onStockLevelChange={setSelectedStockLevel}
          onReset={handleResetInteractiveFilters}
          materialCount={materials.length}
          gpsCount={filteredInteractiveMaterials.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveMaterialsList
            materials={filteredInteractiveMaterials}
            onMaterialSelect={handleMaterialSelect}
          />
          <EnhancedInteractiveMaterialMap
            materials={filteredInteractiveMaterials}
            onMaterialSelect={handleMaterialSelect}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ElectricSpinner />
      </div>
    );
  }

  return (
    <AppLayout
      showBreadcrumb
      pageTitle={t("nav.materials")}
      pageDescription={`${filteredMaterials.length} matériaux`}
      actions={
        <Button asChild className="bg-adrar-600 hover:bg-adrar-700">
          <Link to="/materials/create">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un matériau
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">

        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Vue Grille
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Carte des Matériaux
            </TabsTrigger>
            <TabsTrigger
              value="interactive"
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Carte Interactive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-6">
            <MaterialFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearchSubmit={performSearch}
              selectedCategory={selectedCategory}
              selectedLocalType={selectedLocalType}
              categories={categories}
              localTypes={localTypes}
              onCategoryChange={setSelectedCategory}
              onLocalTypeChange={setSelectedLocalType}
              onReset={handleResetFilters}
              resultCount={filteredMaterials.length}
            />

            <MaterialGrid
              materials={paginatedMaterials}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={goToPage}
              onMaterialClick={(material) =>
                navigate(`/materials/${material.id}`)
              }
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardContent className="p-0">
                {mapLocations.length > 0 ? (
                  <ProjectMap
                    locations={mapLocations}
                    height="600px"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    Aucun matériau géolocalisé à afficher
                  </div>
                )}
              </CardContent>
            </Card>

            {mapLocations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Matériaux Géolocalisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mapLocations.map((location) => {
                      const addressDisplay =
                        location.adresse || "Adresse non spécifiée";
                      return (
                        <div
                          key={location.id}
                          className="p-3 border rounded-lg"
                        >
                          <h4 className="font-medium">{location.name}</h4>
                          <p className="text-sm text-gray-600">
                            {location.region}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addressDisplay}
                          </p>
                          <p className="text-xs text-gray-500">
                            {location.latitude.toFixed(6)},{" "}
                            {location.longitude.toFixed(6)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <InteractiveMaterialsMapView materials={filteredMaterials} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Materials;
