
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    location?: string;
    dateRange?: any;
  }) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ onFilterChange }) => {
  const [status, setStatus] = useState('');
  const [location, setLocation] = useState('');

  const handleFilterUpdate = () => {
    onFilterChange({
      status: status || undefined,
      location: location || undefined,
    });
  };

  const handleReset = () => {
    setStatus('');
    setLocation('');
    onFilterChange({});
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label htmlFor="status-filter">Statut</Label>
        <Select value={status} onValueChange={(value) => {
          setStatus(value);
          setTimeout(handleFilterUpdate, 0);
        }}>
          <SelectTrigger>
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en cours">En cours</SelectItem>
            <SelectItem value="terminé">Terminé</SelectItem>
            <SelectItem value="en attente">En attente</SelectItem>
            <SelectItem value="en inspection">En inspection</SelectItem>
            <SelectItem value="suspendu">Suspendu</SelectItem>
            <SelectItem value="annulé">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-filter">Localisation</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="location-filter"
            placeholder="Rechercher par région..."
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setTimeout(handleFilterUpdate, 300);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>&nbsp;</Label>
        <Button variant="outline" onClick={handleReset} className="w-full">
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default ProjectFilters;
