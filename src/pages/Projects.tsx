
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ProjectFilters from '@/components/projects/ProjectFilters';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import EmptyProjectsState from '@/components/projects/EmptyProjectsState';
import { projectsData } from '@/data/projectsData';
import { useProjectsFilter } from '@/hooks/useProjectsFilter';

const Projects = () => {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    filteredProjects
  } = useProjectsFilter(projectsData);

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
