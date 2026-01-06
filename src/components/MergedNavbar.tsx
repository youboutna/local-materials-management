import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useKeycloakAuth } from "@/contexts/KeycloakAuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrentUserRoles } from "@/hooks/useUserRoles";
import { DEV_MODE } from "@/config/constants";
import { motion, AnimatePresence } from "framer-motion";
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
  Database,
  Globe,
  ChevronDown,
  MoreHorizontal,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const MergedNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user: authUser, signOut } = useAuth();
  const { user: keycloakUser, isAuthenticated, logout } = useKeycloakAuth();
  const { hasRole, hasAnyRole } = useCurrentUserRoles();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication
  const isUserAuthenticated = DEV_MODE || !!authUser || isAuthenticated;
  const canManageUsers = DEV_MODE || hasAnyRole(["admin", "director"]);
  const isSupplier = hasAnyRole(["supplier"]);
  const isSupplierOnly =
    isSupplier && !hasAnyRole(["admin", "director", "manager", "agent"]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      if (authUser) await signOut();
      if (keycloakUser || isAuthenticated) logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    const user = authUser || keycloakUser;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserAvatarUrl = () => {
    const user = authUser || keycloakUser;
    return user?.user_metadata?.avatar_url || "";
  };

  // Core navigation items (always visible)
  const coreNavItems = [
    { name: t("dashboard.title"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("nav.projects"), href: "/projects", icon: Briefcase },
    { name: t("nav.materials"), href: "/materials", icon: Package },
  ];

  // Additional navigation items (in dropdown)
  const additionalNavItems = [
    { name: t("nav.home"), href: "/", icon: Home },
    { name: t("project_import.title"), href: "/projects/import", icon: Upload },
    { name: t("documents.title"), href: "/documents", icon: FileText },
    { name: t("task.title") || "Tâches", href: "/tasks", icon: ClipboardList },
    { name: t("nav.employees"), href: "/employees", icon: UsersIcon },
    { name: t("nav.users"), href: "/users", icon: UsersIcon },
    { name: t("nav.suppliers"), href: "/suppliers", icon: Building2 },
    {
      name: t("nav.tender_management"),
      href: "/tender-management",
      icon: FileText,
    },
  ];

  // Supplier specific items
  const supplierNavItems = [
    {
      name: t("nav.supplier_portal"),
      href: "/supplier-portal",
      icon: Building2,
    },
    {
      name: t("nav.supplier_tender_portal"),
      href: "/supplier-tender",
      icon: Building2,
    },
    {
      name: "Accès Documents (Fournisseur)",
      href: "/supplier-access",
      icon: Shield,
    },
    {
      name: "Accès Évaluation (Commission)",
      href: "/evaluation-access",
      icon: Lock,
    },
  ];

  // Project dropdown items
  const projectDropdownItems = [
    {
      name: t("projects.all"),
      href: "/projects",
      description: t("projects.all_desc"),
    },
    {
      name: t("projects.new"),
      href: "/projects/create",
      description: t("projects.new_desc"),
    },
    {
      name: t("project_import.title"),
      href: "/projects/import",
      description: t("project_import.desc"),
      icon: Upload,
    },
    {
      name: "🛡️ Gestion Assurances",
      href: "/insurance-management",
      description: "Suivi des attestations et alertes d'expiration",
    },
    {
      name: "🏦 Garanties Bancaires",
      href: "/bank-guarantee-monitor",
      description: "Surveillance automatisée et déclenchement des garanties",
    },
    {
      name: "🔍 Inspections",
      href: "/inspection-monitoring",
      description: "Gestion digitale des inspections et rapports",
    },
    {
      name: "📬 Centre Notifications",
      href: "/notifications-center",
      description: "Centre de notifications basé sur les rôles",
    },
    {
      name: "💰 Contrôle Paiements",
      href: "/payment-control",
      description: "Blocage automatique si garanties expirées",
    },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b"
          : "bg-white border-b"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-adrar-900 font-serif leading-tight">
                HadraTech-GPI
              </span>
              {DEV_MODE && (
                <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded self-start">
                  DEV MODE
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Navigation - Core Items */}
          {isUserAuthenticated && !isSupplierOnly && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
              <NavigationMenu className="flex-1 justify-center">
                <NavigationMenuList className="gap-1">
                  {/* Dashboard */}
                  <NavigationMenuItem>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium ${
                        location.pathname === "/dashboard"
                          ? "text-terracotta-600 bg-terracotta-50"
                          : "text-gray-700 hover:text-terracotta-600"
                      }`}
                      size="sm"
                      asChild
                    >
                      <Link to="/dashboard">
                        <Home className="h-4 w-4 mr-2" />
                        {t("dashboard.title")}
                      </Link>
                    </Button>
                  </NavigationMenuItem>

                  {/* Projects Dropdown */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-sm font-medium text-gray-700 data-[state=open]:text-terracotta-600 data-[state=open]:bg-terracotta-50">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {t("nav.projects")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-80 min-w-[320px]">
                      <div className="p-2 w-full">
                        {projectDropdownItems.map((item) => (
                          <NavigationMenuLink key={item.name} asChild>
                            <Link
                              to={item.href}
                              className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50 transition-colors group w-full"
                            >
                              {item.icon && (
                                <item.icon className="h-4 w-4 mt-0.5 text-gray-500 group-hover:text-terracotta-600 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 group-hover:text-terracotta-600 whitespace-nowrap">
                                  {item.name}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Materials */}
                  <NavigationMenuItem>
                    <Button
                      variant="ghost"
                      className={`text-sm font-medium ${
                        location.pathname === "/materials"
                          ? "text-terracotta-600 bg-terracotta-50"
                          : "text-gray-700 hover:text-terracotta-600"
                      }`}
                      size="sm"
                      asChild
                    >
                      <Link to="/materials">
                        <Package className="h-4 w-4 mr-2" />
                        {t("nav.materials")}
                      </Link>
                    </Button>
                  </NavigationMenuItem>

                  {/* More Dropdown */}
                  <NavigationMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm font-medium text-gray-700 hover:text-terracotta-600"
                        >
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          More
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-64 bg-white border shadow-xl rounded-lg"
                        align="center"
                      >
                        {additionalNavItems
                          .filter((item) => {
                            if (item.href === "/users" && !canManageUsers)
                              return false;
                            return true;
                          })
                          .map((item) => {
                            const IconComponent = item.icon;
                            return (
                              <DropdownMenuItem key={item.name} asChild>
                                <Link
                                  to={item.href}
                                  className="flex items-center space-x-3 cursor-pointer py-2.5"
                                >
                                  <IconComponent className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">
                                    {item.name}
                                  </span>
                                </Link>
                              </DropdownMenuItem>
                            );
                          })}

                        {canManageUsers && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link
                                to="/settings"
                                className="flex items-center space-x-3 cursor-pointer py-2.5"
                              >
                                <Cog className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">
                                  {t("settings.title")}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          {/* Supplier Navigation */}
          {isUserAuthenticated && isSupplierOnly && (
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
              <NavigationMenu className="flex-1 justify-center">
                <NavigationMenuList className="gap-2">
                  {supplierNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <NavigationMenuItem key={item.name}>
                        <Button
                          variant="ghost"
                          className="text-sm font-medium text-gray-700 hover:text-terracotta-600"
                          size="sm"
                          asChild
                        >
                          <Link to={item.href}>
                            <IconComponent className="h-4 w-4 mr-2" />
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

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notifications */}
            {isUserAuthenticated && <NotificationDropdown />}

            {/* User Menu / Auth Buttons */}
            {isUserAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full border"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={getUserDisplayName()}
                      />
                      <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-sm">
                        {getInitials(getUserDisplayName())}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {(authUser || keycloakUser)?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("nav.profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  {canManageUsers && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>{t("settings.title")}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {!DEV_MODE && (
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("auth.logout")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth?mode=login">{t("auth.login")}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/auth?mode=register">{t("auth.register")}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    {isOpen ? (
                      <X className="h-5 w-5" />
                    ) : (
                      <Menu className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-screen max-w-sm mr-4 mt-2 bg-white/95 backdrop-blur-md border shadow-xl rounded-lg"
                  align="end"
                >
                  <div className="py-2 max-h-[80vh] overflow-y-auto">
                    {/* Navigation Items */}
                    {(isSupplierOnly
                      ? supplierNavItems
                      : [...coreNavItems, ...additionalNavItems]
                    )
                      .filter((item) => {
                        if (item.href === "/users" && !canManageUsers)
                          return false;
                        return true;
                      })
                      .map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <DropdownMenuItem key={item.name} asChild>
                            <Link
                              to={item.href}
                              className="flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-700 hover:text-terracotta-600 hover:bg-gray-50 w-full"
                              onClick={() => setIsOpen(false)}
                            >
                              <IconComponent className="h-4 w-4" />
                              <span>{item.name}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}

                    <DropdownMenuSeparator />

                    {/* User Section */}
                    <div className="px-4 py-3 space-y-3">
                      {isUserAuthenticated ? (
                        <>
                          <div className="flex items-center space-x-3 p-2 rounded-md bg-gray-50">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={getUserAvatarUrl()}
                                alt={getUserDisplayName()}
                              />
                              <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-xs">
                                {getInitials(getUserDisplayName())}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {getUserDisplayName()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {(authUser || keycloakUser)?.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="flex-1"
                            >
                              <Link
                                to="/profile"
                                onClick={() => setIsOpen(false)}
                              >
                                <User className="h-4 w-4 mr-2" />
                                Profile
                              </Link>
                            </Button>
                            {!DEV_MODE && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleLogout}
                                className="flex-1"
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                            className="flex-1"
                          >
                            <Link
                              to="/auth?mode=login"
                              onClick={() => setIsOpen(false)}
                            >
                              {t("auth.login")}
                            </Link>
                          </Button>
                          <Button size="sm" asChild className="flex-1">
                            <Link
                              to="/auth?mode=register"
                              onClick={() => setIsOpen(false)}
                            >
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
