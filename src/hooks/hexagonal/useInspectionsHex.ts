import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Inspection {
  id: string;
  projectId: string;
  projectTitle: string | null;
  phaseId: string | null;
  phaseName: string | null;
  date: string;
  inspector: string;
  status: string;
  progressAtInspection: number;
  paymentType: string | null;
  comments: string | null;
  documents: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateInspectionInput {
  projectId: string;
  phaseId?: string;
  date: string;
  inspector: string;
  status?: string;
  progressAtInspection: number;
  paymentType?: string;
  comments?: string;
}

interface UpdateInspectionInput extends Partial<CreateInspectionInput> {}

const mapDbToInspection = (row: any): Inspection => ({
  id: row.id,
  projectId: row.project_id,
  projectTitle: row.project?.title || null,
  phaseId: row.phase_id,
  phaseName: row.phase?.name || null,
  date: row.date,
  inspector: row.inspector,
  status: row.status,
  progressAtInspection: row.progress_at_inspection,
  paymentType: row.payment_type,
  comments: row.comments,
  documents: row.documents,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useInspectionsHex(filters?: { projectId?: string; status?: string }) {
  const queryClient = useQueryClient();

  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ["inspections-hex", filters],
    queryFn: async () => {
      let query = supabase
        .from("inspections")
        .select(`
          *,
          project:projects(title),
          phase:project_phases(name)
        `);

      if (filters?.projectId) {
        query = query.eq("project_id", filters.projectId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDbToInspection);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateInspectionInput) => {
      const { data, error } = await supabase
        .from("inspections")
        .insert({
          project_id: input.projectId,
          phase_id: input.phaseId,
          date: input.date,
          inspector: input.inspector,
          status: input.status || "scheduled",
          progress_at_inspection: input.progressAtInspection,
          payment_type: input.paymentType,
          comments: input.comments,
        })
        .select(`
          *,
          project:projects(title),
          phase:project_phases(name)
        `)
        .single();

      if (error) throw error;
      return mapDbToInspection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections-hex"] });
      toast.success("Inspection créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: UpdateInspectionInput & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (input.projectId !== undefined) updateData.project_id = input.projectId;
      if (input.phaseId !== undefined) updateData.phase_id = input.phaseId;
      if (input.date !== undefined) updateData.date = input.date;
      if (input.inspector !== undefined) updateData.inspector = input.inspector;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.progressAtInspection !== undefined) updateData.progress_at_inspection = input.progressAtInspection;
      if (input.paymentType !== undefined) updateData.payment_type = input.paymentType;
      if (input.comments !== undefined) updateData.comments = input.comments;

      const { data, error } = await supabase
        .from("inspections")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          project:projects(title),
          phase:project_phases(name)
        `)
        .single();

      if (error) throw error;
      return mapDbToInspection(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections-hex"] });
      toast.success("Inspection mise à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inspections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections-hex"] });
      toast.success("Inspection supprimée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const approveInspectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("inspections")
        .update({ status: "approved" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections-hex"] });
      toast.success("Inspection approuvée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const rejectInspectionMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from("inspections")
        .update({ status: "rejected", comments: reason })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspections-hex"] });
      toast.success("Inspection rejetée");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    inspections,
    isLoading,
    error,
    createInspection: createMutation.mutateAsync,
    updateInspection: updateMutation.mutateAsync,
    deleteInspection: deleteMutation.mutateAsync,
    approveInspection: approveInspectionMutation.mutateAsync,
    rejectInspection: rejectInspectionMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useInspectionHex(id: string | undefined) {
  const { data: inspection, isLoading, error } = useQuery({
    queryKey: ["inspection-hex", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("inspections")
        .select(`
          *,
          project:projects(title),
          phase:project_phases(name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return mapDbToInspection(data);
    },
    enabled: !!id,
  });

  return { inspection, isLoading, error };
}
