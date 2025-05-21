import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu as MenuIcon,
  X as CloseIcon,
  User as UserIcon,
  ChevronRight as ChevronRightIcon,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user: supabaseUser, signOut } = useAuth();
  const { isAuthenticated, user, login, logout } = useKeycloakAuth();
  
  const handleLanguageChange = (newLanguage: Language) => {
    if (setLanguage) {
      setLanguage(newLanguage);
    }
  };
  
  useEffect(() => {
    setIsOpen(false); // Close mobile menu on route change
  }, [location]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="bg-adrar-50 text-adrar-700 text-sm py-1.5 hidden md:block">
        <div className="container mx-auto text-center">
          Livraison gratuite pour toute commande supérieure à 2000 MRU
        </div>
      </div>
      
      <div className="container mx-auto flex justify-between items-center py-3 px-4">
        <div className="flex items-center">
          <Link to="/" className="font-bold text-xl text-adrar-700">
            Construction ERP
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-4">
          <Link to="/projects" className="text-sm text-adrar-600 hover:text-terracotta-500">
            Projets
          </Link>
          <Link to="/materials" className="text-sm text-adrar-600 hover:text-terracotta-500">
            Matériaux
          </Link>
          <Link to="/dashboard" className="text-sm text-adrar-600 hover:text-terracotta-500">
            Tableau de bord
          </Link>
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm text-adrar-600 hover:text-terracotta-500"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-xs">
                    {user.firstName && user.lastName 
                      ? `${user.firstName[0]}${user.lastName[0]}`
                      : user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>Profil</span>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-sm"
              >
                Se déconnecter
              </Button>
            </div>
          ) : (
            <Button
              onClick={login}
              size="sm"
              variant="default"
              className="text-sm bg-terracotta-500 hover:bg-terracotta-600"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          )}
        </nav>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-adrar-600 hover:text-adrar-800 focus:outline-none"
          aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>
      
      {isOpen && (
        <div className="md:hidden p-4 border-t border-gray-200">
          <Link
            to="/"
            className="block py-2 text-base text-adrar-600 hover:text-terracotta-500"
            onClick={() => setIsOpen(false)}
          >
            Accueil
          </Link>
          <Link
            to="/projects"
            className="block py-2 text-base text-adrar-600 hover:text-terracotta-500"
            onClick={() => setIsOpen(false)}
          >
            Projets
          </Link>
          <Link
            to="/materials"
            className="block py-2 text-base text-adrar-600 hover:text-terracotta-500"
            onClick={() => setIsOpen(false)}
          >
            Matériaux
          </Link>
          <Link
            to="/dashboard"
            className="block py-2 text-base text-adrar-600 hover:text-terracotta-500"
            onClick={() => setIsOpen(false)}
          >
            Tableau de bord
          </Link>
          
          {isAuthenticated && user ? (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/profile"
                className="flex items-center justify-between px-2 py-2 text-base text-adrar-600"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-xs">
                      {user.firstName && user.lastName 
                        ? `${user.firstName[0]}${user.lastName[0]}`
                        : user.username ? user.username.substring(0, 2).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  Mon profil
                </div>
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </div>
          ) : (
            <Button
              className="w-full mt-4 bg-terracotta-500 hover:bg-terracotta-600"
              onClick={() => {
                setIsOpen(false);
                login();
              }}
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Se connecter
            </Button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
