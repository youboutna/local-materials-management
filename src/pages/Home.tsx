import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  FileText,
  Package,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const Home = () => {
  const { t } = useLanguage();

  const stats = [
    {
      title: "Projets en cours",
      value: "42",
      icon: Building,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "Régions couvertes",
      value: "15",
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: "Équipes actives",
      value: "28",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      title: "Croissance",
      value: "+24%",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  const features = [
    {
      icon: Building,
      title: "Gestion de Projets",
      description:
        "Suivez vos projets de construction de A à Z avec des outils de planification et de suivi avancés.",
      link: "/projects",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: MapPin,
      title: "Géolocalisation",
      description:
        "Visualisez tous vos projets et matériaux sur une carte interactive de la Mauritanie.",
      link: "/projects",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Users,
      title: "Gestion d'Équipe",
      description:
        "Coordonnez vos équipes, assignez des tâches et suivez les performances en temps réel.",
      link: "/tasks",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const quickActions = [
    {
      title: "Nouveau Projet",
      link: "/projects/create",
      icon: Plus,
      color: "bg-adrar-600 hover:bg-adrar-700",
    },
    {
      title: "Matériaux",
      link: "/materials",
      icon: Package,
      color: "border-terracotta-300 text-terracotta-700 hover:bg-terracotta-50",
    },
    {
      title: "Documents",
      link: "/documents",
      icon: FileText,
      color: "border-adrar-300 text-adrar-700 hover:bg-adrar-50",
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-adrar-50 via-white to-terracotta-50">
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-adrar-100 border border-adrar-200 text-adrar-700 text-sm font-medium mb-6">
              <Building className="h-4 w-4" />
              Plateforme BTP Mauritanie
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-adrar-900 mb-6 bg-gradient-to-br from-adrar-800 to-adrar-600 bg-clip-text text-transparent">
              Gestion de Projets BTP
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Plateforme complète de gestion des projets de construction,
              matériaux et équipes en Mauritanie
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/projects">
                  <Button className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white px-8 py-4 text-lg rounded-full shadow-lg">
                    Voir les Projets
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    className="border-2 border-adrar-300 text-adrar-700 hover:bg-adrar-50 px-8 py-4 text-lg rounded-full"
                  >
                    Tableau de Bord
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card
                  className={`hover:shadow-xl transition-all duration-300 border-2 ${stat.borderColor} ${stat.bgColor} group hover:scale-105`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Features Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
              >
                <Card className="text-center hover:shadow-xl transition-all duration-300 border border-gray-200 group">
                  <CardHeader>
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-adrar-800 group-hover:text-adrar-700 transition-colors">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <Link to={feature.link}>
                      <Button
                        variant="ghost"
                        className="text-terracotta-600 hover:text-terracotta-700 hover:bg-terracotta-50 rounded-full"
                      >
                        En savoir plus
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-serif font-bold text-adrar-800 mb-12 bg-gradient-to-br from-adrar-800 to-adrar-600 bg-clip-text text-transparent">
              Actions Rapides
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to={action.link}>
                    <Button
                      className={`${action.color} px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2`}
                    >
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
