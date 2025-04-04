
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navbarClasses = cn(
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
    {
      'py-6 bg-sandstone-50/80 backdrop-blur-md': !isScrolled && !isMobileMenuOpen,
      'py-3 bg-white/95 backdrop-blur-md shadow-elegant': isScrolled || isMobileMenuOpen,
    }
  );

  const navLinks = [
    { title: 'Accueil', path: '/' },
    { title: 'Projets', path: '/projects' },
    { title: 'Tableau de bord', path: '/dashboard' },
    { title: 'Matériaux', path: '/materials' },
    { title: 'Utilisateurs', path: '/users', adminOnly: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth?mode=login');
  };

  const getUserInitials = () => {
    if (!user || !user.user_metadata?.full_name) return 'U';
    
    const fullName = user.user_metadata.full_name;
    const nameParts = fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  };

  // Filter links based on user role
  const filteredLinks = navLinks.filter(link => {
    if (link.adminOnly) {
      // For now, show admin links to all authenticated users
      // In the future, you can check user.user_metadata.role === 'admin'
      return !!user;
    }
    return true;
  });

  return (
    <nav className={navbarClasses}>
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-2xl font-serif font-semibold text-adrar-700"
          >
            <span className="text-terracotta-500">Materials</span>
            <span className="text-adrar-800">Management</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors px-4 py-2 rounded-md hover:bg-sandstone-100",
                  location.pathname === link.path
                    ? "bg-sandstone-100 text-terracotta-600"
                    : "text-adrar-600 hover:text-terracotta-500"
                )}
              >
                {link.title}
              </Link>
            ))}
          </div>

          {/* Auth Buttons or User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-terracotta-50">
                    <Avatar className="h-10 w-10 bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200 transition-colors">
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-md" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.user_metadata?.full_name || 'Utilisateur'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate('/users')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Utilisateurs</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth?mode=login">
                  <Button variant="outline" className="border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button className="bg-terracotta-500 text-white hover:bg-terracotta-600">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden flex items-center text-adrar-800"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 px-2 bg-white/95 backdrop-blur-md animate-slide-down rounded-b-lg">
            <div className="flex flex-col space-y-3">
              {filteredLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "py-2 px-4 text-sm font-medium rounded-md",
                    location.pathname === link.path
                      ? "bg-sandstone-200 text-terracotta-500"
                      : "text-adrar-600 hover:bg-sandstone-100"
                  )}
                >
                  {link.title}
                </Link>
              ))}
              <div className="pt-4 flex flex-col space-y-2 border-t border-sandstone-100">
                {user ? (
                  <>
                    <div className="px-4 py-2 flex items-center space-x-3">
                      <Avatar className="h-8 w-8 bg-terracotta-100 text-terracotta-700">
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth?mode=login" className="w-full">
                      <Button variant="outline" className="w-full border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500 hover:text-white">
                        Connexion
                      </Button>
                    </Link>
                    <Link to="/auth?mode=register" className="w-full">
                      <Button className="w-full bg-terracotta-500 text-white hover:bg-terracotta-600">
                        Inscription
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
