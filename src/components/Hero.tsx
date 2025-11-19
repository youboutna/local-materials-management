import { useEffect, useRef } from "react";
import { ArrowRight, Play, Star, Shield, Building, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollPosition = window.scrollY;
      heroRef.current.style.transform = `translateY(${scrollPosition * 0.5}px)`;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { number: "50+", label: "Projets Actifs" },
    { number: "15", label: "Régions" },
    { number: "99%", label: "Satisfaction" },
  ];

  return (
    <div className="py-20 relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-adrar-900">
      {/* Animated Background */}
      <div
        ref={heroRef}
        className="absolute inset-0 bg-gradient-to-br from-adrar-900 via-adrar-800 to-terracotta-900"
        style={{
          backgroundImage: `linear-gradient(rgba(45, 49, 66, 0.85), rgba(45, 49, 66, 0.9)), url('/img/stone-bg.jpg')`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          willChange: "transform",
        }}
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-terracotta-500 rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-adrar-600 rounded-full blur-3xl opacity-20"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div
            className={`flex flex-col lg:flex-row items-center gap-12 ${
              isRTL ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-terracotta-500 bg-opacity-20 backdrop-blur-sm border border-terracotta-500 border-opacity-30 text-terracotta-200 text-sm tracking-wider mb-6"
              >
                <Shield className="h-4 w-4" />
                {safeT("index.features.management", "GESTION DE MATÉRIAUX")}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 leading-tight"
              >
                <span className="block bg-gradient-to-br from-white to-ivory-200 bg-clip-text text-transparent">
                  {safeT("index.features.system", "Mauritanian Materials")}
                </span>
                <span className="block bg-gradient-to-r from-terracotta-400 to-terracotta-300 bg-clip-text text-transparent">
                  Management System
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-ivory-100 mb-8 max-w-2xl leading-relaxed"
              >
                {safeT(
                  "index.features.details",
                  "Suivez vos projets de construction utilisant la pierre et l'argile mauritanienne. Solution complète pour la gestion BTP."
                )}
              </motion.p>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-8 mb-8"
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-white mb-1">
                      {stat.number}
                    </div>
                    <div className="text-ivory-200 text-sm">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col sm:flex-row gap-4 items-center"
              >
                <Link to="/projects">
                  <Button className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group">
                    {safeT("index.features.discover", "Découvrir nos projets")}
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

            {/* Visual Element */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 flex justify-center"
            >
              <div className="relative">
                {/* Main Card */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((item) => (
                      <motion.div
                        key={item}
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-terracotta-400/30 transition-all duration-300"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center mb-2">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <div className="h-2 bg-white/20 rounded-full mb-1"></div>
                        <div className="h-2 bg-white/10 rounded-full w-3/4"></div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Floating Elements */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    rotate: [0, 5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                  className="absolute -top-4 -right-4 bg-gradient-to-br from-terracotta-500 to-terracotta-600 rounded-xl p-4 shadow-2xl"
                >
                  <Building className="h-6 w-6 text-white" />
                </motion.div>

                <motion.div
                  animate={{
                    y: [0, 15, 0],
                    rotate: [0, -5, 0],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }}
                  className="absolute -bottom-4 -left-4 bg-gradient-to-br from-adrar-600 to-adrar-700 rounded-xl p-4 shadow-2xl"
                >
                  <MapPin className="h-6 w-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/60 text-sm">Scroll</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <motion.div
              animate={{
                y: [0, 12, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-1 h-3 bg-white/60 rounded-full mt-2"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
