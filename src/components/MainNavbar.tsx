
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { Globe, Database, Cog, ClipboardList, LogOut, Upload, Users, FileText } from 'lucide-react';
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
  const { user: authUser, signOut } = useAuth();
  const { user: keycloakUser, isAuthenticated, logout } = useKeycloakAuth();
  const { hasRole, hasAnyRole } = useCurrentUserRoles();

  // Check if user is authenticated (either through AuthContext or KeycloakAuthContext)
  const isUserAuthenticated = !!authUser || isAuthenticated;

  // Check if user can manage users (admin or director)
  const canManageUsers = hasAnyRole(['admin', 'director']);

  const handleLanguageChange = (newLanguage: Language) => {
    if (setLanguage) {
      setLanguage(newLanguage);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Try both logout methods
      if (authUser) {
        await signOut();
      }
      if (keycloakUser || isAuthenticated) {
        logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-adrar-700 text-white py-4 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link to="/" className="text-xl font-bold">
          Construction ERP
        </Link>
        
        {/* Show full navigation only for authenticated users */}
        {isUserAuthenticated && (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-white hover:text-gray-200">
                  {t('nav.projects') || 'Projets'}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/projects"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{t('projects.all') || 'Tous les projets'}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('projects.all_desc') || 'Gérer et visualiser tous les projets'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/projects/create"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{t('projects.new') || 'Nouveau projet'}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('projects.new_desc') || 'Créer un nouveau projet'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/projects/import"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none flex items-center">
                          <Upload className="h-4 w-4 mr-2" />
                          {t('project_import.title') || 'Import projets'}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('project_import.desc') || 'Importer les projets 2025'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
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
                    {t('documents.title') || 'Documents'}
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
                    {t('task.title') || 'Tâches'}
                  </Link>
                </Button>
              </NavigationMenuItem>

              {/* Users link - only for admin and director */}
              {canManageUsers && (
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200"
                    size="sm"
                    asChild
                  >
                    <Link to="/users">
                      <Users className="h-4 w-4 mr-2" />
                      {t('nav.users') || 'Utilisateurs'}
                    </Link>
                  </Button>
                </NavigationMenuItem>
              )}
              
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard">
                    {t('dashboard.title') || 'Dashboard'}
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
                    {t('settings.title') || 'Settings'}
                  </Link>
                </Button>
              </NavigationMenuItem>
              
              {/* New Tender Management link */}
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-gray-200"
                  size="sm"
                  asChild
                >
                  <Link to="/tender-management">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('nav.tender_management') || 'Appels d\'Offres'}
                  </Link>
                </Button>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-white hover:text-gray-200">
                  {t('nav.tender_management') || 'Gestion Appels d\'Offres'}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-6 w-[400px]">
                    <NavigationMenuLink asChild>
                      <Link
                        to="/tender-management"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{t('tender.management') || 'Gestion des Appels d\'Offres'}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('tender.management_desc') || 'Créer et gérer les appels d\'offres'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/projects"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{t('projects.all') || 'Projets'}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('projects.for_tender_desc') || 'Associer des projets aux appels d\'offres'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/documents"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">{t('tender.documents') || 'Documents d\'Appel d\'Offres'}</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('tender.documents_desc') || 'Gérer les documents des appels d\'offres'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/materials"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {t('suppliers.bidders') || 'Soumissionnaires'}
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {t('suppliers.bidders_desc') || 'Gérer les fournisseurs et soumissionnaires'}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
        
        <div className="flex items-center gap-4">
          {/* Language Switcher - Always visible */}
          <LanguageSwitcher />
          
          {/* Show different buttons based on authentication status */}
          {isUserAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary"
                size="sm"
                asChild
              >
                <Link to="/dashboard">
                  {t('dashboard.title') || 'Dashboard'}
                </Link>
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-white border-white hover:bg-white hover:text-adrar-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout') || 'Déconnexion'}
              </Button>
            </div>
          ) : (
            <Button 
              variant="secondary"
              size="sm"
              asChild
            >
              <Link to="/auth">
                {t('nav.login') || 'Se connecter'}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainNavbar;
