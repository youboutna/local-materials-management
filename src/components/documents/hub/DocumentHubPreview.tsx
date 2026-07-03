import { Download, ExternalLink, Trash2 } from 'lucide-react';
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
import { DocumentItem, formatBytes, getPreviewKind } from './types';
import { MimeIcon } from './MimeIcon';

interface Props {
  item: DocumentItem | null;
  categoryLabels?: Record<string, string>;
  onClose: () => void;
  onDelete?: (item: DocumentItem) => void;
}

export function DocumentHubPreview({ item, categoryLabels, onClose, onDelete }: Props) {
  if (!item) return null;
  const kind = getPreviewKind(item.mimeType);
  const catLabel = item.category ? categoryLabels?.[item.category] ?? item.category : null;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full p-0 sm:max-w-[720px]"
      >
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
            {item.fileUrl ? (
              kind === 'pdf' ? (
                <iframe
                  src={item.fileUrl}
                  title={item.title}
                  className="h-full w-full border-0"
                />
              ) : kind === 'image' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <img
                    src={item.fileUrl}
                    alt={item.title}
                    className="max-h-full max-w-full rounded-md object-contain shadow-md"
                  />
                </div>
              ) : kind === 'video' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <video src={item.fileUrl} controls className="max-h-full max-w-full rounded-md" />
                </div>
              ) : kind === 'audio' ? (
                <div className="flex h-full items-center justify-center p-4">
                  <audio src={item.fileUrl} controls />
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                  <MimeIcon mime={item.mimeType} className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Aperçu indisponible pour ce type de fichier.
                  </p>
                  <Button asChild>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer" download={item.fileName ?? undefined}>
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger le fichier
                    </a>
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
                <dd className="font-medium truncate">{item.mimeType ?? '—'}</dd>
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
              {item.fileUrl && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      Ouvrir
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={item.fileUrl} download={item.fileName ?? undefined} target="_blank" rel="noreferrer">
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Télécharger
                    </a>
                  </Button>
                </>
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
