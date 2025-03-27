
import { useState, useEffect } from 'react';
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
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProjectCard, { ProjectData } from '@/components/ProjectCard';

// Sample projects data
const projectsData: ProjectData[] = [
  {
    id: '1',
    title: 'Restauration du Fort d\'Atar',
    description: 'Reconstruction des murs historiques avec la pierre locale d\'Atar, préservant les techniques de construction traditionnelles.',
    location: 'Atar, Adrar',
    status: 'en cours',
    progress: 65,
    budget: 12500000,
    startDate: '2023-08-15',
    endDate: '2024-06-30',
    thumbnail: '/img/project1.jpg',
    teamSize: 18
  },
  {
    id: '2',
    title: 'Centre Culturel en Argile',
    description: 'Construction d\'un centre culturel utilisant les techniques traditionnelles d\'argile améliorées pour une meilleure durabilité.',
    location: 'Nouakchott',
    status: 'en attente',
    progress: 25,
    budget: 8750000,
    startDate: '2023-11-10',
    thumbnail: '/img/project2.jpg',
    teamSize: 12
  },
  {
    id: '3',
    title: 'École Communautaire Durable',
    description: 'École construite avec des matériaux locaux, optimisée pour le climat désertique et respectueuse des traditions architecturales.',
    location: 'Kiffa, Assaba',
    status: 'terminé',
    progress: 100,
    budget: 5300000,
    startDate: '2023-02-20',
    endDate: '2023-12-15',
    thumbnail: '/img/project3.jpg',
    teamSize: 15
  },
  {
    id: '4',
    title: 'Rénovation Bibliothèque Nationale',
    description: 'Restauration de la façade et des structures intérieures en utilisant les techniques traditionnelles de construction en pierre.',
    location: 'Nouakchott',
    status: 'en cours',
    progress: 42,
    budget: 14200000,
    startDate: '2023-09-05',
    endDate: '2024-10-20',
    thumbnail: '/img/project4.jpg',
    teamSize: 22
  },
  {
    id: '5',
    title: 'Maisons écologiques Nouadhibou',
    description: 'Construction de 15 maisons écologiques utilisant principalement l\'argile locale et les techniques traditionnelles.',
    location: 'Nouadhibou',
    status: 'en cours',
    progress: 78,
    budget: 5600000,
    startDate: '2023-05-12',
    endDate: '2024-08-30',
    thumbnail: '/img/project5.jpg',
    teamSize: 14
  },
  {
    id: '6',
    title: 'Musée des Arts Traditionnels',
    description: 'Création d\'un musée dédié aux arts traditionnels mauritaniens avec une architecture emblématique en pierre d\'Atar.',
    location: 'Atar, Adrar',
    status: 'suspendu',
    progress: 35,
    budget: 9800000,
    startDate: '2023-03-22',
    endDate: '2024-11-15',
    thumbnail: '/img/project6.jpg',
    teamSize: 20
  },
  {
    id: '7',
    title: 'Centre de Formation Artisanale',
    description: 'Établissement dédié à la formation aux techniques de construction traditionnelles pour préserver les savoir-faire locaux.',
    location: 'Rosso',
    status: 'en attente',
    progress: 10,
    budget: 7300000,
    startDate: '2023-12-01',
    endDate: '2025-01-30',
    thumbnail: '/img/project7.jpg',
    teamSize: 8
  },
  {
    id: '8',
    title: 'Réhabilitation Place Publique',
    description: 'Réaménagement d\'une place publique historique en utilisant les matériaux locaux pour créer un espace communautaire.',
    location: 'Nouakchott',
    status: 'terminé',
    progress: 100,
    budget: 3900000,
    startDate: '2023-01-15',
    endDate: '2023-09-30',
    thumbnail: '/img/project8.jpg',
    teamSize: 12
  },
  {
    id: '9',
    title: 'Observatoire Astronomique',
    description: 'Construction d\'un observatoire astronomique dans le désert, avec une architecture intégrant les matériaux locaux.',
    location: 'Chinguetti',
    status: 'en cours',
    progress: 55,
    budget: 11200000,
    startDate: '2023-07-10',
    endDate: '2024-12-20',
    thumbnail: '/img/project9.jpg',
    teamSize: 16
  }
];

type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

const Projects = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>(projectsData);
  
  // Handle filtering and sorting whenever inputs change
  useEffect(() => {
    let result = [...projectsData];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        project => 
          project.title.toLowerCase().includes(query) || 
          project.description.toLowerCase().includes(query) ||
          project.location.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(project => project.status === statusFilter);
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case 'budget-high':
        result.sort((a, b) => b.budget - a.budget);
        break;
      case 'budget-low':
        result.sort((a, b) => a.budget - b.budget);
        break;
      case 'progress':
        result.sort((a, b) => b.progress - a.progress);
        break;
    }
    
    setFilteredProjects(result);
  }, [searchQuery, statusFilter, sortOption]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-serif font-bold text-adrar-800"
            >
              Projets
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-adrar-600"
            >
              Découvrez nos projets de construction utilisant les matériaux locaux
            </motion.p>
          </div>
          
          {/* Filters and Actions */}
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
          
          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-16"
            >
              <h3 className="text-xl font-serif text-adrar-700 mb-2">Aucun projet trouvé</h3>
              <p className="text-adrar-500 mb-6">Modifiez vos critères de recherche ou créez un nouveau projet.</p>
              <Link to="/projects/new">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un nouveau projet
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;
