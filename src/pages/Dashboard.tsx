import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Building, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProgressIndicator from '@/components/ProgressIndicator';

interface ProjectData {
  id: string;
  title: string;
  description: string;
  location: string;
  status: 'en cours' | 'terminé' | 'en attente' | 'suspendu' | 'annulé';
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
}

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

const Dashboard = () => {
  const [projects, setProjects] = useState<ProjectData[]>(projectsData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading of projects
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

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
              Tableau de bord
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-adrar-600"
            >
              Suivez l'état d'avancement de vos projets et l'utilisation des matériaux locaux
            </motion.p>
          </div>
          
          {/* Loading state */}
          {loading ? (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-xl text-adrar-700 mb-4"
              >
                Chargement des projets...
              </motion.div>
              <div className="w-24 h-1 bg-gray-300 rounded-full overflow-hidden mx-auto">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.7, ease: "easeInOut", repeat: Infinity }}
                  className="h-full bg-terracotta-500"
                />
              </div>
            </div>
          ) : (
            /* Dashboard content */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Project Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-adrar-800 mb-2">
                        Aperçu des projets
                      </h3>
                      <p className="text-adrar-600 text-sm">
                        État d'avancement général des projets en cours
                      </p>
                    </div>
                    <div className="mt-4">
                      {projects.map((project) => (
                        <div key={project.id} className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-adrar-700">{project.title}</span>
                            <span className="text-xs text-adrar-500">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Active Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-adrar-800 mb-2">
                        Projets actifs
                      </h3>
                      <p className="text-adrar-600 text-sm">
                        Suivez les projets actuellement en cours
                      </p>
                    </div>
                    <div>
                      {projects
                        .filter((project) => project.status === 'en cours')
                        .map((project) => (
                          <div key={project.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-none">
                            <div>
                              <h4 className="text-sm font-medium text-adrar-700">{project.title}</h4>
                              <p className="text-xs text-adrar-500">{project.location}</p>
                            </div>
                            <Link to={`/projects/${project.id}`}>
                              <Button size="sm" className="bg-terracotta-500 hover:bg-terracotta-600">
                                Voir <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Material Usage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="h-full">
                  <CardContent>
                    <h3 className="text-lg font-semibold text-adrar-800 mb-2">
                      Utilisation des matériaux
                    </h3>
                    <p className="text-adrar-600 text-sm">
                      Consultez les statistiques sur l'utilisation des matériaux locaux
                    </p>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-adrar-700">Pierre d'Atar</span>
                        <span className="text-xs text-adrar-500">75%</span>
                      </div>
                      <ProgressIndicator progress={75} size="sm" showPercentage={false} />
                      
                      <div className="flex items-center justify-between mb-2 mt-4">
                        <span className="text-sm text-adrar-700">Argile</span>
                        <span className="text-xs text-adrar-500">45%</span>
                      </div>
                      <ProgressIndicator progress={45} size="sm" showPercentage={false} />
                      
                      <div className="flex items-center justify-between mb-2 mt-4">
                        <span className="text-sm text-adrar-700">Bois local</span>
                        <span className="text-xs text-adrar-500">20%</span>
                      </div>
                      <ProgressIndicator progress={20} size="sm" showPercentage={false} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
