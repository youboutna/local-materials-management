
import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, TrendingUp, AlertCircle, CheckCircle2, Users, PieChart, Layers, DollarSign, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusBadge from '@/components/StatusBadge';
import ProgressIndicator from '@/components/ProgressIndicator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Sample data for dashboard
const projectStats = [
  {
    title: 'Projets actifs',
    value: 7,
    icon: <Layers className="h-5 w-5 text-blue-500" />,
    change: '+2 ce mois',
    trend: 'up',
  },
  {
    title: 'Budget total',
    value: '56.8M MRU',
    icon: <DollarSign className="h-5 w-5 text-green-500" />,
    change: '+12% depuis janvier',
    trend: 'up',
  },
  {
    title: 'Matériaux utilisés',
    value: '1,240 tonnes',
    icon: <Database className="h-5 w-5 text-purple-500" />,
    change: '52% pierre, 48% argile',
    trend: 'neutral',
  },
  {
    title: 'Personnel mobilisé',
    value: '142',
    icon: <Users className="h-5 w-5 text-amber-500" />,
    change: '+15 la semaine dernière',
    trend: 'up',
  },
];

const budgetData = [
  { name: 'Jan', prévu: 2500000, réel: 2700000 },
  { name: 'Fév', prévu: 3200000, réel: 3100000 },
  { name: 'Mar', prévu: 4100000, réel: 3900000 },
  { name: 'Avr', prévu: 3800000, réel: 4200000 },
  { name: 'Mai', prévu: 4500000, réel: 4300000 },
  { name: 'Juin', prévu: 4200000, réel: 4800000 },
];

const activeProjects = [
  {
    id: '1',
    title: 'Restauration du Fort d\'Atar',
    status: 'en cours' as const,
    progress: 65,
    budget: '12.5M MRU',
    dueDate: '30 juin 2024',
    alert: false,
  },
  {
    id: '2',
    title: 'Centre Culturel en Argile',
    status: 'en attente' as const,
    progress: 25,
    budget: '8.75M MRU',
    dueDate: '15 déc. 2024',
    alert: true,
    alertMessage: 'Retard dans l\'approvisionnement',
  },
  {
    id: '3',
    title: 'Rénovation Bibliothèque Nationale',
    status: 'en cours' as const,
    progress: 42,
    budget: '14.2M MRU',
    dueDate: '10 sept. 2024',
    alert: false,
  },
  {
    id: '4',
    title: 'Maisons écologiques Nouadhibou',
    status: 'en cours' as const,
    progress: 78,
    budget: '5.6M MRU',
    dueDate: '22 août 2024',
    alert: false,
  },
  {
    id: '5',
    title: 'Musée des Arts Traditionnels',
    status: 'suspendu' as const,
    progress: 35,
    budget: '9.8M MRU',
    dueDate: '5 nov. 2024',
    alert: true,
    alertMessage: 'Financement en attente',
  },
];

const recentActivities = [
  {
    id: '1',
    type: 'update',
    project: 'Restauration du Fort d\'Atar',
    description: 'Livraison de 25 tonnes de pierre d\'Atar',
    time: 'Il y a 2 heures',
    icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
  },
  {
    id: '2',
    type: 'alert',
    project: 'Centre Culturel en Argile',
    description: 'Retard dans l\'approvisionnement en argile',
    time: 'Il y a 5 heures',
    icon: <AlertCircle className="h-4 w-4 text-amber-500" />,
  },
  {
    id: '3',
    type: 'completion',
    project: 'École Communautaire Durable',
    description: 'Phase de fondation terminée',
    time: 'Hier',
    icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  },
  {
    id: '4',
    type: 'update',
    project: 'Maisons écologiques Nouadhibou',
    description: 'Recrutement de 5 nouveaux artisans',
    time: 'Il y a 2 jours',
    icon: <Users className="h-4 w-4 text-purple-500" />,
  },
  {
    id: '5',
    type: 'alert',
    project: 'Musée des Arts Traditionnels',
    description: 'Suspension temporaire des travaux',
    time: 'Il y a 3 jours',
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
  },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Dashboard Header */}
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
              Vue d'ensemble des projets et des indicateurs clés
            </motion.p>
          </div>
          
          {/* Dashboard Tabs */}
          <Tabs 
            defaultValue="overview" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid grid-cols-3 md:w-[400px] bg-sandstone-100">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-white">Projets</TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-white">Budget</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {projectStats.map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border-none shadow-elegant hover:shadow-soft transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-adrar-500 mb-1">{stat.title}</p>
                            <p className="text-2xl font-semibold text-adrar-800">{stat.value}</p>
                          </div>
                          <div className="bg-sandstone-100 p-3 rounded-full">
                            {stat.icon}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center text-xs">
                          {stat.trend === 'up' && (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          )}
                          {stat.trend === 'down' && (
                            <TrendingUp className="h-3 w-3 text-red-500 mr-1 transform rotate-180" />
                          )}
                          <span className={`text-${stat.trend === 'up' ? 'green' : stat.trend === 'down' ? 'red' : 'gray'}-500`}>
                            {stat.change}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              
              {/* Active Projects and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Projects */}
                <Card className="lg:col-span-2 border-none shadow-elegant">
                  <CardHeader>
                    <CardTitle>Projets actifs</CardTitle>
                    <CardDescription>Suivi des projets en cours de réalisation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {activeProjects.slice(0, 3).map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                          className="p-4 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-adrar-800">{project.title}</h3>
                            <StatusBadge status={project.status} />
                          </div>
                          
                          <ProgressIndicator progress={project.progress} className="mb-3" />
                          
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-adrar-600">
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-terracotta-500" />
                              <span>{project.budget}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-terracotta-500" />
                              <span>Échéance: {project.dueDate}</span>
                            </div>
                            {project.alert && (
                              <div className="flex items-center text-amber-500 w-full mt-1">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                <span>{project.alertMessage}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      <div className="pt-2 text-center">
                        <button className="text-terracotta-500 hover:text-terracotta-600 font-medium text-sm flex items-center justify-center mx-auto">
                          Voir tous les projets
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card className="border-none shadow-elegant">
                  <CardHeader>
                    <CardTitle>Activités récentes</CardTitle>
                    <CardDescription>Dernières mises à jour et alertes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                          className="flex gap-3"
                        >
                          <div className={`rounded-full p-2 mt-0.5 h-8 w-8 flex items-center justify-center flex-shrink-0 ${
                            activity.type === 'alert' 
                              ? 'bg-amber-100' 
                              : activity.type === 'completion' 
                              ? 'bg-green-100' 
                              : 'bg-blue-100'
                          }`}>
                            {activity.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-adrar-800">
                              {activity.project}
                            </p>
                            <p className="text-sm text-adrar-600">
                              {activity.description}
                            </p>
                            <p className="text-xs text-adrar-400 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {activity.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Budget Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="border-none shadow-elegant">
                  <CardHeader>
                    <CardTitle>Aperçu du budget</CardTitle>
                    <CardDescription>Comparaison des coûts prévus et réels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis 
                            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} 
                            width={70}
                          />
                          <Tooltip 
                            formatter={(value) => [`${(Number(value) / 1000000).toFixed(2)}M MRU`, undefined]}
                            labelFormatter={(label) => `Mois: ${label}`}
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: 'none',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
                            }}
                          />
                          <Bar dataKey="prévu" fill="#9b87f5" radius={[4, 4, 0, 0]} name="Budget prévu" />
                          <Bar dataKey="réel" fill="#B85C38" radius={[4, 4, 0, 0]} name="Dépenses réelles" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
            
            {/* Projects Tab - Just a placeholder for now */}
            <TabsContent value="projects" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle>Tous les projets</CardTitle>
                  <CardDescription>Vue détaillée de tous les projets en cours</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-adrar-600">Contenu détaillé des projets à implémenter</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Budget Tab - Just a placeholder for now */}
            <TabsContent value="budget" className="space-y-6">
              <Card className="border-none shadow-elegant">
                <CardHeader>
                  <CardTitle>Gestion budgétaire</CardTitle>
                  <CardDescription>Analyse détaillée des budgets et dépenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-adrar-600">Contenu détaillé du budget à implémenter</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
