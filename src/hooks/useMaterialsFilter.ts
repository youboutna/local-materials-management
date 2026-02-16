import { useState, useEffect, useMemo } from 'react';
import { MaterialUIDTO } from '@/dtos/transforms';

export const useMaterialsFilter = (materials: MaterialUIDTO[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState(""); // Actual search to filter by
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocalType, setSelectedLocalType] = useState("all");
  
  // Interactive map filters
  const [interactiveSearchTerm, setInteractiveSearchTerm] = useState("");
  const [activeInteractiveSearchTerm, setActiveInteractiveSearchTerm] = useState(""); // Actual search to filter by
  const [selectedInteractiveCategory, setSelectedInteractiveCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStockLevel, setSelectedStockLevel] = useState("all");

  // Filter materials based on fulltext search and filters using active search term
  const filteredMaterials = useMemo(() => {
    let filteredOriginal = materials;

    // Apply fulltext search filter
    if (activeSearchTerm && activeSearchTerm.trim()) {
      const queryTerms = activeSearchTerm.toLowerCase().trim().split(/\s+/);
      
      filteredOriginal = filteredOriginal.filter((material) => {
        // Create searchable text from all material fields
        const searchableText = [
          material.name,
          material.description || '',
          material.category,
          material.unit,
        ].filter(Boolean).join(' ').toLowerCase();
        
        // Check if all query terms are found in searchable text
        return queryTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      filteredOriginal = filteredOriginal.filter(
        (material) => material.category === selectedCategory
      );
    }

    // Apply local type filter
    if (selectedLocalType && selectedLocalType !== "all") {
      filteredOriginal = filteredOriginal.filter(
        (material) => material.localType === selectedLocalType
      );
    }

    return filteredOriginal;
  }, [materials, activeSearchTerm, selectedCategory, selectedLocalType]);
  
  // Extract unique values for filter options
  const categories = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.category))).filter(Boolean),
    [materials]
  );
  
  const localTypes = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.localType).filter(Boolean))) as string[],
    [materials]
  );
  
  const regions = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.originLocation).filter(Boolean))) as string[],
    [materials]
  );
  
  // Get stock level for material
  const getStockLevel = (available: number) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  // Filter materials for interactive map using fulltext active search term
  const filteredInteractiveMaterials = useMemo(() => {
    return materials.filter(material => {
      // Only show materials with GPS coordinates
      if (!material.coordinatesLatitude || !material.coordinatesLongitude) return false;

      // Fulltext search filter using active search term
      if (activeInteractiveSearchTerm && activeInteractiveSearchTerm.trim()) {
        const queryTerms = activeInteractiveSearchTerm.toLowerCase().trim().split(/\s+/);

        const searchableText = [
          material.name,
          material.description || '',
          material.category,
          material.originLocation || '',
          material.localType || '',
          material.unit
        ].filter(Boolean).join(' ').toLowerCase();

        if (!queryTerms.every(term => searchableText.includes(term))) {
          return false;
        }
      }

      // Category filter
      if (selectedInteractiveCategory !== "all" && material.category !== selectedInteractiveCategory) {
        return false;
      }

      // Region filter
      if (selectedRegion !== "all" && material.originLocation !== selectedRegion) {
        return false;
      }

      // Stock level filter
      if (selectedStockLevel !== "all") {
        const stockLevel = getStockLevel(material.availableQuantity);
        if (stockLevel !== selectedStockLevel) {
          return false;
        }
      }

      return true;
    });
  }, [materials, activeInteractiveSearchTerm, selectedInteractiveCategory, selectedRegion, selectedStockLevel]);
  
  // Reset functions
  const handleResetFilters = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setSelectedCategory("all");
    setSelectedLocalType("all");
  };

  const handleResetInteractiveFilters = () => {
    setInteractiveSearchTerm("");
    setActiveInteractiveSearchTerm("");
    setSelectedInteractiveCategory("all");
    setSelectedRegion("all");
    setSelectedStockLevel("all");
  };
  
  // Functions to trigger search (called on Enter key press)
  const performSearch = () => {
    setActiveSearchTerm(searchTerm);
  };
  
  const performInteractiveSearch = () => {
    setActiveInteractiveSearchTerm(interactiveSearchTerm);
  };

  return {
    // Basic filters
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedLocalType,
    setSelectedLocalType,
    filteredMaterials,
    
    // Interactive filters
    interactiveSearchTerm,
    setInteractiveSearchTerm,
    selectedInteractiveCategory,
    setSelectedInteractiveCategory,
    selectedRegion,
    setSelectedRegion,
    selectedStockLevel,
    setSelectedStockLevel,
    filteredInteractiveMaterials,
    
    // Filter options
    categories,
    localTypes,
    regions,
    
    // Helper functions
    getStockLevel,
    handleResetFilters,
    handleResetInteractiveFilters,
    performSearch,
    performInteractiveSearch
  };
};