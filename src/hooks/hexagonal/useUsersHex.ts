import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { UserService } from '@/application/services/UserService';
import { UserMapper } from '@/infrastructure/transformers/UserMapper';
import { UserTransformer, UserResponseDto, CreateUserRequestDto, UpdateUserRequestDto } from '@/dtos/transforms/UserTransformer';
import { User } from '@/domain/entities/User';
import { SomelecRole } from '@/domain/entities/User';
import { toast } from 'sonner';

// Types pour les hooks
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

/**
 * Hook principal pour la gestion des utilisateurs
 * Architecture hexagonale complète avec mocks centralisés
 */
export function useUsersHex(): UseUsersHexResult {
  const queryClient = useQueryClient();
  
  // [Factory] → [Adapter] → [Service] → [Transformers] → [Entities]
  // Utilisation de l'architecture existante
  const userRepository = RepositoryFactory.getUserRepository();
  const userService = new UserService(userRepository);

  // Query pour la liste des utilisateurs
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserResponseDto[]> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        // [Factory] → [Adapter] → [Service] → [Transformers] → [Persistence]
        const users = await userService.getAllUsers();
        
        // [Transformers]: Entities → DTOs
        // Utilisation du Transformer existant : UserTransformer
        return UserTransformer.toResponseDtoArray(users);
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (userData: CreateUserRequestDto): Promise<UserResponseDto> => {
      try {
        // Convert DTO to User entity for service
        const userEntity: Omit<User, 'id'> = {
          name: userData.fullName,
          email: userData.email,
          phone: userData.phone || '',
          role: userData.role as SomelecRole, // Cast to SomelecRole enum
          image: userData.avatar || '',
          workspaceIds: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          userRoles: [],
          fullName: userData.fullName,
          avatar: userData.avatar || '',
          lastLogin: undefined
        };

        const createdUser = await userService.createUser(userEntity);
        
        return UserTransformer.toResponseDto(createdUser);
      } catch (error) {
        console.error('Error creating user:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateUserRequestDto }): Promise<UserResponseDto> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        const updateData = UserTransformer.toUpdateData(updates); // Application: Request DTO → Domain
        const updatedUser = await userService.updateUser(id, updateData as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        
        return UserTransformer.toResponseDto(updatedUser as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      } catch (error) {
        console.error('Error updating user:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        // Flux hexagonal complet - géré automatiquement par RepositoryFactory
        await userService.deleteUser(id);
      } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success("Utilisateur supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
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
