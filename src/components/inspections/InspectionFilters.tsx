import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

export type InspectionSortOption = 'newest' | 'oldest' | 'project' | 'inspector' | 'status';

interface InspectionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  inspectorFilter: string;
  onInspectorChange: (inspector: string) => void;
  projectFilter: string;
  onProjectChange: (project: string) => void;
  sortOption: InspectionSortOption;
  onSortChange: (sort: InspectionSortOption) => void;
  availableStatuses: string[];
  availableInspectors: string[];
  availableProjects: { id: string; title: string }[];
  onReset: () => void;
  resultCount?: number;
}

const InspectionFilters: React.FC<InspectionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  inspectorFilter,
  onInspectorChange,
  projectFilter,
  onProjectChange,
  sortOption,
  onSortChange,
  availableStatuses,
  availableInspectors,
  availableProjects,
  onReset,
  resultCount
}) => {
  const filters: FilterField[] = [
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'scheduled' ? 'Programmé' :
               status === 'in_progress' ? 'En cours' :
               status === 'completed' ? 'Terminé' :
               status === 'cancelled' ? 'Annulé' : status
      }))
    },
    {
      key: 'inspector',
      label: 'Inspecteurs',
      placeholder: 'Tous les inspecteurs',
      value: inspectorFilter,
      onChange: onInspectorChange,
      options: availableInspectors.map(inspector => ({ value: inspector, label: inspector }))
    },
    {
      key: 'project',
      label: 'Projets',
      placeholder: 'Tous les projets',
      value: projectFilter,
      onChange: onProjectChange,
      options: availableProjects.map(project => ({ value: project.id, label: project.title }))
    },
    {
      key: 'sort',
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as InspectionSortOption),
      options: [
        { value: 'newest', label: 'Plus récent' },
        { value: 'oldest', label: 'Plus ancien' },
        { value: 'project', label: 'Projet' },
        { value: 'inspector', label: 'Inspecteur' },
        { value: 'status', label: 'Statut' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher des inspections..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default InspectionFilters;