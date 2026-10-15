import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInspectionService } from '@/application/services/InspectionService';
import { Inspection, InspectionStatus } from '@/domain/entities/Inspection';

export interface PhaseInspectionFormData {
  inspector: string;
  date: string;
  status: string;
  progressAtInspection: string;
  comments: string;
  documentsData?: Record<string, unknown>;
}

interface PhaseInspectionRow {
  id: string;
  project_id: string;
  phase_id: string | null;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments: string | null;
  documents: unknown;
}

function toPhaseInspectionRow(inspection: Inspection, documents?: unknown): PhaseInspectionRow {
  const status = inspection.status.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  return {
    id: inspection.id,
    project_id: inspection.projectId || '',
    phase_id: inspection.phaseId || null,
    inspector: inspection.inspector.name,
    date: inspection.date,
    status,
    progress_at_inspection: inspection.progressAtInspection,
    comments: inspection.comments ?? null,
    documents: documents ?? inspection.documents,
  };
}

export function usePhaseInspectionsListHex(phaseId: string) {
  return useQuery({
    queryKey: ['phase-inspections', phaseId],
    queryFn: async () => (await getInspectionService().getInspectionsByPhase(phaseId))
      .map((inspection) => toPhaseInspectionRow(inspection)),
  });
}

export function useAddPhaseInspectionHex(phaseId: string, projectId: string, syncProgress: () => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inspectionData: PhaseInspectionFormData) => {
      const inspection = await getInspectionService().createInspection({
        projectId,
        phaseId,
        inspector: inspectionData.inspector,
        date: new Date(inspectionData.date).toISOString(),
        status: inspectionData.status,
        progressAtInspection: parseInt(inspectionData.progressAtInspection) || 0,
        comments: inspectionData.comments,
        documentsData: inspectionData.documentsData || {},
      });

      await syncProgress();

      return toPhaseInspectionRow(inspection, inspectionData.documentsData || {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeletePhaseInspectionHex(phaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => getInspectionService().deleteInspection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phase-inspections', phaseId] });
    },
  });
}
