/**
 * UniversalDocumentViewer
 * Visionneuse unique réutilisable dans tous les modules :
 * projets, organisations, matériaux, appels d'offres, DQE (besoins, devis, factures),
 * parseur / importateur / uploader.
 *
 * - Aperçu PDF / image / vidéo / audio / texte
 * - Mode proxy (blob:) : l'URL de stockage n'est jamais exposée dans le DOM
 * - Consultation AVANT mise à jour (fichier local ou distant)
 * - Changement de statut directement depuis la visionneuse
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, Loader2, ShieldCheck, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getDocumentService } from '@/application/services/DocumentService';
import { MimeIcon } from '@/components/documents/hub/MimeIcon';
import { formatBytes, getPreviewKind } from '@/components/documents/hub/types';
import {
  DocumentViewerOptions,
  VIEWER_STATUS_OPTIONS,
  ViewableDocument,
  viewerStatusLabel,
} from './types';

interface Props extends DocumentViewerOptions {
  document: ViewableDocument | null;
  open: boolean;
  onClose: () => void;
}

export function UniversalDocumentViewer({
  document: doc,
  open,
  onClose,
  proxy = true,
  allowStatusChange = true,
  onStatusChange,
  onStatusChanged,
  onDelete,
  resolveBlobUrl,
}: Props) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const [savingStatus, setSavingStatus] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const isProxy = proxy && doc?.source !== 'local';
  const kind = useMemo(() => getPreviewKind(doc?.mimeType), [doc?.mimeType]);

  useEffect(() => {
    setStatus(doc?.status ?? 'draft');
  }, [doc?.id, doc?.status]);

  useEffect(() => {
    let cancelled = false;
    let created: string | null = null;
    setTextContent(null);

    async function load() {
      setError(null);
      if (!doc) return;

      // Fichier local (avant upload / mise à jour)
      if (doc.file) {
        created = URL.createObjectURL(doc.file);
        if (!cancelled) setDisplayUrl(created);
        return;
      }
      if (!doc.fileUrl) {
        setDisplayUrl(null);
        return;
      }
      if (!isProxy) {
        setDisplayUrl(doc.fileUrl);
        return;
      }
      setLoading(true);
      try {
        let url: string | null = null;
        if (resolveBlobUrl) {
          url = await resolveBlobUrl(doc);
        } else {
          const res = await fetch(doc.fileUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          created = URL.createObjectURL(blob);
          url = created;
        }
        if (!cancelled) setDisplayUrl(url);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Impossible de charger le document');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (open) load();
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [doc, isProxy, open, resolveBlobUrl]);

  // Aperçu texte / csv / json
  useEffect(() => {
    if (!open || !displayUrl || kind !== 'text') return;
    let cancelled = false;
    fetch(displayUrl)
      .then((r) => r.text())
      .then((t) => !cancelled && setTextContent(t.slice(0, 200_000)))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [displayUrl, kind, open]);

  const triggerDownload = useCallback(() => {
    if (!displayUrl || !doc) return;
    const a = window.document.createElement('a');
    a.href = displayUrl;
    a.download = doc.fileName ?? doc.title;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  }, [displayUrl, doc]);

  const handleStatusChange = async (next: string) => {
    if (!doc?.id) {
      setStatus(next);
      return;
    }
    const previous = status;
    setStatus(next);
    setSavingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(doc.id, next);
      } else {
        await getDocumentService().updateDocument(doc.id, { status: next as never });
      }
      toast.success(`Statut mis à jour : ${viewerStatusLabel(next)}`);
      onStatusChanged?.(doc.id, next);
    } catch (e: any) {
      setStatus(previous);
      toast.error(e?.message ?? 'Changement de statut impossible');
    } finally {
      setSavingStatus(false);
    }
  };

  if (!doc) return null;

  const contextBadges = Object.entries(doc.context ?? {}).filter(([, v]) => !!v);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[760px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MimeIcon mime={doc.mimeType} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <SheetTitle className="truncate text-base">{doc.title}</SheetTitle>
                <SheetDescription className="truncate text-xs">
                  {doc.fileName ?? 'Document'}
                  {doc.source === 'local' && ' · aperçu avant enregistrement'}
                </SheetDescription>
              </div>
              {isProxy && (
                <span
                  title="Accès sécurisé via passerelle — l'URL de stockage n'est pas exposée"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  <ShieldCheck className="h-3 w-3" /> Proxy
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {doc.documentType && <Badge variant="secondary">{doc.documentType}</Badge>}
              {doc.category && <Badge variant="outline">{doc.category}</Badge>}
              <Badge variant="outline">{viewerStatusLabel(status)}</Badge>
              {contextBadges.map(([k, v]) => (
                <Badge key={k} variant="outline">
                  {v}
                </Badge>
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden bg-muted/20">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement sécurisé du document…
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-8 text-sm text-destructive">
                {error}
              </div>
            ) : displayUrl ? (
              kind === 'pdf' ? (
                <iframe src={displayUrl} title={doc.title} className="h-full w-full border-0" />
              ) : kind === 'image' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <img
                    src={displayUrl}
                    alt={doc.title}
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
              ) : kind === 'text' ? (
                <pre className="h-full overflow-auto p-4 text-xs leading-relaxed">
                  {textContent ?? 'Chargement…'}
                </pre>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <MimeIcon mime={doc.mimeType} className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aperçu direct indisponible pour ce format ({doc.mimeType ?? 'inconnu'}).
                  </p>
                  <Button onClick={triggerDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le fichier
                  </Button>
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                Aucun fichier attaché à ce document.
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card px-6 py-3">
            <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Taille</dt>
                <dd className="font-medium">{formatBytes(doc.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type MIME</dt>
                <dd className="truncate font-medium">{doc.mimeType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Créé le</dt>
                <dd className="font-medium">
                  {doc.createdAt ? new Date(doc.createdAt).toLocaleString('fr-FR') : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Mis à jour</dt>
                <dd className="font-medium">
                  {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString('fr-FR') : '—'}
                </dd>
              </div>
            </dl>

            {doc.description && (
              <p className="mt-2 text-xs text-muted-foreground">{doc.description}</p>
            )}

            <Separator className="my-3" />

            <div className="flex flex-wrap items-center justify-between gap-2">
              {allowStatusChange && doc.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Statut</span>
                  <Select value={status} onValueChange={handleStatusChange} disabled={savingStatus}>
                    <SelectTrigger className="h-8 w-[190px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VIEWER_STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {savingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                </div>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                {displayUrl && !isProxy && (
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
                      onDelete(doc);
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
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default UniversalDocumentViewer;
