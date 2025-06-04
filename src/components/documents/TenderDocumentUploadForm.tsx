import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const TENDER_CATEGORIES = [
  { value: "administrative", label: "Administratif" },
  { value: "technical", label: "Technique" },
  { value: "financial", label: "Financier" }
];

const TENDER_SUBCATEGORIES = [
  { value: "lettre_soumission", label: "Lettre de soumission" },
  { value: "pouvoir_signature", label: "Pouvoir de signature" },
  // ...add all subcategories you need
];

export default function TenderDocumentUploadForm({ projectId }: { projectId: string }) {
  const [subcategory, setSubcategory] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !category || !subcategory) return;

    setLoading(true);

    // 1. Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(`tender/${projectId}/${file.name}`, file);

    if (uploadError || !uploadData?.path) {
      alert("Erreur lors de l'upload du fichier");
      setLoading(false);
      return;
    }

    // 1. Insert into documents table
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert([
        {
          project_id: projectId,
          title,
          description,
          file_url: uploadData.path,
          document_type: "tender_documents",
          category,
          subcategory,
        }
      ])
      .select()
      .single();

    if (docError || !docData) {
      alert("Erreur lors de l'ajout du document");
      setLoading(false);
      return;
    }

    // 2. Insert into tender_documents table, linking to the document
    const { error: tenderDocError } = await supabase
      .from("tender_documents")
      .insert([
        {
          project_id: projectId,
          category,
          subcategory,
          is_required: true,
          is_submitted: true,
          status: "draft",
          document_id: docData.id, // <-- use the document's id here!
        }
      ]);

    if (tenderDocError) {
      alert("Erreur lors de la création du TenderDocument");
    } else {
      alert("Document ajouté !");
      setTitle("");
      setDescription("");
      setFile(null);
      setCategory("");
      setSubcategory("");
      // Optionally reset file input value here if needed
    }
    setLoading(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        placeholder="Titre du document"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <Textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />
      <Select value={category} onValueChange={setCategory} required>
        <SelectTrigger>
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          {TENDER_CATEGORIES.map(cat => (
            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={subcategory} onValueChange={setSubcategory} required>
        <SelectTrigger>
          <SelectValue placeholder="Sous-catégorie" />
        </SelectTrigger>
        <SelectContent>
          {TENDER_SUBCATEGORIES.map(sub => (
            <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
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
        {loading ? "Ajout en cours..." : "Ajouter"}
      </Button>
    </form>
  );
}