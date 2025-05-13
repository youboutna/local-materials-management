
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Database, Cog } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const MainNavbar = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: Language) => {
    if (setLanguage) {
      setLanguage(newLanguage);
    }
  };

  return (
    <header className="bg-adrar-700 text-white py-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Construction ERP
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <Link to="/projects">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                >
                  {t('nav.projects') || 'Projets'}
                </Button>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/materials">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                >
                  {t('nav.materials') || 'Matériaux'}
                </Button>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/dashboard">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <LanguageSwitcher />
            </NavigationMenuItem>
            
            {/* Settings */}
            <NavigationMenuItem>
              <Link to="/settings">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                >
                  <Cog className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </NavigationMenuItem>
            
            {/* Database Settings */}
            <NavigationMenuItem>
              <Link to="/database-settings">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Base de données
                </Button>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Account or Login Button */}
        <Link to="/auth">
          <Button 
            variant="secondary"
            size="sm"
          >
            {t('nav.login') || 'Se connecter'}
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default MainNavbar;
