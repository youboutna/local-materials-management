import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, FileText, Home, Briefcase, Package, Settings as SettingsIcon, Users as UsersIcon, ClipboardList, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('dashboard.title'), href: '/dashboard', icon: Home },
    { name: t('nav.projects'), href: '/projects', icon: Briefcase },
    { name: t('project_import.title'), href: '/projects/import', icon: Upload },
    { name: t('nav.materials'), href: '/materials', icon: Package },
    { name: t('documents.title'), href: '/documents', icon: FileText },
    { name: t('task.title') || 'Tâches', href: '/tasks', icon: ClipboardList },
    { name: t('nav.users'), href: '/users', icon: UsersIcon },
  ];

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || '';
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-terracotta-500 to-adrar-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-adrar-900 font-serif">
              Construct
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-terracotta-600 transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user && <NotificationDropdown />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatarUrl()} alt={getUserDisplayName()} />
                      <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
                        {getInitials(getUserDisplayName())}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      <span>{t('settings.title')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/auth?mode=login">{t('auth.login')}</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=register">{t('auth.register')}</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-terracotta-600 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                <div className="pt-4 pb-2">
                  <div className="flex items-center justify-between px-3">
                    <LanguageSwitcher />
                    
                    {user && <NotificationDropdown />}
                    
                    {user ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={getUserAvatarUrl()} alt={getUserDisplayName()} />
                            <AvatarFallback className="bg-terracotta-100 text-terracotta-700">
                              {getInitials(getUserDisplayName())}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{getUserDisplayName()}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleLogout}>
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to="/auth?mode=login" onClick={() => setIsOpen(false)}>
                            {t('auth.login')}
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link to="/auth?mode=register" onClick={() => setIsOpen(false)}>
                            {t('auth.register')}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
