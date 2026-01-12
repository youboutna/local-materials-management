/**
 * Hexagonal Hook for Users Management
 * Encapsulates all user-related operations with clean architecture
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface User {
  id: string;
  fullName: string | null;
  phone: string | null;
  nationalId: string | null;
  avatarUrl: string | null;
  email: string | null;
  roles: string[];
  primaryRole: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UpdateUserInput {
  fullName?: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
}

export function useUsersHex() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ["users-hex"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      if (!profilesData) return [];

      // Fetch roles for each user
      const usersWithRoles = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: rolesData } = await supabase
            .from("user_roles")
            .select("role_name")
            .eq("user_id", profile.id);

          const roles = rolesData?.map((r) => r.role_name) || [];
          const primaryRole = roles[0] || "viewer";

          return {
            id: profile.id,
            fullName: profile.full_name,
            phone: profile.phone,
            nationalId: profile.national_id,
            avatarUrl: profile.avatar_url,
            email: null, // Email is in auth.users, not accessible via client
            roles,
            primaryRole,
            isActive: true, // Default to true, can be updated via admin
            createdAt: profile.created_at || "",
            updatedAt: profile.updated_at || "",
          } as User;
        })
      );

      return usersWithRoles;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateUserInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};

      if (input.fullName !== undefined) updateData.full_name = input.fullName;
      if (input.phone !== undefined) updateData.phone = input.phone;
      if (input.nationalId !== undefined) updateData.national_id = input.nationalId;
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-hex"] });
      toast.success("Utilisateur mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { error } = await supabase.rpc("assign_user_role", {
        target_user_id: userId,
        role_name: roleName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-hex"] });
      toast.success("Rôle assigné avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role_name", roleName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-hex"] });
      toast.success("Rôle retiré avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    updateUser: updateMutation.mutateAsync,
    assignRole: assignRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    isAssigningRole: assignRoleMutation.isPending,
  };
}

export function useUserHex(id: string | undefined) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["user-hex", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (profileError) throw profileError;

      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role_name")
        .eq("user_id", id);

      const roles = rolesData?.map((r) => r.role_name) || [];

      return {
        id: profile.id,
        fullName: profile.full_name,
        phone: profile.phone,
        nationalId: profile.national_id,
        avatarUrl: profile.avatar_url,
        email: null,
        roles,
        primaryRole: roles[0] || "viewer",
        isActive: true,
        createdAt: profile.created_at || "",
        updatedAt: profile.updated_at || "",
      } as User;
    },
    enabled: !!id,
  });

  return { user, isLoading, error };
}
