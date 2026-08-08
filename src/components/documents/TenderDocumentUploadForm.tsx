import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { useStorageHex } from '@/hooks/hexagonal';
import { useLanguage } from "@/contexts/LanguageContext";
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

import { Document } from '@/dtos/entities/DocumentDTO';
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

export type DocumentType =
  | "inspection_report"
  | "location_photo"
  | "project_report"
  | "contract"
  | "supplier_info"
  | "task_assignment"
  | "employee_record"
  | "tender";

export type DocumentStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "archived";



const TENDER_CATEGORIES: { value: TenderCategory; labelKey: string }[] = [
  { value: "administrative", labelKey: "tender_category.administrative" },
  { value: "technical", labelKey: "tender_category.technical" },
  { value: "financial", labelKey: "tender_category.financial" }
];

const TENDER_SUBCATEGORIES: { value: TenderSubcategory; labelKey: string }[] = [
  { value: "lettre_soumission", labelKey: "tender_subcategory.lettre_soumission" },
  { value: "pouvoir_signature", labelKey: "tender_subcategory.pouvoir_signature" }
];

export default function TenderDocumentUploadForm({ projectId }: { projectId: string }) {
  const [subcategory, setSubcategory] = useState<TenderSubcategory | "">("");
  const [category, setCategory] = useState<TenderCategory | "">("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { uploadFile } = useStorageHex('tender-documents');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !category || !subcategory) return;

    setLoading(true);

    const folder = `tender/${projectId}`;
    
    try {
      const uploadData = await uploadFile({ file, folder });

      if (!uploadData?.path) {
        toast({ title: t("tender.alert.upload_error"), variant: "destructive" });
        setLoading(false);
        return;
      }

    // Fix: Use correct document_type that exists in the database schema
    const documentInsertObj = {
      project_id: projectId,
      title,
      description,
      file_url: uploadData.path,
      document_type: "contract" as const, // Using "contract" as it's a valid type for tender documents
    };

    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert(documentInsertObj)
      .select()
      .single();

    if (docError || !docData) {
      toast({ title: t("tender.alert.document_error"), variant: "destructive" });
      setLoading(false);
      return;
    }

    const tenderDocumentInsertObj = {
      project_id: projectId,
      category,
      subcategory: subcategory as TenderSubcategory,
      is_required: true,
      is_submitted: true,
      status: "draft" as DocumentStatus,
      document_id: docData.id,
    };

    const { error: tenderDocError } = await supabase
      .from("tender_documents")
      .insert([tenderDocumentInsertObj]);

    if (tenderDocError) {
      toast({ title: t("tender.alert.tenderdoc_error"), variant: "destructive" });
    } else {
      toast({ title: t("tender.alert.success") });
      setTitle("");
      setDescription("");
      setFile(null);
      setCategory("");
      setSubcategory("");
    }
    setLoading(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: t("tender.alert.upload_error"), variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        placeholder={t("tender.input.title")}
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <Textarea
        placeholder={t("tender.input.description")}
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <Select value={category} onValueChange={v => setCategory(v as TenderCategory)} required>
        <SelectTrigger>
          <SelectValue placeholder={t("tender.input.category")} />
        </SelectTrigger>
        <SelectContent>
          {TENDER_CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>{t(cat.labelKey)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={subcategory} onValueChange={v => setSubcategory(v as TenderSubcategory)} required>
        <SelectTrigger>
          <SelectValue placeholder={t("tender.input.subcategory")} />
        </SelectTrigger>
        <SelectContent>
          {TENDER_SUBCATEGORIES.map(sub => (
            <SelectItem key={sub.value} value={sub.value}>{t(sub.labelKey)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="file"
        accept="application/pdf,image/*"
        onChange={e => setFile(e.target.files?.[0] || null)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? t("tender.button.loading") : t("tender.button.add")}
      </Button>
    </form>
  );
}