import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'status',
      label: t('auto.inspectionfilters.statuts'),
      placeholder: t('auto.inspectionfilters.tous_les_statuts'),
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
      label: t('auto.inspectionfilters.inspecteurs'),
      placeholder: t('auto.inspectionfilters.tous_les_inspecteurs'),
      value: inspectorFilter,
      onChange: onInspectorChange,
      options: availableInspectors.map(inspector => ({ value: inspector, label: inspector }))
    },
    {
      key: 'project',
      label: t('auto.inspectionfilters.projets'),
      placeholder: t('auto.inspectionfilters.tous_les_projets'),
      value: projectFilter,
      onChange: onProjectChange,
      options: availableProjects.map(project => ({ value: project.id, label: project.title }))
    },
    {
      key: 'sort',
      label: t('auto.inspectionfilters.tri'),
      placeholder: t('auto.inspectionfilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as InspectionSortOption),
      options: [
        { value: 'newest', label: t('auto.inspectionfilters.plus_recent') },
        { value: 'oldest', label: t('auto.inspectionfilters.plus_ancien') },
        { value: 'project', label: t('auto.inspectionfilters.projet') },
        { value: 'inspector', label: t('auto.inspectionfilters.inspecteur') },
        { value: 'status', label: t('auto.inspectionfilters.statut') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('auto.inspectionfilters.rechercher_des_inspections')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default InspectionFilters;