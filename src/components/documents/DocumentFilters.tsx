import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'type',
      label: t('auto.documentfilters.types'),
      placeholder: t('auto.documentfilters.tous_les_types'),
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
      label: t('auto.documentfilters.statuts'),
      placeholder: t('auto.documentfilters.tous_les_statuts'),
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
      label: t('auto.documentfilters.tri'),
      placeholder: t('auto.documentfilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as DocumentSortOption),
      options: [
        { value: 'newest', label: t('auto.documentfilters.plus_recent') },
        { value: 'oldest', label: t('auto.documentfilters.plus_ancien') },
        { value: 'name-asc', label: t('auto.documentfilters.nom_a_z') },
        { value: 'name-desc', label: t('auto.documentfilters.nom_z_a') },
        { value: 'size-desc', label: t('auto.documentfilters.taille_grande') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('auto.documentfilters.rechercher_des_documents')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default DocumentFilters;