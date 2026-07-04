import { useEffect, useState } from 'react';
import { Download, ExternalLink, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DocumentItem, DocumentHubContract, formatBytes, getPreviewKind } from './types';
import { MimeIcon } from './MimeIcon';

interface Props {
  item: DocumentItem | null;
  contract: DocumentHubContract;
  onClose: () => void;
  onDelete?: (item: DocumentItem) => void;
}

/**
 * Preview drawer.
 *
 * When contract.previewMode === 'proxy', the file is streamed through a blob URL so the
 * underlying storage URL is never exposed in the DOM (iframe src / anchor href).
 */
export function DocumentHubPreview({ item, contract, onClose, onDelete }: Props) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const proxy = contract.previewMode === 'proxy';

  useEffect(() => {
    let cancelled = false;
    let createdObjectUrl: string | null = null;

    async function load() {
      setError(null);
      if (!item?.fileUrl) {
        setDisplayUrl(null);
        return;
      }
      if (!proxy) {
        setDisplayUrl(item.fileUrl);
        return;
      }
      setLoadingBlob(true);
      try {
        let url: string | null = null;
        if (contract.resolveBlobUrl) {
          url = await contract.resolveBlobUrl(item);
        } else {
          const res = await fetch(item.fileUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          url = URL.createObjectURL(blob);
          createdObjectUrl = url;
        }
        if (!cancelled) setDisplayUrl(url);
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Impossible de charger le document');
      } finally {
        if (!cancelled) setLoadingBlob(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
    };
  }, [item, proxy, contract]);

  if (!item) return null;
  const kind = getPreviewKind(item.mimeType);
  const catLabel = item.category
    ? contract.categoryLabels?.[item.category] ?? item.category
    : null;

  const triggerDownload = () => {
    if (!displayUrl) return;
    const a = document.createElement('a');
    a.href = displayUrl;
    a.download = item.fileName ?? item.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[720px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MimeIcon mime={item.mimeType} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-base">{item.title}</SheetTitle>
                <SheetDescription className="truncate text-xs">
                  {item.fileName ?? 'Document'}
                </SheetDescription>
              </div>
              {proxy && (
                <span
                  title="Accès sécurisé via passerelle — l'URL de stockage n'est pas exposée"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <ShieldCheck className="h-3 w-3" /> Proxy
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {catLabel && <Badge variant="secondary">{catLabel}</Badge>}
              {Object.entries(item.facets)
                .filter(([, v]) => !!v)
                .map(([k, v]) => (
                  <Badge key={k} variant="outline">
                    {v}
                  </Badge>
                ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden bg-muted/20">
            {loadingBlob ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement sécurisé du document…
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-8 text-sm text-destructive">
                {error}
              </div>
            ) : displayUrl ? (
              kind === 'pdf' ? (
                <iframe src={displayUrl} title={item.title} className="h-full w-full border-0" />
              ) : kind === 'image' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <img
                    src={displayUrl}
                    alt={item.title}
                    className="max-h-full max-w-full rounded-md object-contain shadow-md"
                  />
                </div>
              ) : kind === 'video' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <video src={displayUrl} controls className="max-h-full max-w-full rounded-md" />
                </div>
              ) : kind === 'audio' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <audio src={displayUrl} controls />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <MimeIcon mime={item.mimeType} className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aperçu indisponible pour ce type de fichier.
                  </p>
                  <Button onClick={triggerDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le fichier
                  </Button>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                Fichier introuvable.
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card px-6 py-3">
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Taille</dt>
                <dd className="font-medium">{formatBytes(item.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type</dt>
                <dd className="truncate font-medium">{item.mimeType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Ajouté le</dt>
                <dd className="font-medium">
                  {new Date(item.createdAt).toLocaleString('fr-FR')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mis à jour</dt>
                <dd className="font-medium">
                  {new Date(item.updatedAt).toLocaleString('fr-FR')}
                </dd>
              </div>
            </dl>
            <Separator className="my-3" />
            <div className="flex items-center justify-end gap-2">
              {displayUrl && !proxy && (
                <Button variant="outline" size="sm" asChild>
                  <a href={displayUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1 h-3.5 w-3.5" />
                    Ouvrir
                  </a>
                </Button>
              )}
              {displayUrl && (
                <Button variant="outline" size="sm" onClick={triggerDownload}>
                  <Download className="mr-1 h-3.5 w-3.5" />
                  Télécharger
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    onDelete(item);
                    onClose();
                  }}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
