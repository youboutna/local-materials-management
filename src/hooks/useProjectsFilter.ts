import { useState, useEffect, useMemo } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { SortOption } from '@/components/projects/ProjectFilters';
import { useNavigate } from 'react-router-dom';
import { MAURITANIA_REGIONS, Region } from '@/types/mauritania';

export const useProjectsFilter = (projects: ProjectData[]) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]);
  const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
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
  
  // Handle searching and filtering
  useEffect(() => {
    // If there's a search query, prioritize search
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      let results = projects.filter(project => 
        project.title?.toLowerCase().includes(query) || 
        project.description?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query)
      );

      // Apply region filter to search results if selected
      if (regionFilter !== 'all') {
        const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === regionFilter);
        if (selectedRegion) {
          results = results.filter(project => 
            project.location?.toLowerCase().includes(selectedRegion.name.toLowerCase()) ||
            project.location?.toLowerCase().includes(selectedRegion.nameAr.toLowerCase())
          );
        }
      }
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      // Otherwise, apply filters and sorting
      setSearchResults([]);
      setShowSearchResults(false);
      
      let result = [...projects];
      
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
          result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
          break;
        case 'oldest':
          result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          break;
        case 'budget-high':
          result.sort((a, b) => b.budget - a.budget);
          break;
        case 'budget-low':
          result.sort((a, b) => a.budget - b.budget);
          break;
        case 'progress':
          result.sort((a, b) => b.progress - a.progress);
          break;
      }
      
      setFilteredProjects(result);
    }
  }, [searchQuery, statusFilter, regionFilter, sortOption, projects]);
  
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
  
  // Function for real-time search as user types
  const performSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query) {
      const searchTerm = query.toLowerCase().trim();
      let results = projects.filter(project => 
        project.title?.toLowerCase().includes(searchTerm) || 
        project.description?.toLowerCase().includes(searchTerm) ||
        project.location?.toLowerCase().includes(searchTerm)
      );

      // Apply current region filter to search results
      if (regionFilter !== 'all') {
        const selectedRegion = MAURITANIA_REGIONS.find(r => r.code === regionFilter);
        if (selectedRegion) {
          results = results.filter(project => 
            project.location?.toLowerCase().includes(selectedRegion.name.toLowerCase()) ||
            project.location?.toLowerCase().includes(selectedRegion.nameAr.toLowerCase())
          );
        }
      }
      
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      clearSearch();
    }
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
