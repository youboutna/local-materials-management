import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut, isDevelopmentMode } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: t("nav.home"), href: "/", icon: Home },
    { name: t("dashboard.title"), href: "/dashboard", icon: Home },
    { name: t("nav.projects"), href: "/projects", icon: Briefcase },
    { name: t("project_import.title"), href: "/projects/import", icon: Upload },
    { name: t("nav.materials"), href: "/materials", icon: Package },
    { name: t("documents.title"), href: "/documents", icon: FileText },
    { name: t("task.title") || "Tâches", href: "/tasks", icon: ClipboardList },
    { name: t("nav.users"), href: "/users", icon: UsersIcon },
  ];

  const handleLogout = () => {
    signOut();
    navigate("/");
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
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || "";
  };

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-responsive">
        <div className="flex items-center justify-between min-h-14 sm:min-h-16 gap-2 sm:gap-4">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-adrar-900 font-serif hidden sm:block">
              Construct
            </span>
          </Link>

          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-mobile-sm lg:text-sm text-gray-700 hover:text-terracotta-600 transition-colors duration-200 font-medium whitespace-nowrap px-2 py-1 rounded-md hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-2 lg:space-x-3">
            <LanguageSwitcher />

            {user && <NotificationDropdown />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserAvatarUrl()}
                        alt={getUserDisplayName()}
                      />
                      <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
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
                      {user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("nav.profile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>{t("settings.title")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("auth.logout")}</span>
                  </DropdownMenuItem>
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

          {/* Modern Mobile Menu Button */}
          <div className="md:hidden">
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-700 hover:bg-gray-100"
                >
                  {isOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-screen max-w-sm mr-4 mt-2 bg-white/95 backdrop-blur-md border shadow-xl"
                align="end"
                side="bottom"
              >
                <div className="py-2">
                  {navItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          to={item.href}
                          className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-terracotta-600 hover:bg-gray-50 w-full"
                          onClick={() => setIsOpen(false)}
                        >
                          <IconComponent className="h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  
                  <DropdownMenuSeparator />
                  
                  {/* User Section in Mobile */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                      <LanguageSwitcher />
                      {user && <NotificationDropdown />}
                    </div>
                    
                    {user ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-2 rounded-md bg-gray-50">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={getUserAvatarUrl()}
                              alt={getUserDisplayName()}
                            />
                            <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
                              {getInitials(getUserDisplayName())}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getUserDisplayName()}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" asChild className="flex-1">
                            <Link to="/profile" onClick={() => setIsOpen(false)}>
                              <User className="h-4 w-4 mr-2" />
                              Profile
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleLogout} className="flex-1">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
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

        {/* Removed old mobile menu - now using dropdown */}
      </div>
    </motion.nav>
  );
};

export default Navbar;
