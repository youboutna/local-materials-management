
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, CheckSquare, ArrowRight, Users, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LoadDataButton from '@/components/LoadDataButton';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      toast({
        title: "Accès restreint",
        description: "Veuillez vous connecter pour accéder au tableau de bord.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <motion.h1 
              className="text-3xl font-bold text-adrar-900 font-serif"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Tableau de bord
            </motion.h1>
            <div className="space-x-2">
              <LoadDataButton 
                variant="outline" 
                className="border-terracotta-300 text-terracotta-600 hover:bg-terracotta-50"
              />
            </div>
          </div>
          
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-terracotta-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Projets en cours</CardTitle>
                <CardDescription>Statut général</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">4</span>
                  <span className="ml-2 text-sm text-gray-500">projets actifs</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-adrar-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Budget total</CardTitle>
                <CardDescription>Ressources financières</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">42.5M</span>
                  <span className="ml-2 text-sm text-gray-500">MRU</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-sandstone-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Équipe</CardTitle>
                <CardDescription>Personnel de projet</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">27</span>
                  <span className="ml-2 text-sm text-gray-500">membres</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Matériaux</CardTitle>
                <CardDescription>Ressources disponibles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-adrar-800">12</span>
                  <span className="ml-2 text-sm text-gray-500">types</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <BarChart3 className="h-5 w-5 mr-2 text-terracotta-600" />
                  Progression des projets
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {/* Chart placeholder */}
                <div className="h-full w-full bg-gradient-to-br from-terracotta-100 to-white flex items-center justify-center rounded-lg border border-dashed border-terracotta-300">
                  <span className="text-terracotta-400 text-sm font-medium">Statistiques de progression</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl font-serif">
                  <div className="flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-terracotta-600" />
                    Projets récents
                  </div>
                  <Link to="/projects">
                    <Button variant="ghost" size="sm" className="text-terracotta-600 hover:text-terracotta-700 -mr-2">
                      <span className="text-xs mr-1">Voir tout</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Rénovation École Primaire", location: "Atar", date: "Déc 2023" },
                    { name: "Puits Communautaire", location: "Chinguetti", date: "Jan 2024" },
                    { name: "Centre de Formation", location: "Nouakchott", date: "Fév 2024" }
                  ].map((project, i) => (
                    <div key={i} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="bg-terracotta-100 p-2 rounded-md mr-3">
                        <CheckSquare className="h-5 w-5 text-terracotta-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-adrar-800">{project.name}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="mr-3">{project.location}</span>
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{project.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <Users className="h-5 w-5 mr-2 text-adrar-600" />
                  Activité de l'équipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Ahmed Mahmoud", action: "a mis à jour le projet 'Centre de Formation'", time: "Il y a 2h" },
                    { name: "Fatima Diallo", action: "a ajouté un nouveau matériau", time: "Il y a 5h" },
                    { name: "Mohamed Ould", action: "a complété la phase 1 du projet 'Puits Communautaire'", time: "Hier" }
                  ].map((activity, i) => (
                    <div key={i} className="flex items-start pb-4 border-b border-gray-100 last:border-0">
                      <div className="bg-adrar-100 h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium text-adrar-800 mr-3">
                        {activity.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium text-adrar-800">{activity.name}</span>
                          {' '}
                          <span className="text-gray-600">{activity.action}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-serif">
                  <MapPin className="h-5 w-5 mr-2 text-adrar-600" />
                  Distribution des projets
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                {/* Map placeholder */}
                <div className="h-full w-full bg-gradient-to-br from-adrar-100 to-white flex items-center justify-center rounded-lg border border-dashed border-adrar-300">
                  <span className="text-adrar-400 text-sm font-medium">Carte de distribution des projets</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
