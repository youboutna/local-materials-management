
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  regionFilter: string;
  onRegionChange: (region: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableStatuses: string[];
  availableRegions: { code: string; name: string; nameAr: string }[];
  onReset: () => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ 
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  regionFilter,
  onRegionChange,
  sortOption,
  onSortChange,
  availableStatuses,
  availableRegions,
  onReset
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="search-filter">Recherche</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="search-filter"
            placeholder="Rechercher projets..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status-filter">Statut</Label>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region Filter */}
      <div className="space-y-2">
        <Label htmlFor="region-filter">Région</Label>
        <Select value={regionFilter} onValueChange={onRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les régions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les régions</SelectItem>
            {availableRegions.map((region) => (
              <SelectItem key={region.code} value={region.code}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label htmlFor="sort-filter">Trier par</Label>
        <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
          <SelectTrigger>
            <SelectValue placeholder="Trier par..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Plus récent</SelectItem>
            <SelectItem value="oldest">Plus ancien</SelectItem>
            <SelectItem value="budget-high">Budget élevé</SelectItem>
            <SelectItem value="budget-low">Budget faible</SelectItem>
            <SelectItem value="progress">Progrès</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      <div className="space-y-2">
        <Label>&nbsp;</Label>
        <Button variant="outline" onClick={onReset} className="w-full">
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default ProjectFilters;
