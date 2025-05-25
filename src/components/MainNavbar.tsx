
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { Globe, Database, Cog, ClipboardList } from 'lucide-react';
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
    <header className="bg-adrar-700 text-white py-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-xl font-bold">
          Construction ERP
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/projects">
                  {t('nav.projects') || 'Projets'}
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/materials">
                  {t('nav.materials') || 'Matériaux'}
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/documents">
                  Documents
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/tasks">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Tâches
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/dashboard">
                  Dashboard
                </Link>
              </Button>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Button 
                variant="ghost" 
                className="text-white hover:text-gray-200"
                size="sm"
                asChild
              >
                <Link to="/settings">
                  <Cog className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="flex items-center gap-4">
          {/* Language Switcher - Now prominently placed */}
          <LanguageSwitcher />
          
          {/* Account or Login Button */}
          <Button 
            variant="secondary"
            size="sm"
            asChild
          >
            <Link to="/auth">
              {t('nav.login') || 'Se connecter'}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
