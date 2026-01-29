import { useState, useEffect, useMemo } from "react";
import { ProjectData } from "@/components/ProjectCard";
import { SortOption } from "@/components/projects/ProjectFilters";
import { useNavigate } from "react-router-dom";
import { MAURITANIA_REGIONS, Region } from "@/types/mauritania";

export const useProjectsFilter = (projects: ProjectData[]) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // Actual search to filter by
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]);
  const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Create a stable key for projects to prevent unnecessary re-renders
  const projectsKey = useMemo(() => {
    return `${projects.length}-${projects.map(p => p.id).join(',')}`;
  }, [projects]);

  // Add debouncing for search to prevent immediate re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);
  // Extract all unique statuses from projects for filtering
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    projects.forEach((project) => {
      if (project.status) {
        statuses.add(project.status);
      }
    });
    return Array.from(statuses);
  }, [projectsKey]);

  // Get available regions from Mauritania regions
  const availableRegions = useMemo(() => {
    return MAURITANIA_REGIONS.map((region) => ({
      code: region.code,
      name: region.name,
      nameAr: region.nameAr,
    }));
  }, []);

  // Handle searching and filtering using active search query
  useEffect(() => {
    let result = [...projects];

    // Apply fulltext search filter first if there's a query
    if (activeSearchQuery && activeSearchQuery.trim()) {
      const queryTerms = activeSearchQuery.toLowerCase().trim().split(/\s+/);

      result = result.filter((project) => {
        // Create searchable text from all project fields
        const searchableText = [
          project.title,
          project.description,
          project.location,
          project.projectReference,
          project.status,
          project.budget?.toString(),
          project.progress?.toString(),
          project.teamSize?.toString(),
          project.startDate,
          project.endDate,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Check if all query terms are found in searchable text
        return queryTerms.every((term) => searchableText.includes(term));
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((project) => project.status === statusFilter);
    }

    // Apply region filter
    if (regionFilter !== "all") {
      const selectedRegion = MAURITANIA_REGIONS.find(
        (r) => r.code === regionFilter
      );
      if (selectedRegion) {
        result = result.filter(
          (project) =>
            project.location
              ?.toLowerCase()
              .includes(selectedRegion.name.toLowerCase()) ||
            project.location
              ?.toLowerCase()
              .includes(selectedRegion.nameAr.toLowerCase())
        );
      }
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case "budget-high":
        result.sort((a, b) => (b.budget || 0) - (a.budget || 0));
        break;
      case "budget-low":
        result.sort((a, b) => (a.budget || 0) - (b.budget || 0));
        break;
      case "progress":
        result.sort((a, b) => (b.progress || 0) - (a.progress || 0));
        break;
    }

    // Only update state if the filtered results actually changed
    setFilteredProjects((prev) => {
      if (
        prev.length !== result.length ||
        JSON.stringify(prev) !== JSON.stringify(result)
      ) {
        return result;
      }
      return prev;
    });

    // Update search results for potential autocomplete
    if (activeSearchQuery && activeSearchQuery.trim()) {
      setSearchResults(result);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [activeSearchQuery, statusFilter, regionFilter, sortOption, projectsKey]);

  // Function to handle clicking on a search result
  const handleSelectSearchResult = (projectId: string) => {
    setSearchQuery("");
    setShowSearchResults(false);
    navigate(`/projects/${projectId}`);
  };

  // Function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Function to trigger search (called on Enter key press)
  const performSearch = () => {
    //setActiveSearchQuery(searchQuery);
  };

  return {
    searchQuery,
    setSearchQuery,
    activeSearchQuery,
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
    performSearch,
  };
};
