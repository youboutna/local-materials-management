
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Building, Shield, Users, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Hero from '@/components/Hero';
import MainNavbar from '@/components/MainNavbar';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';
import { useProjects } from '@/hooks/useProjects';
import { ProjectData } from '@/components/ProjectCard';

// Benefits section data
const benefits = [
  {
    icon: <Building className="h-10 w-10 text-terracotta-500" />,
    title: 'Valorisation du patrimoine',
    description: 'Préservez les techniques de construction traditionnelles tout en assurant leur durabilité et leur adaptation aux besoins modernes.'
  },
  {
    icon: <Shield className="h-10 w-10 text-terracotta-500" />,
    title: 'Suivi rigoureux',
    description: 'Suivez l\'avancement de vos projets avec des indicateurs précis, des rapports détaillés et une traçabilité complète.'
  },
  {
    icon: <Users className="h-10 w-10 text-terracotta-500" />,
    title: 'Collaboration efficace',
    description: 'Facilitez la communication entre tous les acteurs du projet : personnel, fournisseurs, maîtres d\'œuvre et maîtres d\'ouvrage.'
  },
  {
    icon: <Briefcase className="h-10 w-10 text-terracotta-500" />,
    title: 'Gestion budgétaire',
    description: 'Optimisez la gestion financière avec des outils de suivi budgétaire, de facturation et de reporting intégrés.'
  }
];

const Index = () => {
  // Refs for scroll animations
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const benefitsSectionRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);
  
  const [featuredProjects, setFeaturedProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const { projects } = useProjects();

  useEffect(() => {
    // Filter to get only 3 featured projects once projects data is loaded
    if (projects.length > 0) {
      const featured = projects.slice(0, 3);
      setFeaturedProjects(featured);
      setLoading(false);
    }
  }, [projects]);

  useEffect(() => {
    // Add image preload logic if needed
    const preloadImages = () => {
      const imagesToPreload = [
        '/img/stone-bg.jpg',
        '/img/project1.jpg',
        '/img/project2.jpg',
        '/img/project3.jpg',
        '/img/cta-bg.jpg',
      ];
      
      imagesToPreload.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };
    
    preloadImages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavbar />
      
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <section className="py-20 bg-ivory-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-serif font-bold text-adrar-800 mb-6"
            >
              Solutions innovantes pour matériaux traditionnels
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-adrar-600"
            >
              Notre plateforme combine technologies modernes et savoir-faire traditionnel pour une gestion optimale
              des projets de construction utilisant les matériaux locaux mauritaniens.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Feature Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-elegant p-6 border border-sandstone-100"
            >
              <div className="w-12 h-12 bg-terracotta-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-adrar-800 mb-3">Suivi de projets</h3>
              <p className="text-adrar-600 mb-4">Tableaux de bord intuitifs pour suivre l'avancement, les budgets et les échéances en temps réel.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Indicateurs de performance</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Suivi budgétaire détaillé</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Alertes et notifications</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-elegant p-6 border border-sandstone-100"
            >
              <div className="w-12 h-12 bg-terracotta-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-adrar-800 mb-3">Gestion des acteurs</h3>
              <p className="text-adrar-600 mb-4">Coordonnez efficacement tous les intervenants des projets de construction.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Profils détaillés</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Attribution des tâches</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Communication intégrée</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-elegant p-6 border border-sandstone-100"
            >
              <div className="w-12 h-12 bg-terracotta-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-terracotta-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-semibold text-adrar-800 mb-3">Documents et contrats</h3>
              <p className="text-adrar-600 mb-4">Gérez tous vos documents contractuels et techniques au même endroit.</p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Modèles personnalisables</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Signature électronique</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-terracotta-500 mr-2 flex-shrink-0" />
                  <span className="text-adrar-600 text-sm">Archivage sécurisé</span>
                </li>
              </ul>
            </motion.div>
          </div>
          
          <div className="text-center">
            <Link to="/features">
              <Button variant="outline" className="border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white">
                Découvrir toutes les fonctionnalités
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Projects Section */}
      <section 
        ref={featuredSectionRef}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-adrar-800 mb-4">
                Nos projets en matériaux locaux
              </h2>
              <p className="text-lg text-adrar-600">
                Découvrez nos réalisations utilisant la pierre d'Atar et l'argile mauritanienne,
                alliant tradition et innovation.
              </p>
            </div>
            <Link to="/projects" className="mt-4 md:mt-0">
              <Button className="bg-adrar-700 hover:bg-adrar-800 text-white">
                Voir tous les projets
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-16 h-16 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project, index) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Benefits Section */}
      <section 
        ref={benefitsSectionRef}
        className="py-20 bg-sandstone-50"
        style={{
          backgroundImage: `url('/img/subtle-pattern.png')`,
          backgroundSize: '400px',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-serif font-bold text-adrar-800 mb-6"
            >
              Pourquoi choisir notre solution
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-adrar-600"
            >
              Une plateforme conçue spécifiquement pour valoriser les matériaux locaux 
              tout en optimisant la gestion de vos projets de construction.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start"
              >
                <div className="bg-white p-4 rounded-lg shadow-elegant mr-5 flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-serif font-semibold text-adrar-800 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-adrar-600">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section 
        ref={ctaSectionRef}
        className="py-24 relative bg-adrar-900"
        style={{
          backgroundImage: `linear-gradient(rgba(45, 49, 66, 0.8), rgba(45, 49, 66, 0.8)), url('/img/cta-bg.jpg')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-serif font-bold text-white mb-6"
            >
              Prêt à valoriser le patrimoine mauritanien?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-xl text-ivory-200 mb-10"
            >
              Rejoignez notre plateforme et démarrez la gestion efficace de vos projets 
              de construction en matériaux locaux.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Link to="/auth?mode=register">
                <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white text-lg px-8 py-6">
                  Créer un compte
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-adrar-800 text-lg px-8 py-6">
                  Nous contacter
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
