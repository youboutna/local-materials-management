import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, FileText, Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated, you could redirect to dashboard or keep them on home
  // For now, we'll keep them on the home page but show authenticated content

  const features = [
    {
      icon: Briefcase,
      title: "Gestion de Projets",
      description: "Suivez et gérez tous vos projets de construction en temps réel",
      link: "/projects"
    },
    {
      icon: Package,
      title: "Gestion de Matériaux",
      description: "Inventaire et suivi des matériaux de construction",
      link: "/materials"
    },
    {
      icon: FileText,
      title: "Documentation",
      description: "Centralisez tous vos documents et rapports",
      link: "/documents"
    },
    {
      icon: Users,
      title: "Équipes",
      description: "Gérez vos équipes et assignez les tâches",
      link: "/users"
    },
    {
      icon: BarChart3,
      title: "Tableau de Bord",
      description: "Visualisez les performances et statistiques",
      link: "/dashboard"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-adrar-900 mb-4">
                Fonctionnalités Principales
              </h2>
              <p className="text-lg text-adrar-600 max-w-2xl mx-auto">
                Découvrez toutes les fonctionnalités de notre plateforme de gestion de construction
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-elegant p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center mb-6">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-adrar-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-adrar-600 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <Button asChild className="w-full">
                      <Link to={feature.link}>
                        Découvrir
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-terracotta-500 to-adrar-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {user 
                ? "Accédez à votre tableau de bord pour gérer vos projets"
                : "Rejoignez-nous et transformez votre gestion de construction"
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/dashboard">
                      Tableau de Bord
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-terracotta-600" asChild>
                    <Link to="/projects">
                      Mes Projets
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/auth?mode=register">
                      Commencer Gratuitement
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-terracotta-600" asChild>
                    <Link to="/auth?mode=login">
                      Se Connecter
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
