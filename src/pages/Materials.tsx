import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Map, MapPin, Grid } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import InteractiveMapGIS from "@/components/materials/InteractiveMapGIS";
import ProjectMap from "@/components/ProjectMap";
import { MapLocation } from "@/components/ProjectMap";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import MaterialFilters from "@/components/materials/MaterialFilters";
import MaterialGrid from "@/components/materials/MaterialGrid";
import { usePagination } from "@/hooks/usePagination";
import InteractiveMaterialFilters from "@/components/materials/InteractiveMaterialFilters";
import InteractiveMaterialsList from "@/components/materials/InteractiveMaterialsList";
import EnhancedInteractiveMaterialMap from "@/components/materials/EnhancedInteractiveMaterialMap";

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
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocalType, setSelectedLocalType] = useState("all");
  
  // Interactive map filters
  const [interactiveSearchTerm, setInteractiveSearchTerm] = useState("");
  const [selectedInteractiveCategory, setSelectedInteractiveCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStockLevel, setSelectedStockLevel] = useState("all");

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

  // Fetch materials from database
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        console.log("Fetching materials from database...");
        const { data, error } = await supabase
          .from("materials")
          .select("*")
          .order("name");

        if (error) throw error;

        console.log("Raw materials data:", data);

        // Transform the data to match our Material interface
        const transformedData: Material[] = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          category: item.category,
          unit: item.unit,
          price_per_unit: item.price_per_unit,
          available_quantity: item.available_quantity,
          image: item.image || undefined,
          origin_location: item.origin_location || undefined,
          minimum_quantity: (item as any).minimum_quantity || undefined,
          local_type: (item as any).local_type || undefined,
          adresse: item.adresse || undefined,
          coordinates_latitude: item.coordinates_latitude || undefined,
          coordinates_longitude: item.coordinates_longitude || undefined,
          forme: (item as any).forme || undefined,
          localisation: (item as any).localisation || undefined,
          is_active:
            (item as any).is_active !== undefined
              ? (item as any).is_active
              : true,
        }));

        console.log("Transformed materials:", transformedData);
        setMaterials(transformedData);
        setFilteredMaterials(transformedData);

        // Convert materials to map locations with proper address handling
        const locations: MapLocation[] = transformedData
          .filter(
            (material) =>
              material.coordinates_latitude && material.coordinates_longitude
          )
          .map((material) => {
            const addressString = getAddressString(material.adresse);
            console.log(
              `Processing material ${material.name} with address:`,
              addressString
            );

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

        console.log("Generated map locations:", locations);
        setMapLocations(locations);
      } catch (error) {
        console.error("Error fetching materials:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // Filter materials based on search and category
  useEffect(() => {
    console.log("Filtering materials with:", {
      searchTerm,
      selectedCategory,
      selectedLocalType,
    });
    let filtered = materials;

    if (searchTerm) {
      filtered = filtered.filter(
        (material) =>
          material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          material.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (material) => material.category === selectedCategory
      );
    }

    if (selectedLocalType && selectedLocalType !== "all") {
      filtered = filtered.filter(
        (material) => material.local_type === selectedLocalType
      );
    }

    console.log("Filtered materials:", filtered);
    setFilteredMaterials(filtered);

    // Update map locations based on filtered materials with proper address handling
    const filteredLocations: MapLocation[] = filtered
      .filter(
        (material) =>
          material.coordinates_latitude && material.coordinates_longitude
      )
      .map((material) => {
        const addressString = getAddressString(material.adresse);
        console.log(
          `Processing filtered material ${material.name} with address:`,
          addressString
        );

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

    console.log("Updated filtered map locations:", filteredLocations);
    setMapLocations(filteredLocations);
  }, [materials, searchTerm, selectedCategory, selectedLocalType]);

  const categories = Array.from(
    new Set(materials.map((m) => m.category))
  ).filter(Boolean);
  const localTypes = Array.from(
    new Set(materials.map((m) => m.local_type).filter(Boolean))
  ) as string[];

  // Get regions for interactive filters
  const regions = Array.from(
    new Set(materials.map((m) => m.origin_location).filter(Boolean))
  ) as string[];

  // Pagination for materials
  const {
    currentData: paginatedMaterials,
    currentPage,
    totalPages,
    totalItems,
    goToPage
  } = usePagination({
    data: filteredMaterials,
    itemsPerPage: 20
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocalType("all");
  };

  const handleResetInteractiveFilters = () => {
    setInteractiveSearchTerm("");
    setSelectedInteractiveCategory("all");
    setSelectedRegion("all");
    setSelectedStockLevel("all");
  };

  // Filter materials for interactive map
  const getStockLevel = (available: number) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  const filteredInteractiveMaterials = materials.filter(material => {
    // Only show materials with GPS coordinates
    if (!material.coordinates_latitude || !material.coordinates_longitude) return false;

    // Search filter
    if (interactiveSearchTerm && !material.name.toLowerCase().includes(interactiveSearchTerm.toLowerCase()) && 
        !material.description.toLowerCase().includes(interactiveSearchTerm.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedInteractiveCategory !== "all" && material.category !== selectedInteractiveCategory) {
      return false;
    }

    // Region filter
    if (selectedRegion !== "all" && material.origin_location !== selectedRegion) {
      return false;
    }

    // Stock level filter
    if (selectedStockLevel !== "all") {
      const stockLevel = getStockLevel(material.available_quantity);
      if (stockLevel !== selectedStockLevel) {
        return false;
      }
    }

    return true;
  });

  // Interactive materials map view component
  const InteractiveMaterialsMapView: React.FC<{ materials: Material[] }> = ({ materials }) => {
    const handleMaterialSelect = (material: Material) => {
      navigate(`/materials/${material.id}`);
    };

    return (
      <div className="space-y-6">
        <InteractiveMaterialFilters
          searchTerm={interactiveSearchTerm}
          selectedCategory={selectedInteractiveCategory}
          selectedRegion={selectedRegion}
          selectedStockLevel={selectedStockLevel}
          categories={categories}
          regions={regions}
          onSearchChange={setInteractiveSearchTerm}
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Chargement des matériaux...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8  ">
      <Navbar />
      <div className="mt-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Matériaux</h1>
            <p className="text-gray-600 mt-1">
              Gérez votre inventaire de matériaux de construction
            </p>
          </div>
          <Button asChild className="bg-adrar-600 hover:bg-adrar-700">
            <Link to="/materials/create">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un matériau
            </Link>
          </Button>
        </div>

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
              selectedCategory={selectedCategory}
              selectedLocalType={selectedLocalType}
              categories={categories}
              localTypes={localTypes}
              onSearchChange={setSearchTerm}
              onCategoryChange={setSelectedCategory}
              onLocalTypeChange={setSelectedLocalType}
              onReset={handleResetFilters}
            />

            <MaterialGrid
              materials={paginatedMaterials}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={goToPage}
              onMaterialClick={(material) => navigate(`/materials/${material.id}`)}
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
    </div>
  );
};

export default Materials;
