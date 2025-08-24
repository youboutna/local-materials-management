import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

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
  const filters: FilterField[] = [
    {
      key: 'department',
      label: 'Départements',
      placeholder: 'Tous les départements',
      value: departmentFilter,
      onChange: onDepartmentChange,
      options: availableDepartments.map(dept => ({ value: dept, label: dept }))
    },
    {
      key: 'position',
      label: 'Postes',
      placeholder: 'Tous les postes',
      value: positionFilter,
      onChange: onPositionChange,
      options: availablePositions.map(position => ({ value: position, label: position }))
    },
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
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
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as EmployeeSortOption),
      options: [
        { value: 'name-asc', label: 'Nom (A-Z)' },
        { value: 'name-desc', label: 'Nom (Z-A)' },
        { value: 'hire-date', label: 'Date d\'embauche' },
        { value: 'department', label: 'Département' },
        { value: 'position', label: 'Poste' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher des employés..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default EmployeeFilters;