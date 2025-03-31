
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ProjectFilters from '@/components/projects/ProjectFilters';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import EmptyProjectsState from '@/components/projects/EmptyProjectsState';
import { useProjectsFilter } from '@/hooks/useProjectsFilter';
import { useTypeOrmProjects } from '@/hooks/useTypeOrmProjects';

const Projects = () => {
  const { projects, loading } = useTypeOrmProjects();
  
  const {
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
  } = useProjectsFilter(projects);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">Chargement des projets...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <ProjectsHeader />
          
          {/* Filters and Actions */}
          <ProjectFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            searchResults={searchResults}
            showSearchResults={showSearchResults}
            handleSelectSearchResult={handleSelectSearchResult}
            clearSearch={clearSearch}
          />
          
          {/* Projects Grid or Empty State */}
          {filteredProjects.length > 0 ? (
            <ProjectsGrid projects={filteredProjects} />
          ) : (
            <EmptyProjectsState />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
