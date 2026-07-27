import { UserService } from '@/application/services/UserService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive: boolean;
  fullName?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequestDto {
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

export interface UpdateUserRequestDto {
  fullName?: string;
  phone?: string;
  role?: string;
  avatar?: string;
}

export interface UseUsersHexResult {
  users: UserResponseDto[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createUser: (data: CreateUserRequestDto) => void;
  updateUser: ({ id, data }: { id: string; data: UpdateUserRequestDto }) => void;
  deleteUser: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function useUsersHex(): UseUsersHexResult {
  const queryClient = useQueryClient();
  const userRepository = RepositoryFactory.getUserRepository();
  const userService = new UserService(userRepository);

  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserResponseDto[]> => {
      const allUsers = await userService.getAllUsers();
      return allUsers.map((u: any) => ({
        id: u.id,
        name: u.name || u.fullName || '',
        email: u.email || '',
        phone: u.phone,
        role: u.role,
        isActive: u.isActive ?? true,
        fullName: u.fullName || u.name,
        avatar: u.avatar || u.image,
        createdAt: u.createdAt ? String(u.createdAt) : undefined,
        updatedAt: u.updatedAt ? String(u.updatedAt) : undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (userData: CreateUserRequestDto) => {
      return await userService.createUser({
        name: userData.fullName,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role as any,
        image: userData.avatar || '',
        fullName: userData.fullName,
        avatar: userData.avatar || '',
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur créé avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserRequestDto }) => {
      return await userService.updateUser(id, {
        fullName: updates.fullName,
        phone: updates.phone,
        role: updates.role as any,
        avatar: updates.avatar,
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur mis à jour avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await userService.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur supprimé avec succès");
    },
    onError: (error: Error) => { toast.error(error.message); }
  });

  return {
    users,
    isLoading,
    error: error ? String(error) : null,
    refetch,
    createUser: (data: CreateUserRequestDto) => createMutation.mutate(data),
    updateUser: ({ id, data }: { id: string; data: UpdateUserRequestDto }) => updateMutation.mutate({ id, updates: data }),
    deleteUser: (id: string) => deleteMutation.mutate(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
