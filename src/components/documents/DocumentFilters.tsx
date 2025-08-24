import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

export type DocumentSortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'size-desc';

interface DocumentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortOption: DocumentSortOption;
  onSortChange: (sort: DocumentSortOption) => void;
  availableTypes: string[];
  availableStatuses: string[];
  onReset: () => void;
  resultCount?: number;
}

const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  sortOption,
  onSortChange,
  availableTypes,
  availableStatuses,
  onReset,
  resultCount
}) => {
  const filters: FilterField[] = [
    {
      key: 'type',
      label: 'Types',
      placeholder: 'Tous les types',
      value: typeFilter,
      onChange: onTypeChange,
      options: availableTypes.map(type => ({ 
        value: type, 
        label: type === 'inspection_report' ? 'Rapport d\'inspection' :
               type === 'location_photo' ? 'Photo de lieu' :
               type === 'project_report' ? 'Rapport de projet' :
               type === 'contract' ? 'Contrat' :
               type === 'supplier_info' ? 'Info fournisseur' :
               type === 'task_assignment' ? 'Affectation de tâche' :
               type === 'employee_record' ? 'Dossier employé' :
               type === 'tender_documents' ? 'Documents d\'appel d\'offres' : type
      }))
    },
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'draft' ? 'Brouillon' :
               status === 'approved' ? 'Approuvé' :
               status === 'pending' ? 'En attente' :
               status === 'rejected' ? 'Rejeté' : status
      }))
    },
    {
      key: 'sort',
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as DocumentSortOption),
      options: [
        { value: 'newest', label: 'Plus récent' },
        { value: 'oldest', label: 'Plus ancien' },
        { value: 'name-asc', label: 'Nom (A-Z)' },
        { value: 'name-desc', label: 'Nom (Z-A)' },
        { value: 'size-desc', label: 'Taille (grande)' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher des documents..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default DocumentFilters;