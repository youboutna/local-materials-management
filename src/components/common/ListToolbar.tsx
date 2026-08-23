import { useLanguage } from '@/contexts/LanguageContext';
/**
 * ListToolbar
 * Barre d'outils partagée (recherche libre + filtres rapides) pour les listes
 * contractuelles : Garanties bancaires, Assurances.
 * Couche présentation uniquement : le filtrage s'applique aux données déjà chargées.
 */

import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ExpiryFilter } from '@/lib/expiryUx';
import { cn } from '@/lib/utils';

const EXPIRY_FILTERS: { value: ExpiryFilter; label: string }[] = [
  { value: 'all', label: 'auto.listtoolbar.tous' },
  { value: 'active', label: 'auto.listtoolbar.actifs' },
  { value: 'expiring', label: 'auto.listtoolbar.expire_bientot' },
  { value: 'expired', label: 'auto.listtoolbar.expires' },
];

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  expiryFilter?: ExpiryFilter;
  onExpiryFilterChange?: (value: ExpiryFilter) => void;
  /** Filtres additionnels (Select de type, etc.) */
  children?: ReactNode;
  resultCount?: number;
  className?: string;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  expiryFilter,
  onExpiryFilterChange,
  children,
  resultCount,
  className,
}: ListToolbarProps) {
  const { t } = useLanguage();
  const placeholder = searchPlaceholder ?? t('auto.listtoolbar.rechercher');
  return (
    <div className={cn('mb-4 flex flex-wrap items-center gap-2', className)}>
      <div className="relative min-w-[16rem] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-8"
          aria-label={placeholder}
        />
      </div>

      {expiryFilter && onExpiryFilterChange && (
        <div className="flex flex-wrap items-center gap-1">
          {EXPIRY_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={expiryFilter === f.value ? 'default' : 'outline'}
              onClick={() => onExpiryFilterChange(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      )}

      {children}

      {typeof resultCount === 'number' && (
        <span className="ml-auto text-sm text-muted-foreground">{resultCount} résultat(s)</span>
      )}
    </div>
  );
}

export default ListToolbar;
