import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

export type TenderSortOption = 'newest' | 'oldest' | 'deadline' | 'budget-high' | 'budget-low';

interface TenderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  marketTypeFilter: string;
  onMarketTypeChange: (type: string) => void;
  sortOption: TenderSortOption;
  onSortChange: (sort: TenderSortOption) => void;
  availableStatuses: string[];
  availableMarketTypes: string[];
  onReset: () => void;
  resultCount?: number;
}

const TenderFilters: React.FC<TenderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  marketTypeFilter,
  onMarketTypeChange,
  sortOption,
  onSortChange,
  availableStatuses,
  availableMarketTypes,
  onReset,
  resultCount
}) => {
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'status',
      label: t('auto.tenderfilters.statuts'),
      placeholder: t('auto.tenderfilters.tous_les_statuts'),
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'draft' ? t('auto.tenderfilters.brouillon') :
               status === 'published' ? t('auto.tenderfilters.publie') :
               status === 'closed' ? t('auto.tenderfilters.ferme') :
               status === 'awarded' ? t('auto.tenderfilters.attribue') : status
      }))
    },
    {
      key: 'marketType',
      label: t('auto.tenderfilters.types_de_marche'),
      placeholder: t('auto.tenderfilters.tous_les_types'),
      value: marketTypeFilter,
      onChange: onMarketTypeChange,
      options: availableMarketTypes.map(type => ({ value: type, label: type }))
    },
    {
      key: 'sort',
      label: t('auto.tenderfilters.tri'),
      placeholder: t('auto.tenderfilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as TenderSortOption),
      options: [
        { value: 'newest', label: t('auto.tenderfilters.plus_recent') },
        { value: 'oldest', label: t('auto.tenderfilters.plus_ancien') },
        { value: 'deadline', label: t('auto.tenderfilters.echeance_proche') },
        { value: 'budget-high', label: t('auto.tenderfilters.budget_eleve') },
        { value: 'budget-low', label: t('auto.tenderfilters.budget_faible') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('auto.tenderfilters.rechercher_des_appels_d_offres')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default TenderFilters;