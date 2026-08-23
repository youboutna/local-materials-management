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
        label: type === 'inspection_report' ? t('auto.documentfilters.rapport_d_inspection') :
               type === 'location_photo' ? t('auto.documentfilters.photo_de_lieu') :
               type === 'project_report' ? t('auto.documentfilters.rapport_de_projet') :
               type === 'contract' ? t('auto.documentfilters.contrat') :
               type === 'supplier_info' ? t('auto.documentfilters.info_fournisseur') :
               type === 'task_assignment' ? t('auto.documentfilters.affectation_de_tache') :
               type === 'employee_record' ? t('auto.documentfilters.dossier_employe') :
               type === 'tender_documents' ? t('auto.documentfilters.documents_d')appel d\'offres' : type
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
        label: status === 'draft' ? t('auto.documentfilters.brouillon') :
               status === 'approved' ? t('auto.documentfilters.approuve') :
               status === 'pending' ? t('auto.documentfilters.en_attente') :
               status === 'rejected' ? t('auto.documentfilters.rejete') : status
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