/**
 * DataPagination — pagination mutualisée, responsive et accessible.
 * Affiche un résumé de plage, des numéros de page (repliés sur mobile),
 * les sauts première/dernière page et un sélecteur de taille de page.
 */
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface Props {
  /** Page courante (base 0). */
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

const windowed = (current: number, total: number): number[] => {
  const max = 5;
  if (total <= max) return Array.from({ length: total }, (_, i) => i);
  const start = Math.max(0, Math.min(current - 2, total - max));
  return Array.from({ length: max }, (_, i) => start + i);
};

export const DataPagination: React.FC<Props> = ({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  itemLabel,
  className,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const from = totalItems === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(totalItems, (safePage + 1) * pageSize);
  const pages = windowed(safePage, totalPages);

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <span className="tabular-nums">
          {from}–{to} / {totalItems}
          {itemLabel ? ` ${itemLabel}` : ''}
        </span>
        {onPageSizeChange && (
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-7 w-[104px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="hidden h-7 w-7 sm:inline-flex"
          disabled={safePage === 0}
          onClick={() => onPageChange(0)}
          aria-label="Première page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={safePage === 0}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === safePage ? 'default' : 'ghost'}
              size="icon"
              className="h-7 w-7 text-xs tabular-nums"
              onClick={() => onPageChange(p)}
              aria-current={p === safePage ? 'page' : undefined}
            >
              {p + 1}
            </Button>
          ))}
        </div>
        <span className="px-1 tabular-nums sm:hidden">
          {safePage + 1} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={safePage >= totalPages - 1}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Page suivante"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="hidden h-7 w-7 sm:inline-flex"
          disabled={safePage >= totalPages - 1}
          onClick={() => onPageChange(totalPages - 1)}
          aria-label="Dernière page"
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default DataPagination;
