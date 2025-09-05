import { useState, useEffect, useMemo } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { SortOption } from '@/components/projects/ProjectFilters';
import { useNavigate } from 'react-router-dom';
import { MAURITANIA_REGIONS, Region } from '@/types/mauritania';
import { useDebounce } from './useDebounce';

export const useProjectsFilter = (projects: ProjectData[]) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]);
  const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Debounce search query to allow user to finish typing
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Extract all unique statuses from projects for filtering
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    projects.forEach(project => {
      if (project.status) {
        statuses.add(project.status);
      }
    });
    return Array.from(statuses);
  }, [projects]);

  // Get available regions from Mauritania regions
  const availableRegions = useMemo(() => {
    return MAURITANIA_REGIONS.map(region => ({
      code: region.code,
      name: region.name,
      nameAr: region.nameAr
    }));
  }, []);
  
  // Handle searching and filtering using debounced search
  useEffect(() => {
    let result = [...projects];
    
    // Apply search filter first if there's a query
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(project => 
        project.title?.toLowerCase().includes(query) || 
        project.description?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query) ||
        project.projectReference?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }

    // Apply region filter
    if (regionFilter !== 'all') {
      const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === regionFilter);
      if (selectedRegion) {
        result = result.filter(project => 
          project.location?.toLowerCase().includes(selectedRegion.name.toLowerCase()) ||
          project.location?.toLowerCase().includes(selectedRegion.nameAr.toLowerCase())
        );
      }
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'budget-high':
        result.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case 'budget-low':
        result.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      case 'progress':
        result.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
    }
    
    setFilteredProjects(result);
    
    // Update search results for potential autocomplete
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      setSearchResults(result);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearchQuery, statusFilter, regionFilter, sortOption, projects]);
  
  // Function to handle clicking on a search result
  const handleSelectSearchResult = (projectId: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/projects/${projectId}`);
  };
  
  // Function to clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };
  
  // Function for real-time search as user types - only updates search query with debouncing
  const performSearch = (query: string) => {
    // Don't update state immediately - let ResponsiveFilters handle debouncing
    // This function is now just a placeholder for API compatibility
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    regionFilter,
    setRegionFilter,
    sortOption,
    setSortOption,
    filteredProjects,
    searchResults,
    showSearchResults,
    handleSelectSearchResult,
    clearSearch,
    availableStatuses,
    availableRegions,
    performSearch
  };
};
