/**
 * TenderLotDocumentsManager
 * CRUD documents attachés à un ou plusieurs lots d'un tender.
 * - lotId=null  ⇒ vue "communs à tous les lots" (documents sans lot_ids)
 * - lotId=UUID ⇒ vue d'un lot précis (documents contenant ce lot dans lot_ids)
 * Le dialog propose une case à cocher par lot pour lier le document à plusieurs lots.
 */
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { FileText, Upload, Trash2, Pencil, ExternalLink, Loader2, Plus, CheckCircle2 } from 'lucide-react';
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

export interface LotOption {
  id: string;
  number: number;
  title: string;
}

interface Props {
  tenderId: string;
  /** null = documents communs (aucun lot lié) ; string = filtre sur ce lot */
  lotId: string | null;
  /** libellé affiché dans le dialog */
  scopeLabel: string;
  /** Liste de tous les lots disponibles pour le multi-linking */
  availableLots?: LotOption[];
  readOnly?: boolean;
}

const TenderLotDocumentsManager: React.FC<Props> = ({
  tenderId,
  lotId,
  scopeLabel,
  availableLots = [],
  readOnly,
}) => {
  const { data: allDocs = [], isLoading } = useTenderLotDocuments(tenderId);
  const createDoc = useCreateTenderLotDocument(tenderId);
  const updateDoc = useUpdateTenderLotDocument(tenderId);
  const deleteDoc = useDeleteTenderLotDocument(tenderId);
  const uploadFile = useUploadTenderLotFile();

  const docs = useMemo(
    () =>
      allDocs.filter((d) => {
        const ids = d.lotIds ?? [];
        if (lotId === null) return ids.length === 0; // vue "communs"
        return ids.includes(lotId);
      }),
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
    lotIds: [] as string[],
    common: false,
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
      lotIds: lotId ? [lotId] : [],
      common: lotId === null,
    });
    setEditing(null);
  };

  useEffect(() => {
    // reset scope-dependent defaults when dialog opens fresh
    if (dialogOpen && !editing) {
      setForm((f) => ({
        ...f,
        lotIds: lotId ? [lotId] : [],
        common: lotId === null,
      }));
    }
  }, [dialogOpen, editing, lotId]);

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
      lotIds: doc.lotIds ?? [],
      common: (doc.lotIds ?? []).length === 0,
    });
    setDialogOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { publicUrl } = await uploadFile.mutateAsync({ tenderId, file });
      setForm((f) => ({
        ...f,
        fileUrl: publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        title: f.title || file.name,
      }));
    } catch {
      // toast handled by hook
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleLot = (id: string) => {
    setForm((f) => {
      const has = f.lotIds.includes(id);
      const next = has ? f.lotIds.filter((x) => x !== id) : [...f.lotIds, id];
      return { ...f, lotIds: next, common: next.length === 0 };
    });
  };

  const toggleCommon = (checked: boolean) => {
    setForm((f) => ({ ...f, common: checked, lotIds: checked ? [] : f.lotIds }));
  };

  const canSubmit =
    !!form.title &&
    !!form.fileUrl &&
    (form.common || form.lotIds.length > 0) &&
    !createDoc.isPending &&
    !updateDoc.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const effectiveLotIds = form.common ? [] : form.lotIds;
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
          lotIds: effectiveLotIds,
        },
      });
    } else {
      await createDoc.mutateAsync({
        tenderId,
        lotIds: effectiveLotIds,
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  {doc.category && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      {CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                    </Badge>
                  )}
                  {(doc.lotIds ?? []).length === 0 ? (
                    <Badge variant="secondary" className="text-[10px] py-0">Commun</Badge>
                  ) : (
                    (doc.lotIds ?? []).map((id) => {
                      const lot = availableLots.find((l) => l.id === id);
                      return (
                        <Badge key={id} variant="outline" className="text-[10px] py-0">
                          Lot {lot?.number ?? '?'}
                        </Badge>
                      );
                    })
                  )}
                  {doc.fileName && <span className="truncate">{doc.fileName}</span>}
                  {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(0)} Ko</span>}
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  {form.fileUrl ? 'Remplacer' : 'Choisir un fichier'}
                </Button>
                {form.fileUrl && (
                  <span className="flex items-center gap-1 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="truncate max-w-[220px]">{form.fileName}</span>
                  </span>
                )}
              </div>
              {!form.fileUrl && !uploadFile.isPending && (
                <p className="text-xs text-muted-foreground">
                  Sélectionnez un fichier pour activer l'enregistrement.
                </p>
              )}
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
              <Label>Portée du document *</Label>
              <div className="flex items-center gap-2 p-2 rounded border">
                <Checkbox
                  id="scope-common"
                  checked={form.common}
                  onCheckedChange={(v) => toggleCommon(!!v)}
                />
                <Label htmlFor="scope-common" className="cursor-pointer text-sm font-normal">
                  Commun à tous les lots (non rattaché à un lot spécifique)
                </Label>
              </div>
              {!form.common && (
                <div className="space-y-1 max-h-56 overflow-y-auto border rounded p-2">
                  {availableLots.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Aucun lot disponible. Créez d'abord des lots ou cochez « Commun ».
                    </p>
                  ) : (
                    availableLots.map((lot) => (
                      <div key={lot.id} className="flex items-center gap-2 p-1 hover:bg-muted/40 rounded">
                        <Checkbox
                          id={`lot-${lot.id}`}
                          checked={form.lotIds.includes(lot.id)}
                          onCheckedChange={() => toggleLot(lot.id)}
                        />
                        <Label htmlFor={`lot-${lot.id}`} className="cursor-pointer text-sm font-normal flex-1">
                          <Badge variant="outline" className="mr-2">Lot {lot.number}</Badge>
                          {lot.title || <span className="text-muted-foreground italic">Sans titre</span>}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              )}
              {!form.common && form.lotIds.length === 0 && (
                <p className="text-xs text-destructive">Sélectionnez au moins un lot ou cochez « Commun ».</p>
              )}
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
            <Button onClick={handleSubmit} disabled={!canSubmit}>
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
