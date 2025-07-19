
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import MainNavbar from '@/components/MainNavbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import AboutEditor from '@/components/AboutEditor';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Briefcase, Package, FileText, Users, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const { user: authUser, loading } = useAuth();
  const { user: keycloakUser, isAuthenticated } = useKeycloakAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  console.log('🔍 Index - t function:', typeof t, t);
  console.log('🔍 Index - authUser:', !!authUser, 'keycloakUser:', !!keycloakUser, 'isAuthenticated:', isAuthenticated);

  // Check if user is authenticated (either through AuthContext or KeycloakAuthContext)
  const isUserAuthenticated = !!authUser || isAuthenticated;

  // Safe translation function with fallback
  const safeT = (key: string, fallback: string = '') => {
    try {
      if (typeof t === 'function') {
        return t(key) || fallback;
      }
      return fallback;
    } catch (error) {
      console.error('Translation error for key:', key, error);
      return fallback;
    }
  };

  const features = [
    {
      icon: Briefcase,
      title: safeT("index.feature.projects.title", "Projets"),
      description: safeT("index.feature.projects.description", "Gérez vos projets de construction"),
      link: "/projects"
    },
    {
      icon: Package,
      title: safeT("index.feature.materials.title", "Matériaux"),
      description: safeT("index.feature.materials.description", "Gestion des matériaux"),
      link: "/materials"
    },
    {
      icon: FileText,
      title: safeT("index.feature.documents.title", "Documents"),
      description: safeT("index.feature.documents.description", "Gestion documentaire"),
      link: "/documents"
    },
    {
      icon: Users,
      title: safeT("index.feature.teams.title", "Équipes"),
      description: safeT("index.feature.teams.description", "Gestion des équipes"),
      link: "/users"
    },
    {
      icon: BarChart3,
      title: safeT("index.feature.dashboard.title", "Tableau de bord"),
      description: safeT("index.feature.dashboard.description", "Vue d'ensemble"),
      link: "/dashboard"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNavbar />
        <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-adrar-600">{safeT("index.loading", "Chargement...")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNavbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />
        
        {/* About System Section */}
       
        
        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-adrar-900 mb-4">
                {safeT("index.features.title", "Fonctionnalités")}
              </h2>
              <p className="text-lg text-adrar-600 max-w-2xl mx-auto">
                {safeT("index.features.description", "Découvrez nos outils de gestion")}
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
                    {/* Only show action buttons for authenticated users */}
                    {isUserAuthenticated ? (
                      <Button asChild className="w-full">
                        <Link to={feature.link}>
                          {safeT("index.features.discover", "Découvrir")}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full" variant="outline">
                        <Link to="/auth">
                          {safeT("index.features.login_to_access", "Se connecter pour accéder")}
                        </Link>
                      </Button>
                    )}
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
              {safeT("index.cta.title", "Commencez dès maintenant")}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {isUserAuthenticated 
                ? safeT("index.cta.authenticated", "Accédez à votre tableau de bord")
                : safeT("index.cta.unauthenticated", "Créez votre compte pour commencer")
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isUserAuthenticated ? (
                <>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/dashboard">
                      {safeT("index.cta.dashboard", "Tableau de bord")}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-terracotta-600" asChild>
                    <Link to="/projects">
                      {safeT("index.cta.my_projects", "Mes projets")}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/auth?mode=register">
                      {safeT("index.cta.start_free", "Commencer gratuitement")}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-terracotta-600" asChild>
                    <Link to="/auth?mode=login">
                      {safeT("index.cta.login", "Se connecter")}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      
    </div>
  );
};

export default Index;
