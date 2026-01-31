import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { InspectionService } from '@/application/services/InspectionService';
import { StorageService } from '@/application/services/StorageService';
import { InspectionTransformer } from '@/dtos/transforms/InspectionTransformer';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';
import { useToast } from '@/hooks/use-toast';

interface InspectionData {
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
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());
  const transformer = new InspectionTransformer();

  // Fetch inspections
  const inspectionsQuery = useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async (): Promise<InspectionData[]> => {
      // Use InspectionService with transformer
      const inspections = await inspectionService.getInspectionsByPhase(phaseId);
      return inspections.map(inspection => {
        const dto = transformer.toDTO(inspection);
        return {
          id: dto.id,
          project_id: dto.projectId,
          phase_id: dto.phaseId,
          inspector: dto.inspector,
          date: dto.date,
          status: dto.status,
          progress_at_inspection: dto.progressAtInspection,
          comments: dto.comments,
          documents: dto.documents,
          payment_type: dto.paymentType,
          created_at: dto.createdAt,
          updated_at: dto.updatedAt
        };
      });
    },
    enabled: !!phaseId,
  });

  // Upload documents helper
  const uploadDocuments = async (documents: File[]): Promise<any[]> => {
    // This would use StorageService - placeholder implementation
    const uploadedDocs = [];
    for (const doc of documents) {
      const result = await storageService.uploadFile(doc, 'inspection-documents');
      uploadedDocs.push(result);
    }
    return uploadedDocs;
  };

  // Add inspection mutation
  const addMutation = useMutation({
    mutationFn: async (inspectionData: InspectionFormData) => {
      let documentsData = {};
      if (inspectionData.documents && inspectionData.documents.length > 0) {
        const uploadedDocs = await uploadDocuments(inspectionData.documents);
        documentsData = { validation_documents: uploadedDocs };
      }

      // Use InspectionService with transformer - create using factory method
      const newInspection = Inspection.create({
        id: crypto.randomUUID(),
        projectId: projectId,
        phaseId: phaseId,
        inspector: inspectionData.inspector,
        date: new Date(inspectionData.date).toISOString(),
        comments: inspectionData.comments
      });

      return await inspectionService.createInspection(newInspection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection créée avec succès' });
    },
    onError: (error) => {
      toast({ 
        title: 'Erreur', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  // Update inspection mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionFormData> }) => {
      // Use InspectionService - placeholder implementation
      const updateData = {
        status: data.status as InspectionStatus,
        comments: data.comments,
        progressAtInspection: data.progress_at_inspection ? parseInt(data.progress_at_inspection) : undefined
      };

      return await inspectionService.updateInspection(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection mise à jour avec succès' });
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
      // Use InspectionService - placeholder implementation
      return await inspectionService.deleteInspection(id);
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

  // Calculate stats - use InspectionService for business logic
  const averageProgress = inspectionsQuery.data && inspectionsQuery.data.length > 0 
    ? inspectionsQuery.data.reduce((sum, i) => sum + i.progress_at_inspection, 0) / inspectionsQuery.data.length
    : 0;

  // This would use InspectionService for advanced calculations
  const stats = inspectionsQuery.data ? {
    averageProgress: Math.round(averageProgress),
    totalInspections: inspectionsQuery.data.length,
    completedInspections: inspectionsQuery.data.filter(i => i.status === 'completed').length,
    pendingInspections: inspectionsQuery.data.filter(i => i.status === 'scheduled' || i.status === 'requested').length,
    complianceScore: 85 // Would be calculated by InspectionService
  } : {
    averageProgress: 0,
    totalInspections: 0,
    completedInspections: 0,
    pendingInspections: 0,
    complianceScore: 0
  };

  return {
    // Queries
    inspections: inspectionsQuery.data || [],
    isLoading: inspectionsQuery.isLoading,
    error: inspectionsQuery.error,
    refetch: inspectionsQuery.refetch,
    
    // Mutations
    addMutation,
    updateMutation,
    deleteMutation,
    uploadDocuments,
    
    // Stats - would be calculated by InspectionService
    stats,
    
    // Convenience methods
    addInspection: addMutation.mutate,
    updateInspection: updateMutation.mutate,
    deleteInspection: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
