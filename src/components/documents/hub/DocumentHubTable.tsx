import { Eye, Download, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocumentItem, formatBytes } from './types';
import { MimeIcon } from './MimeIcon';

interface Props {
  items: DocumentItem[];
  facetKeys: { key: string; label: string }[];
  categoryLabels?: Record<string, string>;
  onPreview: (item: DocumentItem) => void;
  onDelete?: (item: DocumentItem) => void;
}

export function DocumentHubTable({ items, facetKeys, categoryLabels, onPreview, onDelete }: Props) {
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Nom</TableHead>
              <TableHead className="hidden md:table-cell">Catégorie</TableHead>
              {facetKeys.map((f) => (
                <TableHead key={f.key} className="hidden md:table-cell">
                  {f.label}
                </TableHead>
              ))}
              <TableHead className="hidden sm:table-cell text-right">Taille</TableHead>
              <TableHead className="hidden lg:table-cell">Ajouté le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const catLabel = item.category ? categoryLabels?.[item.category] ?? item.category : null;
              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <button
                      onClick={() => onPreview(item)}
                      className="flex items-center gap-2 text-left"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                        <MimeIcon mime={item.mimeType} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{item.title}</div>
                        {item.fileName && item.fileName !== item.title && (
                          <div className="truncate text-xs text-muted-foreground">
                            {item.fileName}
                          </div>
                        )}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {catLabel && (
                      <Badge variant="secondary" className="text-[10px]">
                        {catLabel}
                      </Badge>
                    )}
                  </TableCell>
                  {facetKeys.map((f) => (
                    <TableCell key={f.key} className="hidden md:table-cell text-xs text-muted-foreground">
                      {item.facets[f.key] ?? '—'}
                    </TableCell>
                  ))}
                  <TableCell className="hidden sm:table-cell text-right text-xs tabular-nums text-muted-foreground">
                    {formatBytes(item.fileSize)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onPreview(item)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {item.fileUrl && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
                          <a href={item.fileUrl} download={item.fileName ?? undefined} target="_blank" rel="noreferrer">
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
