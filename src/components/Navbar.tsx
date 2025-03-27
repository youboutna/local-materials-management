
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navbarClasses = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    {
      'py-6 bg-transparent': !isScrolled && !isMobileMenuOpen,
      'py-3 bg-white/90 backdrop-blur-md shadow-elegant': isScrolled || isMobileMenuOpen,
    }
  );

  const navLinks = [
    { title: 'Accueil', path: '/' },
    { title: 'Projets', path: '/projects' },
    { title: 'Tableau de bord', path: '/dashboard' },
    { title: 'Matériaux', path: '/materials' },
  ];

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-serif font-semibold text-adrar-700"
          >
            <span className="text-terracotta-500">Materials</span>
            <span className="text-adrar-800">Management</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-terracotta-500",
                  location.pathname === link.path
                    ? "text-terracotta-500"
                    : "text-adrar-600"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/auth?mode=login">
              <Button variant="outline" className="border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white">
                Connexion
              </Button>
            </Link>
            <Link to="/auth?mode=register">
              <Button className="bg-terracotta-500 text-white hover:bg-terracotta-600">
                Inscription
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center text-adrar-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 px-2 bg-white/95 backdrop-blur-md animate-slide-down rounded-b-lg">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "py-2 px-4 text-sm font-medium rounded-md",
                    location.pathname === link.path
                      ? "bg-sandstone-100 text-terracotta-500"
                      : "text-adrar-600 hover:bg-sandstone-50"
                  )}
                >
                  {link.title}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-2 border-t border-sandstone-100">
                <Link to="/auth?mode=login" className="w-full">
                  <Button variant="outline" className="w-full border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth?mode=register" className="w-full">
                  <Button className="w-full bg-terracotta-500 text-white hover:bg-terracotta-600">
                    Inscription
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
