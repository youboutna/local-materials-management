import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';

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
  adresse?: string | any;
  coordinates_latitude?: number;
  coordinates_longitude?: number;
  forme?: string;
  localisation?: any;
  is_active?: boolean;
}

export const useMaterialsFilter = (materials: Material[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocalType, setSelectedLocalType] = useState("all");
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  
  // Interactive map filters
  const [interactiveSearchTerm, setInteractiveSearchTerm] = useState("");
  const [selectedInteractiveCategory, setSelectedInteractiveCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStockLevel, setSelectedStockLevel] = useState("all");
  
  // Debounce search queries to allow user to finish typing
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedInteractiveSearchTerm = useDebounce(interactiveSearchTerm, 500);
  
  // Extract unique values for filter options
  const categories = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.category))).filter(Boolean),
    [materials]
  );
  
  const localTypes = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.local_type).filter(Boolean))) as string[],
    [materials]
  );
  
  const regions = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.origin_location).filter(Boolean))) as string[],
    [materials]
  );
  
  // Filter materials based on fulltext search and filters using debounced search
  useEffect(() => {
    let filtered = materials;

    // Apply fulltext search filter
    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      const queryTerms = debouncedSearchTerm.toLowerCase().trim().split(/\s+/);
      
      filtered = filtered.filter((material) => {
        // Create searchable text from all material fields
        const searchableText = [
          material.name,
          material.description,
          material.category,
          material.unit,
          material.origin_location,
          material.local_type,
          material.price_per_unit?.toString(),
          material.available_quantity?.toString(),
          typeof material.adresse === 'string' ? material.adresse : JSON.stringify(material.adresse)
        ].filter(Boolean).join(' ').toLowerCase();
        
        // Check if all query terms are found in searchable text
        return queryTerms.every(term => searchableText.includes(term));
      });
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(
        (material) => material.category === selectedCategory
      );
    }

    // Apply local type filter
    if (selectedLocalType && selectedLocalType !== "all") {
      filtered = filtered.filter(
        (material) => material.local_type === selectedLocalType
      );
    }

    setFilteredMaterials(filtered);
  }, [materials, debouncedSearchTerm, selectedCategory, selectedLocalType]);
  
  // Get stock level for material
  const getStockLevel = (available: number) => {
    if (available === 0) return 'out';
    if (available < 10) return 'low';
    if (available < 50) return 'medium';
    return 'high';
  };

  // Filter materials for interactive map using fulltext debounced search
  const filteredInteractiveMaterials = useMemo(() => {
    return materials.filter(material => {
      // Only show materials with GPS coordinates
      if (!material.coordinates_latitude || !material.coordinates_longitude) return false;

      // Fulltext search filter using debounced term
      if (debouncedInteractiveSearchTerm && debouncedInteractiveSearchTerm.trim()) {
        const queryTerms = debouncedInteractiveSearchTerm.toLowerCase().trim().split(/\s+/);
        
        const searchableText = [
          material.name,
          material.description,
          material.category,
          material.origin_location,
          material.local_type,
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
  }, [materials, debouncedInteractiveSearchTerm, selectedInteractiveCategory, selectedRegion, selectedStockLevel]);
  
  // Reset functions
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
  
  // Functions for real-time search - only used for API compatibility
  const performSearch = (query: string) => {
    // Don't update state immediately - let ResponsiveFilters handle debouncing
  };
  
  const performInteractiveSearch = (query: string) => {
    // Don't update state immediately - let ResponsiveFilters handle debouncing
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