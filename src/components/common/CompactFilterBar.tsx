/**
 * CompactFilterBar
 * Barre de filtres unifiée, compacte et responsive : une seule ligne sur desktop,
 * une ligne + tiroir « Avancé » sur mobile. Objectif : garder les résultats de la
 * recherche visibles sans scroller (aucune grande carte de filtres empilée).
 *
 * Couche présentation uniquement : aucune logique métier ici.
 */

import React, { ReactNode, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, RotateCcw, X, SlidersHorizontal } from 'lucide-react';
import Autocomplete, { AutocompleteOption } from '@/components/ui/autocomplete';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CompactFilterOption {
  value: string;
  label: string;
  secondaryLabel?: string;
  count?: number;
}

export interface CompactFilterField {
  key: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: CompactFilterOption[];
  /** Libellé de l'option « tout » (ajoutée si absente des options) */
  allLabel?: string;
  /** Repousse ce filtre dans le tiroir « Avancé » */
  advanced?: boolean;
}

export interface CompactFilterBarProps {
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters?: CompactFilterField[];
  /** Contrôles avancés additionnels (sliders, plages…) rendus dans le tiroir */
  advancedContent?: ReactNode;
  advancedActiveCount?: number;
  onReset?: () => void;
  resultCount?: number;
  totalCount?: number;
  /** Contenu libre aligné à droite (actions, compteurs) */
  trailing?: ReactNode;
  /** Contrôles additionnels rendus sur la même ligne (desktop) */
  inlineExtra?: ReactNode;
  /** Suggestions d'autocomplétion pour la recherche */
  autocompleteOptions?: AutocompleteOption[];
  onAutocompleteSelect?: (option: AutocompleteOption) => void;
  className?: string;
  sticky?: boolean;
  /** Recherche/pagination en cours : affiche l'indicateur « résultats en cours ». */
  isLoading?: boolean;
  /** Focus du premier résultat (raccourci Alt+Entrée). */
  onGoToFirstResult?: () => void;
  /** Active la sauvegarde de presets de filtres (clé de stockage locale). */
  presetsKey?: string;
  /** Persiste recherche / selects / tiroir avancé dans l'URL. */
  syncUrl?: boolean;
  /** Préfixe des paramètres d'URL (pages avec plusieurs barres). */
  urlNamespace?: string;
}

interface FilterPreset {
  name: string;
  search: string;
  values: Record<string, string>;
}

const PRESET_PREFIX = 'hadratech.filter-presets.';

const readPresets = (key?: string): FilterPreset[] => {
  if (!key) return [];
  try {
    const raw = localStorage.getItem(PRESET_PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as FilterPreset[]) : [];
  } catch {
    return [];
  }
};

const writePresets = (key: string, presets: FilterPreset[]) => {
  try {
    localStorage.setItem(PRESET_PREFIX + key, JSON.stringify(presets));
  } catch {
    /* stockage indisponible : les presets restent en mémoire */
  }
};


const ALL = 'all';

const FilterSelect: React.FC<{ filter: CompactFilterField; className?: string }> = ({
  filter,
  className,
}) => {
  const hasAll = filter.options.some((o) => o.value === ALL);
  return (
    <Select value={filter.value} onValueChange={filter.onChange}>
      <SelectTrigger
        aria-label={filter.label}
        className={cn('h-8 w-auto min-w-[130px] max-w-[200px] text-xs', className)}
      >
        <SelectValue placeholder={filter.placeholder ?? filter.label} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {!hasAll && <SelectItem value={ALL}>{filter.allLabel ?? filter.placeholder ?? filter.label}</SelectItem>}
        {filter.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex w-full items-center gap-2">
              <span className="truncate">{option.label}</span>
              {option.secondaryLabel && (
                <span className="text-xs text-muted-foreground">{option.secondaryLabel}</span>
              )}
              {option.count !== undefined && (
                <Badge variant="outline" className="ml-auto text-[10px]">
                  {option.count}
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const CompactFilterBar: React.FC<CompactFilterBarProps> = ({
  title,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  filters = [],
  advancedContent,
  advancedActiveCount = 0,
  onReset,
  resultCount,
  totalCount,
  trailing,
  inlineExtra,
  autocompleteOptions = [],
  onAutocompleteSelect,
  className,
  sticky = true,
}) => {
  const { t } = useLanguage();
  const placeholder = searchPlaceholder ?? t('auto.listtoolbar.rechercher');

  const inlineFilters = filters.filter((f) => !f.advanced);
  const drawerFilters = filters.filter((f) => f.advanced);

  const activeFilters = filters.filter((f) => f.value && f.value !== ALL);
  const activeCount =
    activeFilters.length + advancedActiveCount + (searchValue.trim() ? 1 : 0);
  const hasAdvanced = drawerFilters.length > 0 || Boolean(advancedContent);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onSearchSubmit?.();
    },
    [onSearchSubmit],
  );

  return (
    <div
      data-filters-card
      className={cn(
        'z-20 rounded-lg border border-border/60 bg-card/95 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80',
        sticky && 'sticky top-0',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex shrink-0 items-center gap-1.5 pl-1 text-xs font-medium text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{title ?? t('auto.responsivefilters.filtres')}</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </div>

        {onSearchChange && (
          <div className="relative min-w-[160px] flex-1 sm:max-w-[280px]">
            {autocompleteOptions.length > 0 ? (
              <Autocomplete
                value={searchValue}
                onChange={onSearchChange}
                onSelect={(option) => {
                  onSearchChange(option.label);
                  onSearchSubmit?.();
                  onAutocompleteSelect?.(option);
                }}
                options={autocompleteOptions}
                placeholder={placeholder}
                minSearchLength={1}
                maxSuggestions={6}
              />
            ) : (
              <>
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  className="h-8 pl-8 text-sm"
                />
              </>
            )}
          </div>
        )}

        {/* Filtres principaux : masqués sous sm, disponibles dans le tiroir */}
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {inlineFilters.map((filter) => (
            <FilterSelect key={filter.key} filter={filter} />
          ))}
          {inlineExtra}
        </div>


        {(hasAdvanced || inlineFilters.length > 0) && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn('h-8 gap-1.5 px-2 text-xs', !hasAdvanced && 'sm:hidden')}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">
                  {t('auto.compactfilterbar.avance')}
                </span>
                {advancedActiveCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    {advancedActiveCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] space-y-4">
              {/* Sur mobile, les filtres principaux sont proposés ici */}
              <div className="space-y-3 sm:hidden">
                {inlineFilters.map((filter) => (
                  <div key={filter.key} className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                    <FilterSelect filter={filter} className="w-full max-w-none" />
                  </div>
                ))}
                {inlineExtra}
              </div>

              {drawerFilters.length > 0 && (
                <div className="space-y-3">
                  {drawerFilters.map((filter) => (
                    <div key={filter.key} className="space-y-1.5">
                      <span className="text-xs font-medium text-muted-foreground">{filter.label}</span>
                      <FilterSelect filter={filter} className="w-full max-w-none" />
                    </div>
                  ))}
                </div>
              )}

              {advancedContent}
            </PopoverContent>
          </Popover>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={activeCount === 0}
            className="h-8 px-2 text-xs"
            title={t('auto.interactivemapfilters.reinitialiser')}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2 pr-1 text-xs text-muted-foreground">
          {trailing}
          {resultCount !== undefined && (
            <span>
              {resultCount}
              {totalCount !== undefined ? ` / ${totalCount}` : ''} {t('auto.responsivefilters.resultats')}
            </span>
          )}
        </div>
      </div>

      {(activeFilters.length > 0 || searchValue.trim().length > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 pl-1">
          {searchValue.trim().length > 0 && onSearchChange && (
            <Badge variant="secondary" className="h-6 gap-1 px-1.5 text-[11px]">
              <Search className="h-3 w-3" />
              {searchValue}
              <button
                type="button"
                aria-label="clear-search"
                className="ml-0.5 hover:text-destructive"
                onClick={() => onSearchChange('')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.map((filter) => {
            const option = filter.options.find((o) => o.value === filter.value);
            return (
              <Badge key={filter.key} variant="secondary" className="h-6 gap-1 px-1.5 text-[11px]">
                {option?.label ?? filter.value}
                <button
                  type="button"
                  aria-label={`clear-${filter.key}`}
                  className="ml-0.5 hover:text-destructive"
                  onClick={() => filter.onChange(ALL)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompactFilterBar;
