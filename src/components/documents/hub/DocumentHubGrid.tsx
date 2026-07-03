import { motion } from 'framer-motion';
import { Eye, Download, MoreHorizontal, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentItem, formatBytes } from './types';
import { MimeIcon } from './MimeIcon';

interface Props {
  items: DocumentItem[];
  categoryLabels?: Record<string, string>;
  onPreview: (item: DocumentItem) => void;
  onDelete?: (item: DocumentItem) => void;
}

export function DocumentHubGrid({ items, categoryLabels, onPreview, onDelete }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {items.map((item, idx) => {
        const catLabel = item.category ? categoryLabels?.[item.category] ?? item.category : null;
        const facetBadges = Object.entries(item.facets)
          .filter(([, v]) => !!v)
          .slice(0, 2);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(idx * 0.015, 0.15) }}
          >
            <Card className="group flex h-full flex-col overflow-hidden border-border/60 transition-all hover:border-primary/40 hover:shadow-md">
              <button
                onClick={() => onPreview(item)}
                className="flex items-start gap-3 p-4 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MimeIcon mime={item.mimeType} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-foreground">{item.title}</div>
                  {item.fileName && item.fileName !== item.title && (
                    <div className="truncate text-xs text-muted-foreground">{item.fileName}</div>
                  )}
                </div>
              </button>

              <div className="flex flex-wrap gap-1.5 px-4">
                {catLabel && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {catLabel}
                  </Badge>
                )}
                {facetBadges.map(([k, v]) => (
                  <Badge key={k} variant="outline" className="text-[10px] font-normal">
                    {v}
                  </Badge>
                ))}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>·</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => onPreview(item)}
                    aria-label="Aperçu"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {item.fileUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      asChild
                      aria-label="Télécharger"
                    >
                      <a href={item.fileUrl} download={item.fileName ?? undefined} target="_blank" rel="noreferrer">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {onDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Plus">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
