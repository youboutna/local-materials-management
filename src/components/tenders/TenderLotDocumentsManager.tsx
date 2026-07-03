/**
 * TenderLotDocumentsManager
 * CRUD complet documents attachés à un lot (ou à tous les lots si lotId = null).
 */
import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, Trash2, Pencil, ExternalLink, Loader2, Plus } from 'lucide-react';
import {
  useTenderLotDocuments,
  useCreateTenderLotDocument,
  useUpdateTenderLotDocument,
  useDeleteTenderLotDocument,
  useUploadTenderLotFile,
  TenderLotDocumentRecord,
} from '@/hooks/hexagonal/useTenderLotDocumentsHex';

const CATEGORIES = [
  { value: 'administrative', label: 'Administratif' },
  { value: 'technical', label: 'Technique' },
  { value: 'financial', label: 'Financier' },
  { value: 'other', label: 'Autre' },
];

interface Props {
  tenderId: string;
  /** null = documents communs à tous les lots ; string = lot spécifique */
  lotId: string | null;
  /** libellé affiché dans le dialog */
  scopeLabel: string;
  readOnly?: boolean;
}

const TenderLotDocumentsManager: React.FC<Props> = ({ tenderId, lotId, scopeLabel, readOnly }) => {
  const { data: allDocs = [], isLoading } = useTenderLotDocuments(tenderId);
  const createDoc = useCreateTenderLotDocument(tenderId);
  const updateDoc = useUpdateTenderLotDocument(tenderId);
  const deleteDoc = useDeleteTenderLotDocument(tenderId);
  const uploadFile = useUploadTenderLotFile();

  const docs = useMemo(
    () => allDocs.filter((d) => (lotId ? d.lotId === lotId : d.lotId === null)),
    [allDocs, lotId]
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenderLotDocumentRecord | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'administrative',
    fileUrl: '',
    fileName: '',
    fileSize: null as number | null,
    mimeType: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: 'administrative',
      fileUrl: '',
      fileName: '',
      fileSize: null,
      mimeType: '',
    });
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (doc: TenderLotDocumentRecord) => {
    setEditing(doc);
    setForm({
      title: doc.title,
      description: doc.description ?? '',
      category: doc.category ?? 'other',
      fileUrl: doc.fileUrl,
      fileName: doc.fileName ?? '',
      fileSize: doc.fileSize,
      mimeType: doc.mimeType ?? '',
    });
    setDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { publicUrl } = await uploadFile.mutateAsync({ tenderId, file });
    setForm((f) => ({
      ...f,
      fileUrl: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      title: f.title || file.name,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.fileUrl) return;
    if (editing) {
      await updateDoc.mutateAsync({
        id: editing.id,
        updates: {
          title: form.title,
          description: form.description || null,
          category: form.category,
          fileUrl: form.fileUrl,
          fileName: form.fileName || null,
          fileSize: form.fileSize,
          mimeType: form.mimeType || null,
        },
      });
    } else {
      await createDoc.mutateAsync({
        tenderId,
        lotId,
        title: form.title,
        description: form.description || null,
        category: form.category,
        fileUrl: form.fileUrl,
        fileName: form.fileName || null,
        fileSize: form.fileSize,
        mimeType: form.mimeType || null,
      });
    }
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-primary" />
          Documents ({docs.length})
          <span className="text-xs text-muted-foreground font-normal">— {scopeLabel}</span>
        </Label>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={openCreate} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-3 text-center border rounded-lg border-dashed">
          Aucun document
        </p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/30"
            >
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {doc.category && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      {CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                    </Badge>
                  )}
                  {doc.fileName && <span className="truncate">{doc.fileName}</span>}
                  {doc.fileSize && (
                    <span>{(doc.fileSize / 1024).toFixed(0)} Ko</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {doc.fileUrl && (
                  <Button size="icon" variant="ghost" asChild>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" title="Ouvrir">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {!readOnly && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(doc)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteDoc.mutate(doc.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Modifier le document' : 'Ajouter un document'} — {scopeLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fichier {editing && '(laisser vide pour conserver)'}</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadFile.isPending}
                  className="gap-2"
                >
                  {uploadFile.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choisir un fichier
                </Button>
                {form.fileName && (
                  <span className="text-sm text-muted-foreground truncate">{form.fileName}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titre du document"
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.fileUrl || createDoc.isPending || updateDoc.isPending}
            >
              {(createDoc.isPending || updateDoc.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenderLotDocumentsManager;
