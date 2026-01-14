/**
 * Hexagonal hooks for Tender Document Upload
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TenderCategory = "administrative" | "technical" | "financial";
export type TenderSubcategory =
  | "lettre_soumission"
  | "pouvoir_signature"
  | "acte_groupement"
  | "attestation_impot"
  | "attestation_cnss"
  | "attestation_non_faillite"
  | "renseignement_soumissionnaire"
  | "garantie_soumission";

export interface TenderDocumentUploadData {
  projectId: string;
  title: string;
  description: string;
  category: TenderCategory;
  subcategory: TenderSubcategory;
  file: File;
}

export function useUploadTenderDocumentHex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TenderDocumentUploadData) => {
      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(`tender/${data.projectId}/${data.file.name}`, data.file);

      if (uploadError || !uploadData?.path) {
        throw new Error('Upload failed');
      }

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          project_id: data.projectId,
          title: data.title,
          description: data.description,
          file_url: uploadData.path,
          document_type: "contract" as const
        })
        .select()
        .single();

      if (docError || !docData) {
        throw new Error('Document creation failed');
      }

      // Create tender document record
      const { error: tenderDocError } = await supabase
        .from("tender_documents")
        .insert([{
          project_id: data.projectId,
          category: data.category,
          subcategory: data.subcategory,
          is_required: true,
          is_submitted: true,
          status: "draft",
          document_id: docData.id
        }]);

      if (tenderDocError) {
        throw new Error('Tender document creation failed');
      }

      return docData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tender-documents', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.projectId] });
    }
  });
}
