
import { useState, useEffect } from 'react';
import { ProjectData } from '@/components/ProjectCard';
import { SortOption } from '@/components/projects/ProjectFilters';
import { useNavigate } from 'react-router-dom';

export const useProjectsFilter = (projects: ProjectData[]) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>(projects);
  const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Handle filtering and sorting whenever inputs change
  useEffect(() => {
    let result = [...projects];
    
    // Apply search filter if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const searchFilteredResults = projects.filter(
        project => 
          project.title?.toLowerCase().includes(query) || 
          project.description?.toLowerCase().includes(query) ||
          project.location?.toLowerCase().includes(query)
      );
      
      // Update search results
      setSearchResults(searchFilteredResults);
      setShowSearchResults(true);
      
      // Don't modify the filtered projects yet - we'll display the search results in the dropdown
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      
      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter(project => project.status === statusFilter);
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
  }, [searchQuery, statusFilter, sortOption, projects]);
  
  // Apply filters to projects when search is not active
  useEffect(() => {
    if (!searchQuery) {
      let result = [...projects];
      
      // Apply status filter
      if (statusFilter !== 'all') {
        result = result.filter(project => project.status === statusFilter);
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
  }, [searchQuery, statusFilter, sortOption, projects]);

  // Function to handle clicking on a search result
  const handleSelectSearchResult = (projectId: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/projects/${projectId}`);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    filteredProjects,
    searchResults,
    showSearchResults,
    handleSelectSearchResult,
    clearSearch
  };
};
