
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
import { useProjects } from '@/hooks/useProjects';
import { ProjectData } from '@/components/ProjectCard';

const Dashboard = () => {
  const { projects, loading } = useProjects();
  
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
                      <h3 className="text-lg font-semibold text-adrar-800 mb-2 mt-6">
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
                    <div className="mb-4 mt-6">
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
                  <CardContent className="mt-6">
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
