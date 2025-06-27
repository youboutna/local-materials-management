
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  // Fetch workspaces
  const { data: workspaces, isLoading, error } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Create workspace
  const createWorkspace = useMutation({
    mutationFn: async (workspaceData: WorkspaceData) => {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceData.name,
          location: workspaceData.location,
          status: workspaceData.status || 'active',
          contact_manager: workspaceData.contact_manager,
          contact_phone: workspaceData.contact_phone,
          facilities: workspaceData.facilities || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast({
        title: "Espace de travail créé",
        description: `L'espace de travail "${data.name}" a été créé avec succès.`,
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
