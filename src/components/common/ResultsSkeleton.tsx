/**
 * ResultsSkeleton — état de chargement standard des listes/tables filtrées.
 * Couche présentation uniquement.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  rows?: number;
  /** Nombre de colonnes simulées (mode table). */
  columns?: number;
  variant?: 'rows' | 'cards';
  className?: string;
}

export const ResultsSkeleton: React.FC<Props> = ({ rows = 5, columns = 4, variant = 'rows', className }) => {
  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)} aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'max-w-[40%]')} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ResultsSkeleton;
