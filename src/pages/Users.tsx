import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { UserPlus, Search, User, Edit, Trash2 } from 'lucide-react';
import { DEV_MODE } from '@/config/constants';

// Define types for profile data
type Profile = Database['public']['Tables']['profiles']['Row'];

// Mock profiles for development mode
const DEV_PROFILES: Profile[] = [
  {
    id: "dev-user-id",
    full_name: "Développeur Test",
    role: "patient", // Updated from "admin"
    phone: "123456789",
    national_id: "DEV12345",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "dev-user-id-2",
    full_name: "Marie Diallo",
    role: "patient", // Updated from "user"
    phone: "987654321",
    national_id: "DEV54321",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const Users = () => {
  const { toast } = useToast();
  const { user, isDevelopmentMode } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>(isDevelopmentMode ? DEV_PROFILES : []);
  const [loading, setLoading] = useState<boolean>(!isDevelopmentMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!user && !isDevelopmentMode) {
      navigate('/auth?mode=login');
      toast({
        title: "Accès restreint",
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: "destructive"
      });
    }
  }, [user, navigate, toast, isDevelopmentMode]);

  // Fetch profiles
  useEffect(() => {
    if (isDevelopmentMode) {
      console.log('Using mock profiles in development mode');
      return;
    }

    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setProfiles(data);
        }
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: `Impossible de récupérer les utilisateurs: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfiles();
    }
  }, [user, toast, isDevelopmentMode]);

  const handleViewDetails = (profile: Profile) => {
    setSelectedUser(profile);
    setIsDetailOpen(true);
  };

  // Filter profiles based on search query
  const filteredProfiles = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.national_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user initials for avatar
  const getUserInitials = (fullName: string | null) => {
    if (!fullName) return 'U';
    
    const nameParts = fullName.split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {isDevelopmentMode && (
        <div className="fixed top-20 right-4 z-50 bg-amber-100 text-amber-800 px-4 py-2 rounded-md shadow-md text-sm">
          🛠️ Mode développement actif
        </div>
      )}
      
      <main className="flex-grow container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-serif text-adrar-800">
              Gestion des Utilisateurs
            </h1>
            
            <Button
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center gap-2"
              onClick={() => navigate('/auth?mode=register')}
            >
              <UserPlus className="h-4 w-4" />
              <span>Nouvel Utilisateur</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
            <Input
              placeholder="Rechercher un utilisateur..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Users Table */}
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                  <TableHead className="hidden md:table-cell">ID National</TableHead>
                  <TableHead className="hidden md:table-cell">Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-adrar-600">
                      {searchQuery ? "Aucun utilisateur ne correspond à la recherche" : "Aucun utilisateur trouvé"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-terracotta-100 text-terracotta-700">
                            {profile.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} alt={profile.full_name || 'Utilisateur'} />
                            ) : (
                              <AvatarFallback>{getUserInitials(profile.full_name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{profile.full_name || 'Utilisateur sans nom'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{profile.phone || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{profile.national_id || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'practitioner' 
                            ? 'bg-terracotta-100 text-terracotta-800' 
                            : 'bg-sandstone-100 text-adrar-700'
                        }`}>
                          {profile.role || 'patient'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 border-terracotta-200 hover:border-terracotta-300"
                          onClick={() => handleViewDetails(profile)}
                        >
                          <span className="sr-only">Voir détails</span>
                          <User className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-xs text-right">
                    Total: {filteredProfiles.length} utilisateur(s)
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </motion.div>
      </main>

      {/* User Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[90%] sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-lg font-serif">Détails de l'utilisateur</SheetTitle>
          </SheetHeader>
          
          {selectedUser && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 bg-terracotta-100 text-terracotta-700 text-2xl">
                  {selectedUser.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name || 'Utilisateur'} />
                  ) : (
                    <AvatarFallback>{getUserInitials(selectedUser.full_name)}</AvatarFallback>
                  )}
                </Avatar>
                <h3 className="text-xl font-medium">{selectedUser.full_name || 'Utilisateur sans nom'}</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Rôle</Label>
                  <p className="font-medium">{selectedUser.role || 'patient'}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">ID National</Label>
                  <p className="font-medium">{selectedUser.national_id || '-'}</p>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Date d'inscription</Label>
                  <p className="font-medium">
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <SheetFooter className="pt-4 flex gap-2 justify-center sm:justify-end">
            <Button 
              variant="outline"
              className="border-terracotta-200 hover:border-terracotta-300 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              <span>Modifier</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Footer />
    </div>
  );
};

export default Users;
