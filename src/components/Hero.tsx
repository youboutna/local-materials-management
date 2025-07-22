import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollPosition = window.scrollY;
      // Parallax effect: background moves slower than scroll
      heroRef.current.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Safe translation with fallback
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

  // Detect if current language is RTL (Arabic)
  const isRTL = language === 'ar';

  return (
    <div
      ref={heroRef}
      className={`relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden bg-adrar-900 bg-opacity-10 ${
        isRTL ? 'text-right' : 'text-left'
      }`}
      style={{
        backgroundImage: `linear-gradient(rgba(45, 49, 66, 0.7), rgba(45, 49, 66, 0.3)), url('/img/stone-bg.jpg')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="inline-block px-3 py-1 rounded-full bg-terracotta-500 bg-opacity-90 text-white text-xs tracking-wider mb-6 animate-fade-in">
          {safeT("index.features.management", "GESTION DE MATÉRIAUX")}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-2 animate-slide-down">
          <span className="block">
            {safeT("index.features.system", "Mauritanian Materials Management System")}
          </span>
          <span className="block text-ivory-100 mt-4 font-normal">
            {safeT("index.features.message", "Valoriser le patrimoine")}
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg text-ivory-100 mb-10 animate-fade-in delay-200">
          {safeT(
            "index.features.details",
            "Suivez vos projets de construction utilisant la pierre et l'argile mauritanienne"
          )}
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in delay-300">
          <Link to="/projects">
            <Button className="rounded-md px-8 py-6 text-lg group flex items-center">
              {safeT("index.features.discover", "Découvrir nos projets")}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link to="/auth?mode=register">
            <Button variant="outline" className="rounded-md px-8 py-6 text-lg">
              {safeT("index.features.register", "Créer un compte")}
            </Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Decorative gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
    </div>
  );
};

export default Hero;
