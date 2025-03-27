
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  ArrowDownWideNarrow, 
  ArrowUpWideNarrow, 
  X,
  ArrowRight
} from 'lucide-react';
import { ProjectData } from '@/components/ProjectCard';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useEffect, useRef, useState } from 'react';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  searchResults?: ProjectData[];
  showSearchResults?: boolean;
  handleSelectSearchResult?: (projectId: string) => void;
  clearSearch?: () => void;
}

const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
  searchResults = [],
  showSearchResults = false,
  handleSelectSearchResult = () => {},
  clearSearch = () => {}
}: ProjectFiltersProps) => {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };
  
  // Handle search result click
  const handleResultClick = (projectId: string) => {
    handleSelectSearchResult(projectId);
    setOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-elegant p-4 mb-8"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow" ref={inputRef}>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
            <Input
              placeholder="Rechercher un projet..."
              className="pl-9 border-sandstone-200 focus-visible:ring-terracotta-500"
              value={searchQuery}
              onChange={handleInputChange}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className="absolute right-3 top-3"
              >
                <X className="h-4 w-4 text-adrar-400 hover:text-adrar-700" />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {open && searchResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-sandstone-200 rounded-md shadow-md">
              <div className="p-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-adrar-500 mb-2 px-2">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                </p>
                {searchResults.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center px-3 py-2 hover:bg-sandstone-50 rounded-md cursor-pointer"
                    onClick={() => handleResultClick(project.id)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-adrar-800">{project.title}</p>
                      <p className="text-xs text-adrar-500 truncate">{project.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-terracotta-500 ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {open && searchResults.length === 0 && searchQuery && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-sandstone-200 rounded-md shadow-md p-4 text-center">
              <p className="text-adrar-500">Aucun résultat pour "{searchQuery}"</p>
            </div>
          )}
        </div>
        
        {/* Status Filter */}
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="border-sandstone-200 focus:ring-terracotta-500">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en cours">En cours</SelectItem>
              <SelectItem value="en attente">En attente</SelectItem>
              <SelectItem value="terminé">Terminé</SelectItem>
              <SelectItem value="suspendu">Suspendu</SelectItem>
              <SelectItem value="annulé">Annulé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort Options */}
        <div className="w-full md:w-48">
          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="border-sandstone-200 focus:ring-terracotta-500">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <ArrowDownWideNarrow className="mr-2 h-4 w-4" />
                  Plus récents
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <ArrowUpWideNarrow className="mr-2 h-4 w-4" />
                  Plus anciens
                </div>
              </SelectItem>
              <SelectItem value="budget-high">Budget (décroissant)</SelectItem>
              <SelectItem value="budget-low">Budget (croissant)</SelectItem>
              <SelectItem value="progress">Progression</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* New Project Button */}
        <div>
          <Link to="/projects/new">
            <Button className="bg-terracotta-500 hover:bg-terracotta-600 w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectFilters;
