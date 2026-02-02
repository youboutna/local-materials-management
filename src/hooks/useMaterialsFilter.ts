import { useState, useEffect, useMemo } from 'react';

interface Material {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price_per_unit: number;
  available_quantity: number;
  image?: string;
  location?: string;
  type?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  shape?: string;
  isActive?: boolean;
}

interface MaterialFilter {
  location?: string;
  minimumQuantity?: number;
  type?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  shape?: string;
  isActive?: boolean;
}

export const useMaterialsFilter = (materials: Material[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState(""); // Actual search to filter by
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocalType, setSelectedLocalType] = useState("all");
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  
  // Interactive map filters
  const [interactiveSearchTerm, setInteractiveSearchTerm] = useState("");
  const [activeInteractiveSearchTerm, setActiveInteractiveSearchTerm] = useState(""); // Actual search to filter by
  const [selectedInteractiveCategory, setSelectedInteractiveCategory] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStockLevel, setSelectedStockLevel] = useState("all");
  
  const [filters, setFilters] = useState<MaterialFilter>({});
  
  // Extract unique values for filter options
  const categories = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.category))).filter(Boolean),
    [materials]
  );
  
  const localTypes = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.type).filter(Boolean))) as string[],
    [materials]
  );
  
  const regions = useMemo(() => 
    Array.from(new Set(materials.map((m) => m.location).filter(Boolean))) as string[],
    [materials]
  );
  
  // Filter materials based on fulltext search and filters using active search term
  useEffect(() => {
    let filtered = materials;

    // Apply fulltext search filter
    if (activeSearchTerm && activeSearchTerm.trim()) {
      const queryTerms = activeSearchTerm.toLowerCase().trim().split(/\s+/);
      
      filtered = filtered.filter((material) => {
        // Create searchable text from all material fields
        const searchableText = [
          material.name,
          material.description,
          material.category,
          material.unit,
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
        (material) => material.type === selectedLocalType
      );
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter((material) => material.location?.includes(filters.location || ''));
    }

    // Apply type filter
    if (filters.type) {
      filtered = filtered.filter((material) => material.type === filters.type);
    }

    setFilteredMaterials(filtered);
  }, [materials, activeSearchTerm, selectedCategory, selectedLocalType, filters]);
  
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
      if (!material.coordinates?.lat || !material.coordinates?.lng) return false;

      // Fulltext search filter using active search term
      if (activeInteractiveSearchTerm && activeInteractiveSearchTerm.trim()) {
        const queryTerms = activeInteractiveSearchTerm.toLowerCase().trim().split(/\s+/);
        
        const searchableText = [
          material.name,
          material.description,
          material.category,
          material.location,
          material.type,
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
      if (selectedRegion !== "all" && material.location !== selectedRegion) {
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
    performInteractiveSearch,
    filters,
    setFilters
  };
};