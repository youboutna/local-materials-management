
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { DEV_MODE } from '@/config/constants';
import { Globe, Database, Cog, ClipboardList, LogOut, Upload, Users, FileText, Building2, Menu, Home, Briefcase, Package, Shield, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  // In dev mode, consider user as authenticated for navigation purposes
  const isUserAuthenticated = DEV_MODE || !!authUser || isAuthenticated;

  // Check if user can manage users (admin or director)
  const canManageUsers = DEV_MODE || hasAnyRole(['admin', 'director']);
  const isSupplier = hasAnyRole(['supplier']);
  const isSupplierOnly = isSupplier && !hasAnyRole(['admin','director','manager','agent']);
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
         HadraTech-GPI
          {DEV_MODE && (
            <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
              DEV
            </span>
          )}
        </Link>

        {/* Mobile Dropdown Menu */}
        {isUserAuthenticated && (
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-adrar-600"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-screen max-w-sm mr-4 mt-2 bg-white border shadow-xl"
                align="end"
                side="bottom"
              >
                <div className="py-2">
                  {isSupplierOnly ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/supplier-portal" className="flex items-center px-4 py-3 text-gray-900">
                          <Building2 className="h-5 w-5 mr-3" />
                          <span>{t('nav.supplier_portal') || 'Supplier Portal'}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/supplier-tender" className="flex items-center px-4 py-3 text-gray-900">
                          <Building2 className="h-5 w-5 mr-3" />
                          <span>{t('nav.supplier_tender_portal') || 'Portail Soumissions'}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/supplier-access" className="flex items-center px-4 py-3 text-gray-900 bg-primary/5">
                          <Shield className="h-5 w-5 mr-3 text-primary" />
                          <span>Accès Documents (Fournisseur)</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/evaluation-access" className="flex items-center px-4 py-3 text-gray-900 bg-amber-50">
                          <Lock className="h-5 w-5 mr-3 text-amber-600" />
                          <span>Accès Évaluation (Commission)</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-900">
                          <Home className="h-5 w-5 mr-3" />
                          <span>{t('dashboard.title') || 'Dashboard'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/projects" className="flex items-center px-4 py-3 text-gray-900">
                          <Briefcase className="h-5 w-5 mr-3" />
                          <span>{t('nav.projects') || 'Projets'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/materials" className="flex items-center px-4 py-3 text-gray-900">
                          <Package className="h-5 w-5 mr-3" />
                          <span>{t('nav.materials') || 'Matériaux'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/documents" className="flex items-center px-4 py-3 text-gray-900">
                          <FileText className="h-5 w-5 mr-3" />
                          <span>{t('documents.title') || 'Documents'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/tasks" className="flex items-center px-4 py-3 text-gray-900">
                          <ClipboardList className="h-5 w-5 mr-3" />
                          <span>{t('task.title') || 'Tâches'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/employees" className="flex items-center px-4 py-3 text-gray-900">
                          <Users className="h-5 w-5 mr-3" />
                          <span>{t('nav.employees') || 'Employés'}</span>
                        </Link>
                      </DropdownMenuItem>

                      {canManageUsers && (
                        <>
                          <DropdownMenuItem asChild>
                            <Link to="/users" className="flex items-center px-4 py-3 text-gray-900">
                              <Users className="h-5 w-5 mr-3" />
                              <span>{t('nav.users') || 'Utilisateurs'}</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem asChild>
                            <Link to="/settings" className="flex items-center px-4 py-3 text-gray-900">
                              <Cog className="h-5 w-5 mr-3" />
                              <span>{t('settings.title') || 'Settings'}</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      <DropdownMenuItem asChild>
                        <Link to="/suppliers" className="flex items-center px-4 py-3 text-gray-900">
                          <Building2 className="h-5 w-5 mr-3" />
                          <span>{t('nav.suppliers') || 'Fournisseurs'}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem asChild>
                        <Link to="/tender-management" className="flex items-center px-4 py-3 text-gray-900">
                          <FileText className="h-5 w-5 mr-3" />
                          <span>{t('nav.tender_management') || "Appels d'Offres"}</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <div className="px-4 py-2">
                    <LanguageSwitcher />
                  </div>
                  
                  {!DEV_MODE && (authUser || isAuthenticated) && (
                    <DropdownMenuItem onClick={handleDisconnect}>
                      <LogOut className="h-4 w-4 mr-3" />
                      {t('auth.logout') || 'Déconnexion'}
                    </DropdownMenuItem>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        
        {/* Show navigation only for authenticated users or in dev mode */}
        {isUserAuthenticated && (
          isSupplierOnly ? (
            <NavigationMenu className="hidden md:flex z-50">
              <NavigationMenuList className="gap-2">
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/supplier-portal">
                      {t('nav.supplier_portal') || 'Supplier Portal'}
                    </Link>
                  </Button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/supplier-tender">
                      {t('nav.supplier_tender_portal') || 'Portail Soumissions'}
                    </Link>
                  </Button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/supplier-access" className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Accès Sécurisé</span>
                    </Link>
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <NavigationMenu className="hidden md:flex z-50">
              <NavigationMenuList className="gap-2">
                 <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/dashboard">
                      {t('dashboard.title') || 'Dashboard'}
                    </Link>
                  </Button>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-white hover:text-gray-200 bg-transparent hover:bg-adrar-600">
                    {t('nav.projects') || 'Projets'}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="z-50 bg-white border shadow-lg">
                    <div className="grid gap-3 p-6 w-[400px] bg-white">
                      <NavigationMenuLink asChild>
                        <Link
                          to="/projects"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
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
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
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
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
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
                      <NavigationMenuLink asChild>
                        <Link
                          to="/insurance-management"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none">🛡️ Gestion Assurances</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Suivi des attestations et alertes d'expiration
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/bank-guarantee-monitor"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none">🏦 Garanties Bancaires</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Surveillance automatisée et déclenchement des garanties
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/inspection-monitoring"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none">🔍 Inspections</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Gestion digitale des inspections et rapports
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/notifications-center"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none">📬 Centre Notifications</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Centre de notifications basé sur les rôles
                          </p>
                        </Link>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/payment-control"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground text-gray-900"
                        >
                          <div className="text-sm font-medium leading-none">💰 Contrôle Paiements</div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Blocage automatique si garanties expirées
                          </p>
                        </Link>
                       </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
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
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
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
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/tasks">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      {t('task.title') || 'Tâches'}
                    </Link>
                  </Button>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/employees">
                      <Users className="h-4 w-4 mr-2" />
                      {t('nav.employees') || 'Employés'}
                    </Link>
                  </Button>
                </NavigationMenuItem>

                {/* Users link - only for admin and director or in dev mode */}
                {canManageUsers && (
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost" 
                      className="text-white hover:text-gray-200 hover:bg-adrar-600"
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
                
                {canManageUsers && (
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost" 
                      className="text-white hover:text-gray-200 hover:bg-adrar-600"
                      size="sm"
                      asChild
                    >
                      <Link to="/settings">
                        <Cog className="h-4 w-4 mr-2" />
                        {t('settings.title') || 'Settings'}
                      </Link>
                    </Button>
                  </NavigationMenuItem>
                )}
                
                {/* Supplier Management link */}
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/suppliers">
                      <Building2 className="h-4 w-4 mr-2" />
                      {t('nav.suppliers') || 'Fournisseurs'}
                    </Link>
                  </Button>
                </NavigationMenuItem>

                {/* Tender Management link */}
                <NavigationMenuItem>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-gray-200 hover:bg-adrar-600"
                    size="sm"
                    asChild
                  >
                    <Link to="/tender-management">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('nav.tender_management') || "Appels d'Offres"}
                    </Link>
                  </Button>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )
        )}

        
        <div className="flex items-center gap-4">
          {/* Language Switcher - Always visible */}
          <LanguageSwitcher />
          
          {/* Show different buttons based on authentication status and dev mode */}
          {isUserAuthenticated ? (
            <div className="flex items-center gap-2">
    
              {/* Only show logout if not in dev mode or actually authenticated */}
              {!DEV_MODE && (authUser || isAuthenticated) && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-white border-white hover:bg-white hover:text-adrar-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout') || 'Déconnexion'}
                </Button>
              )}
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
