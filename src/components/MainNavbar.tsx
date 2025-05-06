
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Settings, Database, Translate } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";

const MainNavbar: React.FC = () => {
  const location = useLocation();
  const { language, changeLanguage, t } = useLanguage();
  
  // Function to determine if a link is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed w-full bg-white shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="font-serif text-xl font-medium text-adrar-800">
              Adrar Construction
            </Link>
            <nav className="hidden md:flex ml-10 space-x-8">
              <Link 
                to="/dashboard" 
                className={`font-medium ${isActive('/dashboard') 
                  ? 'text-terracotta-600' 
                  : 'text-adrar-600 hover:text-adrar-900'}`}
              >
                {t('navigation.dashboard')}
              </Link>
              <Link 
                to="/projects" 
                className={`font-medium ${isActive('/projects') 
                  ? 'text-terracotta-600' 
                  : 'text-adrar-600 hover:text-adrar-900'}`}
              >
                {t('navigation.projects')}
              </Link>
              <Link 
                to="/materials" 
                className={`font-medium ${isActive('/materials') 
                  ? 'text-terracotta-600' 
                  : 'text-adrar-600 hover:text-adrar-900'}`}
              >
                {t('navigation.materials')}
              </Link>
              <Link 
                to="/users" 
                className={`font-medium ${isActive('/users') 
                  ? 'text-terracotta-600' 
                  : 'text-adrar-600 hover:text-adrar-900'}`}
              >
                {t('navigation.users')}
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center">
                  <Translate className="h-4 w-4 mr-1" />
                  <span className="capitalize">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                  Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Database Settings */}
            <Link to="/admin/database">
              <Button variant="ghost" size="sm">
                <Database className="h-4 w-4 mr-1" />
                {t('navigation.database')}
              </Button>
            </Link>
            
            {/* Settings */}
            <Link to="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                {t('navigation.settings')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
