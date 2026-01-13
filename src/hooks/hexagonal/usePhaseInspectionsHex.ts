import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Inspection {
  id: string;
  project_id: string;
  phase_id: string | null;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments: string | null;
  documents: any;
  payment_type: string | null;
  created_at: string;
  updated_at: string;
}

interface InspectionFormData {
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: string;
  comments: string;
  documents?: File[];
}

export function usePhaseInspectionsHex(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch inspections
  const inspectionsQuery = useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async (): Promise<Inspection[]> => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('phase_id', phaseId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!phaseId,
  });

  // Upload documents helper
  const uploadDocuments = async (documents: File[]): Promise<any[]> => {
    const uploadPromises = documents.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `inspections/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-documents')
        .getPublicUrl(filePath);

      return {
        name: file.name,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      };
    });

    return Promise.all(uploadPromises);
  };

  // Add inspection mutation
  const addMutation = useMutation({
    mutationFn: async (inspectionData: InspectionFormData) => {
      let documentsData = {};
      if (inspectionData.documents && inspectionData.documents.length > 0) {
        const uploadedDocs = await uploadDocuments(inspectionData.documents);
        documentsData = { validation_documents: uploadedDocs };
      }

      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: projectId,
          phase_id: phaseId,
          inspector: inspectionData.inspector,
          date: new Date(inspectionData.date).toISOString(),
          status: inspectionData.status,
          progress_at_inspection: parseInt(inspectionData.progress_at_inspection) || 0,
          comments: inspectionData.comments,
          documents: documentsData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ 
        title: 'Inspection ajoutée avec succès', 
        description: 'La progression du projet a été mise à jour automatiquement' 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Delete inspection mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection supprimée avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Calculate stats
  const averageProgress = inspectionsQuery.data && inspectionsQuery.data.length > 0 
    ? inspectionsQuery.data.reduce((sum, i) => sum + i.progress_at_inspection, 0) / inspectionsQuery.data.length
    : 0;

  return {
    // Queries
    inspections: inspectionsQuery.data || [],
    isLoading: inspectionsQuery.isLoading,
    isError: inspectionsQuery.isError,
    
    // Stats
    averageProgress: Math.round(averageProgress),
    totalInspections: inspectionsQuery.data?.length || 0,
    
    // Mutations
    addInspection: addMutation.mutate,
    deleteInspection: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
