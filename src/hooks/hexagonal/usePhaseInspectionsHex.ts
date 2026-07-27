import { InspectionService } from '@/application/services/InspectionService';
import { StorageService } from '@/application/services/StorageService';
import { InspectionStatus } from '@/domain/entities/Inspection';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface InspectionData {
  id: string;
  project_id: string;
  phase_id: string | null;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments: string | null;
  documents: string[];
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

interface UploadedDocument {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export function usePhaseInspectionsHex(phaseId: string, projectId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inspectionService = new InspectionService(RepositoryFactory.getInspectionRepository());
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());

  const inspectionsQuery = useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async (): Promise<InspectionData[]> => {
      const inspections = await inspectionService.getInspectionsByProject(projectId);
      const phaseInspections = inspections.filter(i => i.phaseId === phaseId);
      return phaseInspections.map(inspection => ({
        id: inspection.id,
        project_id: inspection.projectId || projectId,
        phase_id: inspection.phaseId || null,
        inspector: typeof inspection.inspector === 'string' ? inspection.inspector : (inspection.inspector as any)?.name || '',
        date: inspection.date,
        status: String(inspection.status),
        progress_at_inspection: inspection.progressAtInspection || 0,
        comments: inspection.comments || null,
        documents: [] as string[],
        payment_type: null,
        created_at: inspection.createdAt ? String(inspection.createdAt) : new Date().toISOString(),
        updated_at: inspection.updatedAt ? String(inspection.updatedAt) : new Date().toISOString()
      }));
    },
    enabled: !!phaseId,
  });

  const uploadDocuments = async (documents: File[]): Promise<UploadedDocument[]> => {
    const uploadedDocs: UploadedDocument[] = [];
    for (const doc of documents) {
      try {
        const result = await storageService.uploadFile({
          bucket: 'inspections',
          path: `inspection-documents/${Date.now()}_${doc.name}`,
          file: doc
        });
        uploadedDocs.push({
          id: crypto.randomUUID(),
          url: result.publicUrl,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          uploaded_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to upload document:', error);
        throw new Error(`Failed to upload ${doc.name}`);
      }
    }
    return uploadedDocs;
  };

  const addMutation = useMutation({
    mutationFn: async (inspectionData: InspectionFormData) => {
      return await inspectionService.createInspection({
        projectId,
        phaseId,
        inspector: inspectionData.inspector,
        date: new Date(inspectionData.date).toISOString(),
        comments: inspectionData.comments,
        status: inspectionData.status as InspectionStatus,
        progressAtInspection: parseInt(inspectionData.progress_at_inspection) || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection créée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InspectionFormData> }) => {
      return await inspectionService.updateInspection(id, {
        status: data.status as InspectionStatus,
        comments: data.comments,
        progressAtInspection: data.progress_at_inspection ? parseInt(data.progress_at_inspection) : undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection mise à jour avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await inspectionService.deleteInspection(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      toast({ title: 'Inspection supprimée avec succès' });
    },
    onError: (error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    }
  });

  const averageProgress = inspectionsQuery.data && inspectionsQuery.data.length > 0 
    ? inspectionsQuery.data.reduce((sum, i) => sum + i.progress_at_inspection, 0) / inspectionsQuery.data.length
    : 0;

  const stats = inspectionsQuery.data ? {
    averageProgress: Math.round(averageProgress),
    totalInspections: inspectionsQuery.data.length,
    completedInspections: inspectionsQuery.data.filter(i => i.status === 'completed').length,
    pendingInspections: inspectionsQuery.data.filter(i => i.status === 'scheduled' || i.status === 'requested').length,
    complianceScore: 85
  } : {
    averageProgress: 0, totalInspections: 0, completedInspections: 0, pendingInspections: 0, complianceScore: 0
  };

  return {
    inspections: inspectionsQuery.data || [],
    isLoading: inspectionsQuery.isLoading,
    error: inspectionsQuery.error,
    refetch: inspectionsQuery.refetch,
    addMutation, updateMutation, deleteMutation, uploadDocuments,
    stats,
    addInspection: addMutation.mutate,
    updateInspection: updateMutation.mutate,
    deleteInspection: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
