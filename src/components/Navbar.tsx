/**
 * src/components/Navbar.tsx
 *
 * ✅ Navbar alternative (non utilisée dans App.tsx, conservée par cohérence)
 * - Lit le rôle via useAuth() (contexte hexagonal → AuthService → IUserRoleRepository)
 * - Settings visible pour admin/director (dropdown utilisateur + nav desktop + mobile)
 * - Accessibilité : aria-labels, aria-expanded, focus visible
 * - Responsive : menu mobile avec scroll vertical
 * - Aucun appel Supabase direct
 */
import { ENABLE_LOGOUT } from '@/config/constants';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import {
  Briefcase,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Menu,
  Package,
  Settings as SettingsIcon,
  Upload,
  User,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, signOut, role, roles, hasAnyRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================================================
  // EFFETS
  // ==========================================================================

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // ==========================================================================
  // RÔLES
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

  const isAdminOrDirector = useMemo(() => {
    if (typeof hasAnyRole === 'function' && hasAnyRole(['admin', 'director'])) {
      return true;
    }
    return userRoles.some((r) => ['admin', 'director'].includes(r));
  }, [hasAnyRole, userRoles]);

  // ==========================================================================
  // NAVIGATION ITEMS
  // ==========================================================================

  const navItems = useMemo(() => {
    const items = [
      { name: t("nav.home"), href: "/", icon: Home },
      { name: t("dashboard.title"), href: "/dashboard", icon: Home },
      { name: t("nav.projects"), href: "/projects", icon: Briefcase },
      { name: t("project_import.title"), href: "/projects/import", icon: Upload },
      { name: t("nav.materials"), href: "/materials", icon: Package },
      { name: t("documents.title"), href: "/documents", icon: FileText },
      { name: t("task.title") || "Tâches", href: "/tasks", icon: ClipboardList },
      { name: t("nav.users"), href: "/users", icon: UsersIcon },
    ];
    if (user && isAdminOrDirector) {
      items.push({
        name: t("settings.title") || "Paramètres",
        href: "/settings",
        icon: SettingsIcon,
      });
    }
    return items;
  }, [t, user, isAdminOrDirector]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [signOut, navigate]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getUserDisplayName = () => {
    if ((user as any)?.user_metadata?.full_name)
      return (user as any).user_metadata.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserAvatarUrl = () =>
    (user as any)?.user_metadata?.avatar_url || "";

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, type: "tween" }}
      style={{ transform: "translateZ(0)" }}
      aria-label="Navigation principale"
    >
      <div className="container-responsive">
        <div className="flex items-center justify-between min-h-14 sm:min-h-16 gap-2 sm:gap-4">
          {/* BRAND */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 rounded-md"
            aria-label={t("app.name") || "Accueil"}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-adrar-900 font-serif hidden sm:block">
              {t('app.name') || 'HadraTech-GPI'}
            </span>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 min-w-0 flex-wrap">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-mobile-sm lg:text-sm text-foreground hover:text-terracotta-600 transition-colors duration-200 font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* RIGHT ACTIONS (desktop) */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <LanguageSwitcher />
            {user && <NotificationDropdown />}

            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full focus-visible:ring-2 focus-visible:ring-terracotta-500"
                    aria-label={`Menu utilisateur : ${getUserDisplayName()}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatarUrl()} alt="" />
                      <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
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
                  forceMount
                >
                  <DropdownMenuLabel className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
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

                  {/* Settings visible admin/director */}
                  {isAdminOrDirector && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer focus-visible:bg-muted">
                        <SettingsIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>{t("settings.title") || "Paramètres"}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  {ENABLE_LOGOUT && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer focus-visible:bg-muted"
                      >
                        <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>{t("auth.logout")}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth?mode=login">{t("auth.login")}</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=register">{t("auth.register")}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* MOBILE MENU */}
          <div className="md:hidden">
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
                    <X className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-screen max-w-sm mr-4 mt-2 bg-white/95 backdrop-blur-md border shadow-xl z-[100]"
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={16}
              >
                <div className="py-2 max-h-[80vh] overflow-y-auto">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-foreground hover:text-terracotta-600 hover:bg-muted w-full"
                          onClick={() => setIsOpen(false)}
                        >
                          <IconComponent className="h-5 w-5" aria-hidden="true" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />

                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <LanguageSwitcher />
                      {user && <NotificationDropdown />}
                    </div>

                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-2 rounded-md bg-muted">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getUserAvatarUrl()} alt="" />
                            <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
                              {getInitials(getUserDisplayName())}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <Link to="/profile" onClick={() => setIsOpen(false)}>
                              <User className="h-4 w-4 mr-2" aria-hidden="true" />
                              {t('nav.profile')}
                            </Link>
                          </Button>
                          {ENABLE_LOGOUT && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleLogout}
                              className="flex-1"
                            >
                              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                              {t('auth.logout')}
                            </Button>
                          )}
                        </div>
                      </div>
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
    </motion.nav>
  );
};

export default Navbar;