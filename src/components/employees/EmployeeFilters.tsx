import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

export type EmployeeSortOption = 'name-asc' | 'name-desc' | 'hire-date' | 'department' | 'position';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  departmentFilter: string;
  onDepartmentChange: (department: string) => void;
  positionFilter: string;
  onPositionChange: (position: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortOption: EmployeeSortOption;
  onSortChange: (sort: EmployeeSortOption) => void;
  availableDepartments: string[];
  availablePositions: string[];
  availableStatuses: string[];
  onReset: () => void;
  resultCount?: number;
}

const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  positionFilter,
  onPositionChange,
  statusFilter,
  onStatusChange,
  sortOption,
  onSortChange,
  availableDepartments,
  availablePositions,
  availableStatuses,
  onReset,
  resultCount
}) => {
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'department',
      label: t('auto.employeefilters.departements'),
      placeholder: t('auto.employeefilters.tous_les_departements'),
      value: departmentFilter,
      onChange: onDepartmentChange,
      options: availableDepartments.map(dept => ({ value: dept, label: dept }))
    },
    {
      key: 'position',
      label: t('auto.employeefilters.postes'),
      placeholder: t('auto.employeefilters.tous_les_postes'),
      value: positionFilter,
      onChange: onPositionChange,
      options: availablePositions.map(position => ({ value: position, label: position }))
    },
    {
      key: 'status',
      label: t('auto.employeefilters.statuts'),
      placeholder: t('auto.employeefilters.tous_les_statuts'),
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'active' ? 'Actif' :
               status === 'inactive' ? 'Inactif' :
               status === 'on_leave' ? 'En congé' :
               status === 'terminated' ? 'Terminé' : status
      }))
    },
    {
      key: 'sort',
      label: t('auto.employeefilters.tri'),
      placeholder: t('auto.employeefilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as EmployeeSortOption),
      options: [
        { value: 'name-asc', label: t('auto.employeefilters.nom_a_z') },
        { value: 'name-desc', label: t('auto.employeefilters.nom_z_a') },
        { value: 'hire-date', label: 'Date d\'embauche' },
        { value: 'department', label: t('auto.employeefilters.departement') },
        { value: 'position', label: t('auto.employeefilters.poste') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('auto.employeefilters.rechercher_des_employes')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default EmployeeFilters;