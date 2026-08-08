import RoleBadge, { RoleType } from "@/components/RoleBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserManagementDialog from "@/components/users/UserManagementDialog";
import { useAuth } from '@/contexts/use-auth';
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUserRoles } from "@/hooks/useUserRoles";
import { useUserProfilesHex, useToggleUserStatusHex } from '@/hooks/hexagonal'
import { motion } from "framer-motion";
import { Ban, CheckCircle, Edit, Search, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { getDevUsersSnapshot, type DevUserProfile } from "@/config/constants";

// Define user profile type with roles array and email
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
  email?: string;
};

// Development-mode profiles derived from the local DEV_USERS registry (no mock data)
const toDevProfile = (u: DevUserProfile): UserProfile => ({
  id: u.id,
  full_name: u.user_metadata?.full_name ?? null,
  phone: u.user_metadata?.phone ?? null,
  national_id: u.user_metadata?.national_id ?? null,
  avatar_url: null,
  created_at: null,
  updated_at: null,
  roles: u.user_metadata?.role ? [u.user_metadata.role] : [],
  primaryRole: (u.user_metadata?.role as RoleType) ?? undefined,
  is_active: true,
  email: u.email,
});

const getDevProfiles = (): UserProfile[] =>
  Object.values(getDevUsersSnapshot()).map(toDevProfile);

const Users = () => {
  const { toast } = useToast();
  const { user, isDevelopmentMode } = useAuth();
  const navigate = useNavigate();
  const { hasAnyRole } = useCurrentUserRoles();
  const { t, language } = useLanguage();
  const [profiles, setProfiles] = useState<UserProfile[]>(
    isDevelopmentMode ? getDevProfiles() : []
  );
  const [loading, setLoading] = useState<boolean>(!isDevelopmentMode);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isManagementDialogOpen, setIsManagementDialogOpen] =
    useState<boolean>(false);
  const [managementMode, setManagementMode] = useState<"create" | "edit">(
    "create"
  );

  // Check if user can manage users (admin or director)
  const canManageUsers = hasAnyRole(["admin", "director"]);

  // Check if user is authenticated
  useEffect(() => {
    if (!user && !isDevelopmentMode) {
      navigate("/auth?mode=login");
      toast({
        title: t('common.error'),
        description: "Veuillez vous connecter pour accéder à cette page.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast, isDevelopmentMode]);

  // Use hexagonal hook for user profiles
  const { data: profilesData = [], isLoading, error, refetch } = useUserProfilesHex(user?.id, isDevelopmentMode);
  const toggleUserStatus = useToggleUserStatusHex();

  // Set profiles from hook data or development mode
  useEffect(() => {
    if (isDevelopmentMode) {
      setProfiles(getDevProfiles());
    } else if (profilesData.length > 0) {
      setProfiles(profilesData as UserProfile[]);
    }
  }, [profilesData, isDevelopmentMode]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: t('common.error'),
        description: `Impossible de récupérer les utilisateurs: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [error, toast, t]);

  const handleViewDetails = (profile: UserProfile) => {
    setSelectedUser(profile);
    setIsDetailOpen(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setManagementMode("create");
    setIsManagementDialogOpen(true);
  };

  const handleEditUser = (profile: UserProfile) => {
    setSelectedUser(profile);
    setManagementMode("edit");
    setIsManagementDialogOpen(true);
  };

  const handleToggleUserStatus = async (profile: UserProfile) => {
    toggleUserStatus.mutate({
      userId: profile.id,
      newStatus: !profile.is_active,
    });
  };

  const refreshUserList = () => {
    refetch();
  };

  // Filter profiles based on search query (now including email)
  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.national_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user initials for avatar
  const getUserInitials = (fullName: string | null) => {
    if (!fullName) return "U";

    const nameParts = fullName.split(" ");
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return `${nameParts[0][0]}${
      nameParts[nameParts.length - 1][0]
    }`.toUpperCase();
  };

  return (
    <AppLayout
      pageTitle={t("users.title") || "Gestion des Utilisateurs"}
      actions={
        canManageUsers && (
          <Button
            className="bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center gap-2"
            onClick={handleCreateUser}
          >
            <UserPlus className="h-4 w-4" />
            <span>{t("users.new") || "Nouvel Utilisateur"}</span>
          </Button>
        )
      }
    >
      {isDevelopmentMode && (
        <div className="fixed top-20 right-4 z-50 bg-amber-100 text-amber-800 px-4 py-2 rounded-md shadow-md text-sm">
          ðŸ› ï¸ {t("dev_mode.active") || "Mode développement actif"}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
          <Input
            placeholder={
              t("users.search_placeholder") || "Rechercher un utilisateur..."
            }
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-adrar-400" />
            <Input
              placeholder={
                t("users.search_placeholder") || "Rechercher un utilisateur..."
              }
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
                  <TableHead>
                    {t("users.table.name") || "Utilisateur"}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("auth.email") || "Email"}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("users.table.phone") || "Téléphone"}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("users.table.national_id") || "ID National"}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("users.table.role") || "Rôle principal"}
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("users.table.status") || "Statut"}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("users.table.actions") || "Actions"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-adrar-600"
                    >
                      {searchQuery
                        ? t("users.no_results") ||
                          "Aucun utilisateur ne correspond à la recherche"
                        : t("users.none_found") || "Aucun utilisateur trouvé"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 bg-terracotta-100 text-terracotta-700">
                            {profile.avatar_url ? (
                              <AvatarImage
                                src={profile.avatar_url}
                                alt={
                                  profile.full_name ||
                                  t("users.no_name") ||
                                  "Utilisateur"
                                }
                              />
                            ) : (
                              <AvatarFallback>
                                {getUserInitials(profile.full_name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {profile.full_name ||
                                t("users.no_name") ||
                                "Utilisateur sans nom"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {profile.email || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {profile.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {profile.national_id || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {profile.primaryRole && (
                          <RoleBadge role={profile.primaryRole} />
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            profile.is_active !== false
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {profile.is_active !== false
                            ? t("users.active") || "Actif"
                            : t("users.inactive") || "Désactivé"}
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
                                {t("users.edit")}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 ${
                                  profile.is_active !== false
                                    ? "border-red-200 hover:border-red-300 text-red-600"
                                    : "border-green-200 hover:border-green-300 text-green-600"
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
                  <TableCell
                    colSpan={7}
                    className="text-muted-foreground text-xs text-right"
                  >
                    {t("users.total")
                      ? t("users.total").replace(
                          "{count}",
                          filteredProfiles.length.toString()
                        )
                      : `Total: ${filteredProfiles.length} utilisateur(s)`}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
      </motion.div>

      {/* User Details Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[90%] sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-lg font-serif">
              {t("users.details_title") || "Détails de l'utilisateur"}
            </SheetTitle>
          </SheetHeader>

          {selectedUser && (
            <div className="py-6 space-y-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20 bg-terracotta-100 text-terracotta-700 text-2xl">
                  {selectedUser.avatar_url ? (
                    <AvatarImage
                      src={selectedUser.avatar_url}
                      alt={
                        selectedUser.full_name ||
                        t("users.no_name") ||
                        "Utilisateur"
                      }
                    />
                  ) : (
                    <AvatarFallback>
                      {getUserInitials(selectedUser.full_name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="text-xl font-medium">
                  {selectedUser.full_name ||
                    t("users.no_name") ||
                    "Utilisateur sans nom"}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.roles?.map((role) => (
                    <RoleBadge key={role} role={role as RoleType} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-sm">
                    {t("auth.email") || "Email"}
                  </label>
                  <p className="font-medium">{selectedUser.email || "-"}</p>
                </div>

                <div>
                  <label className="text-muted-foreground text-sm">
                    {t("users.phone") || "Téléphone"}
                  </label>
                  <p className="font-medium">{selectedUser.phone || "-"}</p>
                </div>

                <div>
                  <label className="text-muted-foreground text-sm">
                    {t("users.national_id") || "ID National"}
                  </label>
                  <p className="font-medium">
                    {selectedUser.national_id || "-"}
                  </p>
                </div>

                <div>
                  <label className="text-muted-foreground text-sm">
                    {t("users.created_at") || "Date d'inscription"}
                  </label>
                  <p className="font-medium">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString(
                          language === "ar"
                            ? "ar-SA"
                            : language === "en"
                            ? "en-US"
                            : "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {canManageUsers && selectedUser && (
            <SheetFooter className="pt-4 flex gap-2 justify-center sm:justify-end">
              <Button
                variant="outline"
                className="border-terracotta-200 hover:border-terracotta-300 flex items-center gap-2"
                onClick={() => handleEditUser(selectedUser)}
              >
                <Edit className="h-4 w-4" />
                <span>{t("users.edit") || "Modifier"}</span>
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
    </AppLayout>
  );
};

export default Users;
