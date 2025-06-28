
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, MapPin, Users, TrendingUp, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  const stats = [
    {
      title: "Projets en cours",
      value: "42",
      icon: Building,
      color: "text-blue-600"
    },
    {
      title: "Régions couvertes",
      value: "15",
      icon: MapPin,
      color: "text-green-600"
    },
    {
      title: "Équipes actives",
      value: "28",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Croissance",
      value: "+24%",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-adrar-50 to-terracotta-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-serif text-adrar-800 mb-6">
              Gestion de Projets BTP
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Plateforme complète de gestion des projets de construction, 
              matériaux et équipes en Mauritanie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/projects">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-8 py-3 text-lg">
                  Voir les Projets
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="outline" className="border-adrar-300 text-adrar-700 px-8 py-3 text-lg">
                  Tableau de Bord
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building className="h-12 w-12 mx-auto text-terracotta-500 mb-4" />
                <CardTitle className="text-xl text-adrar-800">
                  Gestion de Projets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Suivez vos projets de construction de A à Z avec des outils 
                  de planification et de suivi avancés.
                </p>
                <Link to="/projects">
                  <Button variant="ghost" className="mt-4 text-terracotta-600">
                    En savoir plus
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <MapPin className="h-12 w-12 mx-auto text-terracotta-500 mb-4" />
                <CardTitle className="text-xl text-adrar-800">
                  Géolocalisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Visualisez tous vos projets et matériaux sur une carte 
                  interactive de la Mauritanie.
                </p>
                <Link to="/projects">
                  <Button variant="ghost" className="mt-4 text-terracotta-600">
                    Voir la carte
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-terracotta-500 mb-4" />
                <CardTitle className="text-xl text-adrar-800">
                  Gestion d'Équipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Coordonnez vos équipes, assignez des tâches et suivez 
                  les performances en temps réel.
                </p>
                <Link to="/tasks">
                  <Button variant="ghost" className="mt-4 text-terracotta-600">
                    Gérer les tâches
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-serif text-adrar-800 mb-8">
              Actions Rapides
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/projects/create">
                <Button className="bg-adrar-600 hover:bg-adrar-700 text-white">
                  Nouveau Projet
                </Button>
              </Link>
              <Link to="/materials">
                <Button variant="outline" className="border-terracotta-300 text-terracotta-700">
                  Matériaux
                </Button>
              </Link>
              <Link to="/documents">
                <Button variant="outline" className="border-adrar-300 text-adrar-700">
                  Documents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;
