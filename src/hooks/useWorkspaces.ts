
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface WorkspaceData {
  name: string;
  location: string;
  status?: string;
  contact_manager?: string;
  contact_phone?: string;
  facilities?: string[];
}

export const useWorkspaces = () => {
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const repo = RepositoryFactory.getWorkspaceRepository();
      return await repo.findAll();
    }
  });

  const createWorkspace = useMutation({
    mutationFn: async (workspaceData: WorkspaceData) => {
      const repo = RepositoryFactory.getWorkspaceRepository();
      return await repo.create({
        name: workspaceData.name,
        location: workspaceData.location,
        status: workspaceData.status || 'active',
        contact_manager: workspaceData.contact_manager,
        contact_phone: workspaceData.contact_phone,
        facilities: workspaceData.facilities || []
      } as any);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: "Espace de travail créé",
        description: `L'espace de travail "${data?.name}" a été créé avec succès.`,
      });
    },
    onError: (error) => {
      console.error('Error creating workspace:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'espace de travail.",
        variant: "destructive",
      });
    }
  });

  return {
    workspaces: workspaces || [],
    isLoading,
    error,
    createWorkspace
  };
};
