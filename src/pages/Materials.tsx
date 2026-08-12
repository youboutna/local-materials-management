import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Grid } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { MaterialUIDTO } from "@/dtos/transforms";


const Materials: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Use hexagonal architecture hook
  const { materials: hexMaterials, isLoading, error, deleteMaterial } = useMaterialsHex();

  // Use materials directly from hook (already MaterialUIDTO[])
  const materials: MaterialUIDTO[] = hexMaterials;

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
  const InteractiveMaterialsMapView: React.FC<{ materials: MaterialUIDTO[] }> = ({
    materials,
  }) => {
    const handleMaterialSelect = (material: MaterialUIDTO) => {
      navigate(`/materials/${material.id}`);
    };

    // Wrapper function to match InteractiveMaterialsList expected type
    const handleListMaterialSelect = (material: unknown) => {
      handleMaterialSelect(material as MaterialUIDTO);
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
            onMaterialSelect={handleListMaterialSelect}
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="flex items-center gap-2">
              <Grid className="h-4 w-4" />
              Vue Grille
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
              onMaterialDelete={(materialId) => deleteMaterial(materialId)}
            />
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
