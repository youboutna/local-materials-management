import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Building, MapPin, Play, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  const { t, language } = useLanguage();

  // Safe translation with fallback
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

  // Detect if current language is RTL (Arabic)
  const isRTL = language === "ar";

  const stats = [
    { number: "50+", label: safeT("index.stats.projects", "Projets Actifs") },
    { number: "15", label: safeT("index.stats.regions", "Régions") },
    { number: "99%", label: safeT("index.stats.satisfaction", "Satisfaction") },
  ];

  return (
    <div className="relative py-20 bg-adrar-900 min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background avec conteneur fixe */}
      <div className="absolute inset-0 bg-gradient-to-br from-adrar-900 via-adrar-800 to-terracotta-900" />

      {/* Éléments d'arrière-plan simplifiés */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-terracotta-500 rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-adrar-600 rounded-full blur-3xl opacity-10" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div
          className={`flex flex-col lg:flex-row items-center gap-12 ${
            isRTL ? "lg:flex-row-reverse" : ""
          }`}
        >
          {/* Section Gauche - Contenu texte */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta-500 bg-opacity-20 border border-terracotta-500 border-opacity-30 text-terracotta-200 text-sm mb-6"
            >
              <Shield className="h-4 w-4" />
              {safeT(
                "index.direction_features.management",
                "GESTION DE MATÉRIAUX"
              )}
            </motion.div>

            {/* Titre principal */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              <span className="block bg-gradient-to-br from-white to-gray-200 bg-clip-text text-transparent">
                {safeT(
                  "index.features.system",
                  "Système de suivi des projets et Gestion des Matériaux"
                )}
              </span>
              <span className="block bg-gradient-to-r from-terracotta-400 to-terracotta-300 bg-clip-text text-transparent">
                {safeT("index.features.management", "Management System")}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-gray-300 mb-8 max-w-3xl leading-relaxed"
            >
              {safeT(
                "index.direction_features.details",
                "Visualisez en temps réel les indicateurs de performance, planifiez les investissements d'infrastructure et optimisez la répartition des ressources énergétiques sur le territoire national."
              )}
            </motion.p>

            {/* Statistiques */}

            {/* Boutons CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start"
            >
              <Link to="/projects">
                <Button className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                  {safeT("index.features.discover", "Découvrir")}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link to="/auth?mode=register">
                <Button
                  variant="outline"
                  className="rounded-full px-8 py-6 text-lg border-2 border-white text-white hover:bg-white hover:text-adrar-900 transition-all duration-300 group"
                >
                  {safeT("index.features.register", "Créer un compte")}
                  <Play className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Section Droite - Élément visuel */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 flex justify-center items-center"
          >
            <div className="relative w-full max-w-md">
              {/* Carte principale */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl mx-auto"
              >
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <motion.div
                      key={item}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-terracotta-400/30 transition-all duration-300 text-center"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center mb-3 mx-auto">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                      <div className="h-2 bg-white/20 rounded-full mb-2"></div>
                      <div className="h-2 bg-white/10 rounded-full w-3/4 mx-auto"></div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Éléments flottants */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -top-4 -right-4 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-xl p-3 shadow-2xl"
              >
                <Building className="h-6 w-6 text-white" />
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 12, 0],
                  rotate: [0, -5, 0],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-br from-adrar-600 to-adrar-700 rounded-xl p-3 shadow-2xl"
              >
                <MapPin className="h-6 w-6 text-white" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
