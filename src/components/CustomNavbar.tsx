
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const CustomNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/img/logo.png" alt="Logo" className="h-10 w-auto" />
            <div className="ml-3">
              <h1 className="text-xl font-serif font-bold text-adrar-800">
                {t('app.name')}
              </h1>
              <p className="text-xs text-adrar-600">{t('app.description')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-adrar-700 hover:text-adrar-900">
              {t('nav.home')}
            </Link>
            <Link to="/projects" className="text-adrar-700 hover:text-adrar-900">
              {t('nav.projects')}
            </Link>
            <Link to="/materials" className="text-adrar-700 hover:text-adrar-900">
              {t('nav.materials')}
            </Link>
            <Link to="/users" className="text-adrar-700 hover:text-adrar-900">
              {t('nav.users')}
            </Link>
            
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Login/Profile Button */}
            <Button asChild className="bg-terracotta-500 hover:bg-terracotta-600">
              <Link to={user ? "/profile" : "/auth"}>
                <LogIn className="mr-2 h-4 w-4" />
                {user ? t('nav.profile') : t('nav.login')}
              </Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-adrar-800" />
            ) : (
              <Menu className="h-6 w-6 text-adrar-800" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-adrar-700 hover:text-adrar-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/projects"
                className="text-adrar-700 hover:text-adrar-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.projects')}
              </Link>
              <Link
                to="/materials"
                className="text-adrar-700 hover:text-adrar-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.materials')}
              </Link>
              <Link
                to="/users"
                className="text-adrar-700 hover:text-adrar-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('nav.users')}
              </Link>
              
              <div className="py-2">
                <LanguageSwitcher />
              </div>
              
              <Button asChild className="w-full bg-terracotta-500 hover:bg-terracotta-600">
                <Link to={user ? "/profile" : "/auth"} onClick={() => setIsMenuOpen(false)}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {user ? t('nav.profile') : t('nav.login')}
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default CustomNavbar;
