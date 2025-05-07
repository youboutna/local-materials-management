
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';
import { Globe, Database } from 'lucide-react';

const MainNavbar = () => {
  const { language, setLanguage } = useContext(LanguageContext);

  const handleLanguageChange = (newLanguage: 'fr' | 'en' | 'ar') => {
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
        
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="relative group">
            <Button 
              variant="ghost" 
              className="text-white hover:text-gray-200"
              size="sm"
            >
              <Globe className="h-4 w-4 mr-2" />
              {language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'العربية'}
            </Button>
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg overflow-hidden z-20 hidden group-hover:block">
              <div className="py-1">
                <button 
                  onClick={() => handleLanguageChange('fr')} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Français
                </button>
                <button 
                  onClick={() => handleLanguageChange('en')} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  English
                </button>
                <button 
                  onClick={() => handleLanguageChange('ar')} 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  العربية
                </button>
              </div>
            </div>
          </div>
          
          {/* Database Settings */}
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
          
          {/* Account or Login Button */}
          <Link to="/auth">
            <Button 
              variant="secondary"
              size="sm"
            >
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
