
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
import { Search, Plus, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
}

const ProjectFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption
}: ProjectFiltersProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-elegant p-4 mb-8"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
          <Input
            placeholder="Rechercher un projet..."
            className="pl-9 border-sandstone-200 focus-visible:ring-terracotta-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
