import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { UserPlus, Search, User, Edit, Ban, CheckCircle } from 'lucide-react';
import { DEV_MODE } from '@/config/constants';
import RoleBadge, { RoleType } from '@/components/RoleBadge';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import UserManagementDialog from '@/components/users/UserManagementDialog';
import { useLanguage } from '@/contexts/LanguageContext';

// Define user profile type with roles array (without the old role property)
type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  roles?: string[];
  primaryRole?: RoleType;
  is_active?: boolean;
};

// Mock profiles for development mode
const DEV_PROFILES: UserProfile[] = [
  {
    id: "dev-user-id",
    full_name: "Développeur Test",
    phone: "123456789",
    national_id: "DEV12345",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['admin'],
    primaryRole: 'admin',
    is_active: true
  },
  {
    id: "dev-user-id-2",
    full_name: "Marie Diallo",
    phone: "987654321",
    national_id: "DEV54321",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    roles: ['project_manager'],
    primaryRole: 'project_manager',
    is_active: true
  }
];

const Users = () => {
  const { toast } = useToast();
  const { user, isDevelopmentMode } = useAuth();
  const navigate = useNavigate();
  const { hasAnyRole } = useCurrentUserRoles();
  const { t } = useLanguage();
  const [profiles, setProfiles] = useState<UserProfile[]>(
    isDevelopmentMode ? DEV_PROFILES : []
  );
  const [loading, setLoading] = useState<boolean>(!isDevelopmentMode);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState<boolean>(false);
  const [managementMode, setManagementMode] = useState<'create' | 'edit'>('create');

  // Check if user can manage users (admin or director)
  const canManageUsers = hasAnyRole(['admin', 'director']);

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

  // Fetch profiles with roles
  useEffect(() => {
    if (isDevelopmentMode) {
      console.log('Using mock profiles in development mode');
      return;
    }

    const fetchProfilesWithRoles = async () => {
      try {
        setLoading(true);
        
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        if (profilesData) {
          // Fetch roles for each user
          const profilesWithRoles = await Promise.all(
            profilesData.map(async (profile) => {
              const { data: rolesData } = await (supabase as any)
                .from('user_roles')
                .select('role_name')
                .eq('user_id', profile.id);

              const roles = rolesData?.map((r: any) => r.role_name) || [];
              const primaryRole = roles[0] as RoleType || 'viewer';

              return {
                ...profile,
                roles,
                primaryRole
              } as UserProfile;
            })
          );

          setProfiles(profilesWithRoles);
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
      fetchProfilesWithRoles();
    }
  }, [user, toast, isDevelopmentMode]);

  const handleViewDetails = (profile: UserProfile) => {
    setSelectedUser(profile);
    setIsDetailOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setManagementMode('create');
    setIsManagementDialogOpen(true);
  };

  const handleEditUser = (profile: UserProfile) => {
    setSelectedUser(profile);
    setManagementMode('edit');
    setIsManagementDialogOpen(true);
  };

  const handleToggleUserStatus = async (profile: UserProfile) => {
    try {
      const newStatus = !profile.is_active;
      
      // Update user status in auth.users table
      const { error } = await supabase.auth.admin.updateUserById(
        profile.id,
        { ban_duration: newStatus ? 'none' : '24h' }
      );

      if (error) throw error;

      // Update local state
      setProfiles(prev => prev.map(p => 
        p.id === profile.id ? { ...p, is_active: newStatus } : p
      ));

      toast({
        title: newStatus ? "Utilisateur activé" : "Utilisateur désactivé",
        description: `Le compte de ${profile.full_name} a été ${newStatus ? 'activé' : 'désactivé'}.`
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const refreshUserList = () => {
    // Refetch profiles logic here
    // ... existing fetchProfilesWithRoles logic
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
          🛠️ {t('dev_mode.active') || "Mode développement actif"}
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
              {t('users.title') || "Gestion des Utilisateurs"}
            </h1>
            
            {canManageUsers && (
              <Button
                className="bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center gap-2"
                onClick={handleCreateUser}
              >
                <UserPlus className="h-4 w-4" />
                <span>{t('users.new') || "Nouvel Utilisateur"}</span>
              </Button>
            )}
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
            <Input
              placeholder={t('users.search_placeholder') || "Rechercher un utilisateur..."}
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
                  <TableHead>{t('users.table.name') || "Utilisateur"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.table.phone') || "Téléphone"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.table.national_id') || "ID National"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.table.role') || "Rôle principal"}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.table.status') || "Statut"}</TableHead>
                  <TableHead className="text-right">{t('users.table.actions') || "Actions"}</TableHead>
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
                      {searchQuery
                        ? t('users.no_results') || "Aucun utilisateur ne correspond à la recherche"
                        : t('users.none_found') || "Aucun utilisateur trouvé"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-terracotta-100 text-terracotta-700">
                            {profile.avatar_url ? (
                              <AvatarImage src={profile.avatar_url} alt={profile.full_name || t('users.no_name') || 'Utilisateur'} />
                            ) : (
                              <AvatarFallback>{getUserInitials(profile.full_name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{profile.full_name || t('users.no_name') || 'Utilisateur sans nom'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{profile.phone || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{profile.national_id || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {profile.primaryRole && <RoleBadge role={profile.primaryRole} />}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.is_active !== false 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profile.is_active !== false
                            ? t('users.active') || 'Actif'
                            : t('users.inactive') || 'Désactivé'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 border-terracotta-200 hover:border-terracotta-300"
                            onClick={() => handleViewDetails(profile)}
                          >
                            <User className="h-4 w-4" />
                          </Button>
                          
                          {canManageUsers && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-blue-200 hover:border-blue-300"
                                onClick={() => handleEditUser(profile)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`h-8 ${
                                  profile.is_active !== false 
                                    ? 'border-red-200 hover:border-red-300 text-red-600' 
                                    : 'border-green-200 hover:border-green-300 text-green-600'
                                }`}
                                onClick={() => handleToggleUserStatus(profile)}
                              >
                                {profile.is_active !== false ? (
                                  <Ban className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-xs text-right">
                    {t('users.total', { count: filteredProfiles.length }) || `Total: ${filteredProfiles.length} utilisateur(s)`}
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
            <SheetTitle className="text-lg font-serif">{t('users.details_title') || "Détails de l'utilisateur"}</SheetTitle>
          </SheetHeader>
          
          {selectedUser && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 bg-terracotta-100 text-terracotta-700 text-2xl">
                  {selectedUser.avatar_url ? (
                    <AvatarImage src={selectedUser.avatar_url} alt={selectedUser.full_name || t('users.no_name') || 'Utilisateur'} />
                  ) : (
                    <AvatarFallback>{getUserInitials(selectedUser.full_name)}</AvatarFallback>
                  )}
                </Avatar>
                <h3 className="text-xl font-medium">{selectedUser.full_name || t('users.no_name') || 'Utilisateur sans nom'}</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles?.map(role => (
                    <RoleBadge key={role} role={role as RoleType} />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-sm">{t('users.phone') || "Téléphone"}</label>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                
                <div>
                  <label className="text-muted-foreground text-sm">{t('users.national_id') || "ID National"}</label>
                  <p className="font-medium">{selectedUser.national_id || '-'}</p>
                </div>
                
                <div>
                  <label className="text-muted-foreground text-sm">{t('users.created_at') || "Date d'inscription"}</label>
                  <p className="font-medium">
                    {selectedUser.created_at 
                      ? new Date(selectedUser.created_at).toLocaleDateString(t('locale') || 'fr-FR', {
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
          
          {canManageUsers && (
            <SheetFooter className="pt-4 flex gap-2 justify-center sm:justify-end">
              <Button 
                variant="outline"
                className="border-terracotta-200 hover:border-terracotta-300 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                <span>{t('users.manage_roles') || "Gérer les rôles"}</span>
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
      
      {/* User Management Dialog */}
      <UserManagementDialog
        user={selectedUser}
        isOpen={isManagementDialogOpen}
        onClose={() => setIsManagementDialogOpen(false)}
        onUpdate={refreshUserList}
        mode={managementMode}
      />
      
      <Footer />
    </div>
  );
};

export default Users;
