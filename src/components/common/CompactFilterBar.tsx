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
  isLoading = false,
  onGoToFirstResult,
  presetsKey,
  syncUrl = false,
  urlNamespace = '',
}) => {
  const { t } = useLanguage();
  const placeholder = searchPlaceholder ?? t('auto.listtoolbar.rechercher');

  const inlineFilters = filters.filter((f) => !f.advanced);
  const drawerFilters = filters.filter((f) => f.advanced);

  const activeFilters = filters.filter((f) => f.value && f.value !== ALL);
  const activeCount =
    activeFilters.length + advancedActiveCount + (searchValue.trim() ? 1 : 0);
  const hasAdvanced = drawerFilters.length > 0 || Boolean(advancedContent);

  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const searchWrapRef = React.useRef<HTMLDivElement>(null);
  const advancedTriggerRef = React.useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        if (e.altKey) onGoToFirstResult?.();
        else onSearchSubmit?.();
      }
    },
    [onSearchSubmit, onGoToFirstResult],
  );

  // === Raccourcis clavier globaux ===
  const focusSearch = useCallback(() => {
    searchWrapRef.current?.querySelector('input')?.focus();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
      // Ctrl/⌘+K ou « / » → focus recherche
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing)) {
        e.preventDefault();
        focusSearch();
        return;
      }
      if (!e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'f' && hasAdvanced) {
        e.preventDefault();
        setAdvancedOpen((v) => !v);
      } else if (k === 'r' && onReset) {
        e.preventDefault();
        onReset();
      } else if (e.key === 'Enter' && onGoToFirstResult) {
        e.preventDefault();
        onGoToFirstResult();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusSearch, hasAdvanced, onReset, onGoToFirstResult]);

  const shortcutsHint = [
    `${t('filters.shortcut.search') || 'Recherche'} : Ctrl+K · /`,
    hasAdvanced ? `${t('filters.shortcut.advanced') || 'Avancé'} : Alt+F` : null,
    onReset ? `${t('filters.shortcut.reset') || 'Réinitialiser'} : Alt+R` : null,
    onGoToFirstResult ? `${t('filters.shortcut.first') || 'Premier résultat'} : Alt+Entrée` : null,
  ]
    .filter(Boolean)
    .join(' | ');

  // === Persistance URL (recherche, selects, tiroir avancé) ===
  const [searchParams, setSearchParams] = useSearchParams();
  const paramName = useCallback((key: string) => `${urlNamespace}${key}`, [urlNamespace]);
  const hydratedRef = React.useRef(false);
  const filtersRef = React.useRef(filters);
  filtersRef.current = filters;

  React.useEffect(() => {
    if (!syncUrl || hydratedRef.current) return;
    hydratedRef.current = true;
    const q = searchParams.get(paramName('q'));
    if (q && onSearchChange && q !== searchValue) onSearchChange(q);
    filtersRef.current.forEach((f) => {
      const v = searchParams.get(paramName(f.key));
      if (v && v !== f.value) f.onChange(v);
    });
    if (searchParams.get(paramName('adv')) === '1') setAdvancedOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncUrl]);

  const filterSignature = filters.map((f) => `${f.key}=${f.value}`).join('&');
  React.useEffect(() => {
    if (!syncUrl || !hydratedRef.current) return;
    const next = new URLSearchParams(window.location.search);
    if (searchValue.trim()) next.set(paramName('q'), searchValue);
    else next.delete(paramName('q'));
    filtersRef.current.forEach((f) => {
      if (f.value && f.value !== ALL) next.set(paramName(f.key), f.value);
      else next.delete(paramName(f.key));
    });
    if (advancedOpen) next.set(paramName('adv'), '1');
    else next.delete(paramName('adv'));
    const current = window.location.search.replace(/^\?/, '');
    if (next.toString() !== current) setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncUrl, searchValue, filterSignature, advancedOpen]);

  // === Presets de filtres ===
  const [presets, setPresets] = React.useState<FilterPreset[]>(() => readPresets(presetsKey));
  const [presetName, setPresetName] = React.useState('');

  const savePreset = () => {
    if (!presetsKey) return;
    const name = presetName.trim() || `${t('auto.responsivefilters.filtres')} ${presets.length + 1}`;
    const preset: FilterPreset = {
      name,
      search: searchValue,
      values: Object.fromEntries(filters.map((f) => [f.key, f.value])),
    };
    const next = [...presets.filter((p) => p.name !== name), preset];
    setPresets(next);
    writePresets(presetsKey, next);
    setPresetName('');
  };

  const applyPreset = (preset: FilterPreset) => {
    onSearchChange?.(preset.search ?? '');
    filters.forEach((f) => {
      const v = preset.values?.[f.key];
      if (v !== undefined && v !== f.value) f.onChange(v);
    });
    onSearchSubmit?.();
  };

  const deletePreset = (name: string) => {
    if (!presetsKey) return;
    const next = presets.filter((p) => p.name !== name);
    setPresets(next);
    writePresets(presetsKey, next);
  };


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
          <div ref={searchWrapRef} className="relative min-w-[160px] flex-1 sm:max-w-[280px]">
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
                  title={shortcutsHint}
                  className="h-8 pl-8 pr-7 text-sm"
                />
                {isLoading && (
                  <Loader2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
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

        {presetsKey && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('filters.presets') || 'Presets'}</span>
                {presets.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">{presets.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(20rem,calc(100vw-2rem))] space-y-3">
              <div className="space-y-1">
                {presets.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t('filters.presets.empty') || 'Aucun preset enregistré.'}
                  </p>
                )}
                {presets.map((preset) => (
                  <div key={preset.name} className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 flex-1 justify-start px-2 text-xs"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                    <button
                      type="button"
                      aria-label={`delete-preset-${preset.name}`}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => deletePreset(preset.name)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 border-t pt-2">
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t('filters.presets.name') || 'Nom du preset'}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-2 text-xs" onClick={savePreset}>
                  {t('filters.presets.save') || 'Enregistrer'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {(hasAdvanced || inlineFilters.length > 0) && (
          <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button
                ref={advancedTriggerRef}
                variant="outline"
                size="sm"
                title={shortcutsHint}
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
          {isLoading ? (
            <span className="flex items-center gap-1" role="status" aria-live="polite">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">
                {t('filters.loading') || 'Résultats en cours…'}
              </span>
            </span>
          ) : (
            resultCount !== undefined && (
              <span aria-live="polite">
                {resultCount}
                {totalCount !== undefined ? ` / ${totalCount}` : ''} {t('auto.responsivefilters.resultats')}
              </span>
            )
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
