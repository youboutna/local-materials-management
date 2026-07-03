import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DocumentHubContract, UploadInput, formatBytes } from './types';
import { MimeIcon } from './MimeIcon';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: DocumentHubContract;
}

export function DocumentHubUpload({ open, onOpenChange, contract }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(
    contract.uploadCategoryOptions?.[0]?.value ?? null
  );
  const [extras, setExtras] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setCategory(contract.uploadCategoryOptions?.[0]?.value ?? null);
    setExtras({});
  };

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFile = useCallback((f: File | undefined | null) => {
    if (!f) return;
    setFile(f);
    setTitle((t) => t || f.name.replace(/\.[^.]+$/, ''));
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim() || !contract.onUpload) return;
    setBusy(true);
    try {
      const input: UploadInput = {
        file,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        extras,
      };
      await contract.onUpload(input);
      toast({ title: 'Document ajouté' });
      handleClose(false);
    } catch (err: any) {
      toast({
        title: 'Échec ajout',
        description: err?.message ?? 'Erreur lors de l\'ajout',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Déposez un fichier puis renseignez ses métadonnées.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!file ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">
                Glissez un fichier ici ou <span className="text-primary">parcourir</span>
              </div>
              <div className="text-xs text-muted-foreground">
                PDF, images, documents Office…
              </div>
              <input
                type="file"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MimeIcon mime={file.type} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{formatBytes(file.size)}</div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc-title">Titre</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du document"
              required
            />
          </div>

          {contract.uploadCategoryOptions && contract.uploadCategoryOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={category ?? undefined} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {contract.uploadCategoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {contract.renderExtraUploadFields?.({
            extras,
            setExtra: (key, value) => setExtras((p) => ({ ...p, [key]: value })),
          })}

          <div className="space-y-2">
            <Label htmlFor="doc-desc">Description</Label>
            <Textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optionnel)"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!file || !title.trim() || busy}>
              {busy ? 'Ajout…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
