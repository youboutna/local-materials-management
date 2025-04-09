
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, Filter, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MapLocation } from '@/components/ProjectMap';

// Define the regions (wilayas) in Mauritania
const wilayas = [
  'Adrar', 
  'Assaba', 
  'Brakna', 
  'Dakhlet Nouadhibou', 
  'Gorgol', 
  'Guidimaka', 
  'Hodh Ech Chargui', 
  'Hodh El Gharbi', 
  'Inchiri', 
  'Nouakchott', 
  'Tagant', 
  'Tiris Zemmour', 
  'Trarza'
];

interface MapFiltersProps {
  locations: MapLocation[];
  onFilterChange: (filteredLocations: MapLocation[]) => void;
}

const MapFilters = ({ locations, onFilterChange }: MapFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Handle date selection for start date
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date || null);
  };
  
  // Handle date selection for end date
  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date || null);
  };

  // Apply filters and update parent component
  const applyFilters = () => {
    const newActiveFilters: string[] = [];
    
    let filtered = [...locations];
    
    // Apply status filter
    if (statusFilter && statusFilter !== ""){
      filtered = filtered.filter(loc => loc.status === statusFilter);
      newActiveFilters.push(`Statut: ${statusFilter}`);
    }
    
    // Apply region filter
    if (regionFilter && regionFilter!== "") {
      filtered = filtered.filter(loc => loc.region === regionFilter);
      newActiveFilters.push(`Wilaya: ${regionFilter}`);
    }
    
    // Apply date filters
    if (startDate || endDate) {
      filtered = filtered.filter(loc => {
        const locStartDate = loc.startDate ? new Date(loc.startDate) : null;
        const locEndDate = loc.endDate ? new Date(loc.endDate) : null;
        
        if (startDate && !locStartDate) return false;
        if (endDate && !locStartDate) return false;
        
        const afterStartDate = !startDate || (locStartDate && locStartDate >= startDate);
        const beforeEndDate = !endDate || (locStartDate && locStartDate <= endDate);
        
        return afterStartDate && beforeEndDate;
      });
      
      if (startDate) {
        newActiveFilters.push(`Après: ${format(startDate, 'dd/MM/yyyy')}`);
      }
      
      if (endDate) {
        newActiveFilters.push(`Avant: ${format(endDate, 'dd/MM/yyyy')}`);
      }
    }
    
    setActiveFilters(newActiveFilters);
    onFilterChange(filtered);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setStatusFilter(null);
    setRegionFilter(null);
    setStartDate(null);
    setEndDate(null);
    setActiveFilters([]);
    onFilterChange(locations);
  };
  
  // Remove a specific filter
  const removeFilter = (filter: string) => {
    if (filter.startsWith('Statut:')) {
      setStatusFilter(null);
    } else if (filter.startsWith('Wilaya:')) {
      setRegionFilter(null);
    } else if (filter.startsWith('Après:')) {
      setStartDate(null);
    } else if (filter.startsWith('Avant:')) {
      setEndDate(null);
    }
    
    setActiveFilters(activeFilters.filter(f => f !== filter));
    
    // Re-apply remaining filters
    setTimeout(() => {
      applyFilters();
    }, 0);
  };

  return (
    <div className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between mb-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              Filtrer la carte
            </Button>
          </CollapsibleTrigger>
          
          {activeFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs">
              Réinitialiser les filtres
            </Button>
          )}
        </div>
        
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {filter}
                <button onClick={() => removeFilter(filter)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mt-2">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Statut</label>
              <Select value={statusFilter || ""} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="en cours">En cours</SelectItem>
                  <SelectItem value="terminé">Terminé</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Wilaya</label>
              <Select value={regionFilter || ""} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les wilayas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les wilayas</SelectItem>
                  {wilayas.map(wilaya => (
                    <SelectItem key={wilaya} value={wilaya}>
                      {wilaya}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Période</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd/MM/yyyy') : "Date début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate || undefined}
                      onSelect={handleStartDateSelect}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd/MM/yyyy') : "Date fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate || undefined}
                      onSelect={handleEndDateSelect}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="default" onClick={applyFilters} className="gap-1">
              <Check className="h-4 w-4" />
              Appliquer les filtres
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MapFilters;
