import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/contexts/use-auth';
import { useKeycloakAuth } from "@/contexts/KeycloakAuthContext";
import MergedNavbar from "@/components/MergedNavbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import AboutEditor from "@/components/AboutEditor";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Package,
  FileText,
  Users,
  BarChart3,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Index = () => {
  const { user: authUser, loading } = useAuth();
  const { user: keycloakUser, isAuthenticated } = useKeycloakAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  console.log("🔍 Index - t function:", typeof t, t);
  console.log(
    "🔍 Index - authUser:",
    !!authUser,
    "keycloakUser:",
    !!keycloakUser,
    "isAuthenticated:",
    isAuthenticated
  );

  // Check if user is authenticated (either through AuthContext or KeycloakAuthContext)
  const isUserAuthenticated = !!authUser || isAuthenticated;

  // Safe translation function with fallback
  const safeT = (key: string, fallback: string = "") => {
    try {
      if (typeof t === "function") {
        return t(key) || fallback;
      }
      return fallback;
    } catch (error) {
      console.error("Translation error for key:", key, error);
      return fallback;
    }
  };

  const features = [
    {
      icon: Briefcase,
      title: safeT("index.feature.projects.title", "Projets"),
      description: safeT(
        "index.feature.projects.description",
        "Gérez vos projets de construction"
      ),
      link: "/projects",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Package,
      title: safeT("index.feature.materials.title", "Matériaux"),
      description: safeT(
        "index.feature.materials.description",
        "Gestion des matériaux"
      ),
      link: "/materials",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: FileText,
      title: safeT("index.feature.documents.title", "Documents"),
      description: safeT(
        "index.feature.documents.description",
        "Gestion documentaire"
      ),
      link: "/documents",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      title: safeT("index.feature.teams.title", "Équipes"),
      description: safeT(
        "index.feature.teams.description",
        "Gestion des équipes"
      ),
      link: "/users",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: BarChart3,
      title: safeT("index.feature.dashboard.title", "Tableau de bord"),
      description: safeT(
        "index.feature.dashboard.description",
        "Vue d'ensemble"
      ),
      link: "/dashboard",
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <main className="flex-grow py-16 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-adrar-600 font-medium">
              {safeT("index.loading", "Chargement...")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="-mt-5 min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="flex-grow">
        {/* Hero Section */}
        <Hero />

        {/* About System Section */}

        {/* Features Section */}
        <section className="py-20 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-adrar-50 border border-adrar-200 text-adrar-700 text-sm font-medium mb-4">
                <Zap className="h-4 w-4" />
                {safeT("index.features.powered", "Plateforme complète")}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-adrar-900 mb-4 bg-gradient-to-br from-adrar-800 to-adrar-600 bg-clip-text text-transparent">
                {safeT("index.features.title", "Fonctionnalités")}
              </h2>
              <p className="text-xl text-adrar-600 max-w-2xl mx-auto leading-relaxed">
                {safeT(
                  "index.features.description",
                  "Découvrez nos outils de gestion"
                )}
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-adrar-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
                    <div className="relative bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-terracotta-200">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-adrar-900 mb-3 group-hover:text-adrar-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-adrar-600 mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      {/* Only show action buttons for authenticated users */}
                      {isUserAuthenticated ? (
                        <Button asChild className="w-full group/btn">
                          <Link
                            to={feature.link}
                            className="flex items-center justify-center gap-2"
                          >
                            {safeT("index.features.discover", "Découvrir")}
                            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild className="w-full" variant="outline">
                          <Link
                            to="/auth"
                            className="flex items-center justify-center gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            {safeT(
                              "index.features.login_to_access",
                              "Se connecter pour accéder"
                            )}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-terracotta-500 via-terracotta-600 to-adrar-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px]" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                {safeT("index.cta.title", "Commencez dès maintenant")}
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
                {isUserAuthenticated
                  ? safeT(
                      "index.cta.authenticated",
                      "Accédez à votre tableau de bord"
                    )
                  : safeT(
                      "index.cta.unauthenticated",
                      "Créez votre compte pour commencer"
                    )}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isUserAuthenticated ? (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="secondary"
                        asChild
                        className="rounded-full px-8"
                      >
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-2"
                        >
                          {safeT("index.cta.dashboard", "Tableau de bord")}
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 text-white border-white hover:bg-white hover:text-terracotta-600 transition-all duration-300"
                        asChild
                      >
                        <Link
                          to="/projects"
                          className="flex items-center gap-2"
                        >
                          {safeT("index.cta.my_projects", "Mes projets")}
                          <Briefcase className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="secondary"
                        asChild
                        className="rounded-full px-8"
                      >
                        <Link
                          to="/auth?mode=register"
                          className="flex items-center gap-2"
                        >
                          {safeT(
                            "index.cta.start_free",
                            "Commencer gratuitement"
                          )}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full px-8 text-white border-white hover:bg-white hover:text-terracotta-600 transition-all duration-300"
                        asChild
                      >
                        <Link
                          to="/auth?mode=login"
                          className="flex items-center gap-2"
                        >
                          {safeT("index.cta.login", "Se connecter")}
                          <Shield className="h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
