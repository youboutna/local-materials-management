/**
 * src/components/MergedNavbar.tsx
 *
 * ✅ Navbar principale (utilisée dans App.tsx)
 * - Lit le rôle via useAuth() (contexte hexagonal → AuthService → IUserRoleRepository)
 * - Settings visible dans : menu "More", dropdown utilisateur, menu mobile
 * - Accessibilité : aria-labels, aria-expanded, focus visible, rôles ARIA
 * - Responsive : menu mobile avec scroll vertical, sticky, backdrop blur
 * - Aucun appel Supabase direct (respect strict de l'architecture hexagonale)
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import { DEV_MODE } from "@/config/constants";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  FileText,
  Home,
  Briefcase,
  Package,
  Settings as SettingsIcon,
  Users as UsersIcon,
  ClipboardList,
  Upload,
  Building2,
  Shield,
  Lock,
  Cog,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { BrandBands, BrandIdentity } from "@/components/branding/BrandIdentity";
import { T } from '@/components/i18n/T';

const MergedNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ✅ Contexte hexagonal corrigé — role / roles sont chargés depuis public.user_roles
  const { user, isAuthenticated, logout, role, roles, hasAnyRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================================
  // RÔLES (source unique de vérité : le contexte hexagonal)
  // ==========================================================================

  const userRoles = useMemo<string[]>(() => {
    if (roles && roles.length > 0) return roles;
    if (role) return [role];
    if (!user) return [];
    if (Array.isArray((user as any).roles)) return (user as any).roles;
    const single =
      (user as any).role ||
      (user as any)?.user_metadata?.role ||
      (user as any)?.app_metadata?.role;
    return single ? [single] : [];
  }, [roles, role, user]);

  // ✅ canManageUsers : admin OU director
  const canManageUsers = useMemo(
    () => userRoles.some((r) => ['admin', 'director'].includes(r)),
    [userRoles],
  );

  const canAccessSettings = canManageUsers;

  const isSupplier = useMemo(
    () => userRoles.includes('supplier'),
    [userRoles],
  );

  const isSupplierOnly =
    isSupplier &&
    !userRoles.some((r) =>
      ['admin', 'director', 'manager', 'agent'].includes(r),
    );

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fermer le menu mobile à chaque changement de route
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, navigate]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getUserDisplayName = () => {
    if (user?.fullName) return user.fullName;
    if ((user as any)?.user_metadata?.full_name)
      return (user as any).user_metadata.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserAvatarUrl = () =>
    user?.avatarUrl || (user as any)?.user_metadata?.avatar_url || "";

  // ==========================================================================
  // NAVIGATION ITEMS
  // ==========================================================================

  const coreNavItems = useMemo(
    () => [
      { name: t("dashboard.title"), href: "/dashboard", icon: Home },
      { name: t("nav.projects"), href: "/projects", icon: Briefcase },
      { name: t("nav.materials"), href: "/materials", icon: Package },
    ],
    [t],
  );

  const additionalNavItems = useMemo(
    () => [
      { name: t("nav.home"), href: "/", icon: Home },
      { name: t("project_import.title"), href: "/projects/import", icon: Upload },
      { name: t("dqe.navigation.module"), href: "/dqe/list", icon: FileText },
      { name: t("documents.title"), href: "/documents", icon: FileText },
      { name: t("task.title") || "Tâches", href: "/tasks", icon: ClipboardList },
      { name: t("nav.employees"), href: "/employees", icon: UsersIcon },
      { name: t("nav.users"), href: "/users", icon: UsersIcon },
      { name: t("nav.consultant_portal"), href: "/consultant-portal", icon: UsersIcon },
      { name: t("nav.suppliers"), href: "/suppliers", icon: Building2 },
      { name: t("nav.supplier_portal"), href: "/supplier-portal", icon: Building2 },
      { name: t("nav.supplier_tender_portal"), href: "/supplier-tender", icon: Building2 },
      { name: t("nav.tender_management"), href: "/tender-management", icon: FileText },
    ],
    [t],
  );

  const supplierNavItems = useMemo(
    () => [
      { name: t("nav.supplier_portal"), href: "/supplier-portal", icon: Building2 },
      { name: t("nav.supplier_tender_portal"), href: "/supplier-tender", icon: Building2 },
      { name: "Accès Documents (Fournisseur)", href: "/supplier-access", icon: Shield },
      { name: "Accès Évaluation (Commission)", href: "/evaluation-access", icon: Lock },
    ],
    [t],
  );

  const projectDropdownItems = useMemo(
    () => [
      { name: t("projects.all"), href: "/projects", description: t("projects.all_desc") },
      { name: t("projects.new"), href: "/projects/create", description: t("projects.new_desc") },
      { name: t("project_import.title"), href: "/projects/import", description: t("project_import.desc"), icon: Upload },
      { name: "🛡️ Gestion Assurances", href: "/insurance-management", description: "Suivi des attestations et alertes d'expiration" },
      { name: "🏦 Garanties Bancaires", href: "/bank-guarantee-monitor", description: "Surveillance automatisée et déclenchement des garanties" },
      { name: "🔍 Inspections", href: "/inspection-monitoring", description: "Gestion digitale des inspections et rapports" },
      { name: "📬 Centre Notifications", href: "/notifications-center", description: "Centre de notifications basé sur les rôles" },
      { name: "💰 Contrôle Paiements", href: "/payment-control", description: "Blocage automatique si garanties expirées" },
    ],
    [t],
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg border-b" : "bg-white border-b"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "tween" }}
      style={{ transform: "translateZ(0)" }}
      aria-label="Navigation principale"
    >
      <div className="container mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex flex-wrap items-center justify-between min-h-16 gap-2 lg:gap-4">
          {/* BRAND */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 min-w-0 max-w-[55%] lg:max-w-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 rounded-md"
            aria-label={t("app.name") || "Accueil HadraTech-GPI"}
          >
            <BrandIdentity
              size="lg"
              sealBadge
              withBands
              emphasis
              className="min-w-0 truncate max-w-[160px] sm:max-w-[240px] lg:max-w-[300px]"
              fallback={
                <span className="flex items-center gap-2.5">
                  <BrandBands orientation="vertical" className="h-8" />
                  <span className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary">
                    <span className="text-primary-foreground font-bold text-lg">A</span>
                  </span>
                </span>
              }
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          {isAuthenticated && !isSupplierOnly && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl min-w-0">
              <NavigationMenu className="flex-1 justify-center">
                <NavigationMenuList className="gap-1">
                  {/* Dashboard */}
                  <NavigationMenuItem>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium ${
                        location.pathname === "/dashboard"
                          ? "text-terracotta-600 bg-terracotta-50"
                          : "text-foreground hover:text-terracotta-600"
                      }`}
                      size="sm"
                      asChild
                    >
                      <Link to="/dashboard">
                        <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                        {t("dashboard.title")}
                      </Link>
                    </Button>
                  </NavigationMenuItem>

                  {/* Projets */}
                  <NavigationMenuItem>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-sm font-medium text-foreground hover:text-terracotta-600 data-[state=open]:text-terracotta-600 data-[state=open]:bg-terracotta-50"
                          aria-label={t("nav.projects")}
                        >
                          <Briefcase className="h-4 w-4 mr-2" aria-hidden="true" />
                          {t("nav.projects")}
                          <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-80 min-w-[320px] bg-white border shadow-xl rounded-lg z-[100]"
                        sideOffset={8}
                        collisionPadding={16}
                      >
                        <div className="p-2 w-full">
                          {projectDropdownItems.map((item) => (
                            <DropdownMenuItem key={item.name} asChild>
                              <Link
                                to={item.href}
                                className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted transition-colors group w-full focus-visible:bg-muted"
                              >
                                {item.icon && (
                                  <item.icon className="h-4 w-4 mt-0.5 text-muted-foreground group-hover:text-terracotta-600 flex-shrink-0" aria-hidden="true" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground group-hover:text-terracotta-600 whitespace-nowrap">
                                    {item.name}
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </NavigationMenuItem>

                  {/* Matériaux */}
                  <NavigationMenuItem>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium ${
                        location.pathname === "/materials"
                          ? "text-terracotta-600 bg-terracotta-50"
                          : "text-foreground hover:text-terracotta-600"
                      }`}
                      size="sm"
                      asChild
                    >
                      <Link to="/materials">
                        <Package className="h-4 w-4 mr-2" aria-hidden="true" />
                        {t("nav.materials")}
                      </Link>
                    </Button>
                  </NavigationMenuItem>

                  {/* More */}
                  <NavigationMenuItem>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm font-medium text-foreground hover:text-terracotta-600"
                          aria-label="Plus d'options de navigation"
                        >
                          <MoreHorizontal className="h-4 w-4 mr-2" aria-hidden="true" />
                          <T k="auto.mergednavbar.more" fallback="More" />
                          <ChevronDown className="h-4 w-4 ml-1" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-64 bg-white border shadow-xl rounded-lg z-[100]"
                        align="center"
                        sideOffset={8}
                        collisionPadding={16}
                      >
                        {/* Settings en tête pour admin/director */}
                        {canAccessSettings && (
                          <>
                            <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
                              Administration
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link
                                to="/settings"
                                className="flex items-center space-x-3 cursor-pointer py-2.5 focus-visible:bg-muted"
                              >
                                <Cog className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <span className="text-sm font-medium">
                                  {t("settings.title") || "Paramètres"}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}

                        {additionalNavItems
                          .filter((item) => {
                            if (item.href === "/users" && !canManageUsers) return false;
                            return true;
                          })
                          .map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <DropdownMenuItem key={item.name} asChild>
                                <Link
                                  to={item.href}
                                  className="flex items-center space-x-3 cursor-pointer py-2.5 focus-visible:bg-muted"
                                >
                                  <IconComponent className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                  <span className="text-sm font-medium">{item.name}</span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* SUPPLIER NAVIGATION */}
          {isAuthenticated && isSupplierOnly && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
              <NavigationMenu className="flex-1 justify-center">
                <NavigationMenuList className="gap-2">
                  {supplierNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <NavigationMenuItem key={item.name}>
                        <Button
                          variant="ghost"
                          className="text-sm font-medium text-foreground hover:text-terracotta-600"
                          size="sm"
                          asChild
                        >
                          <Link to={item.href}>
                            <IconComponent className="h-4 w-4 mr-2" aria-hidden="true" />
                            {item.name}
                          </Link>
                        </Button>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* RIGHT SIDE ACTIONS */}
          <div className="order-last ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher />

            {isAuthenticated && <NotificationDropdown />}

            {/* USER MENU / AUTH BUTTONS */}
            {isAuthenticated ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    aria-label={`Menu utilisateur : ${getUserDisplayName()}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatarUrl()} alt="" />
                      <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-sm">
                        {getInitials(getUserDisplayName())}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 z-[100]"
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <DropdownMenuLabel className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {userRoles.length > 0 && (
                      <p className="text-xs leading-none text-terracotta-600 mt-1">
                        Rôle : <span className="font-semibold">{userRoles.join(", ")}</span>
                      </p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer focus-visible:bg-muted">
                      <User className="mr-2 h-4 w-4" aria-hidden="true" />
                      <span>{t("nav.profile")}</span>
                    </Link>
                  </DropdownMenuItem>

                  {/* Settings dans le dropdown utilisateur */}
                  {canAccessSettings && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer focus-visible:bg-muted">
                        <SettingsIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>{t("settings.title") || "Paramètres"}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:text-destructive focus-visible:bg-muted"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>{t("auth.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <div className="hidden sm:flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/auth?mode=login">{t("auth.login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/auth?mode=register">{t("auth.register")}</Link>
                  </Button>
                </div>

                <div className="sm:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={t("auth.login")}>
                        <User className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 z-[100]">
                      <DropdownMenuItem asChild>
                        <Link to="/auth?mode=login" className="cursor-pointer">
                          {t("auth.login")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/auth?mode=register" className="cursor-pointer">
                          {t("auth.register")}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}

            {/* MOBILE MENU BUTTON */}
            <div className="lg:hidden">
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? (
                      <X className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Menu className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-screen max-w-sm mr-4 mt-2 bg-white/95 backdrop-blur-md border shadow-xl rounded-lg z-[100]"
                  align="end"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="py-2 max-h-[80vh] overflow-y-auto">
                    {/* Settings en tête sur mobile */}
                    {canAccessSettings && !isSupplierOnly && (
                      <>
                        <DropdownMenuLabel className="text-xs uppercase text-muted-foreground px-4">
                          Administration
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/settings"
                            className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-foreground hover:text-terracotta-600 hover:bg-muted w-full"
                            onClick={() => setIsOpen(false)}
                          >
                            <Cog className="h-4 w-4" aria-hidden="true" />
                            <span>{t("settings.title") || "Paramètres"}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    {(isSupplierOnly
                      ? supplierNavItems
                      : [...coreNavItems, ...additionalNavItems]
                    )
                      .filter((item) => {
                        if (item.href === "/users" && !canManageUsers) return false;
                        return true;
                      })
                      .map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link
                              to={item.href}
                              className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-foreground hover:text-terracotta-600 hover:bg-muted w-full"
                              onClick={() => setIsOpen(false)}
                            >
                              <IconComponent className="h-4 w-4" aria-hidden="true" />
                              <span>{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}

                    <DropdownMenuSeparator />

                    <div className="px-4 py-3 space-y-3">
                      {isAuthenticated ? (
                        <>
                          <div className="flex items-center space-x-3 p-2 rounded-md bg-muted">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={getUserAvatarUrl()} alt="" />
                              <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-xs">
                                {getInitials(getUserDisplayName())}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {getUserDisplayName()}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" asChild className="flex-1">
                              <Link to="/profile" onClick={() => setIsOpen(false)}>
                                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                                <T k="auto.mergednavbar.profile" fallback="Profile" />
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsOpen(false);
                                handleLogout();
                              }}
                              className="flex-1"
                            >
                              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                              <T k="auto.mergednavbar.logout" fallback="Logout" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <Link to="/auth?mode=login" onClick={() => setIsOpen(false)}>
                              {t("auth.login")}
                            </Link>
                          </Button>
                          <Button size="sm" asChild className="flex-1">
                            <Link to="/auth?mode=register" onClick={() => setIsOpen(false)}>
                              {t("auth.register")}
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default MergedNavbar;