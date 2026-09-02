/**
 * MultiSelectCombobox — sélection multiple filtrante avec badges.
 * Utilisé pour les attributaires d'un contrat (groupements d'entreprises).
 */
import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectComboboxProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Affiche les badges de sélection sous le déclencheur (défaut : true). */
  showBadges?: boolean;
  /** Nombre de badges affichés avant repli « +N » (défaut : 3). */
  maxVisibleBadges?: number;
  /** Hauteur compacte alignée sur les champs de formulaire denses. */
  size?: 'default' | 'sm';
}

export const MultiSelectCombobox: React.FC<MultiSelectComboboxProps> = ({
  values,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  emptyLabel = 'Aucun résultat',
  disabled,
  className,
  showBadges = true,
  maxVisibleBadges = 3,
  size = 'default',
}) => {
  const [open, setOpen] = React.useState(false);

  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);

  const selected = options.filter((o) => values.includes(o.value));
  const visibleBadges = selected.slice(0, maxVisibleBadges);
  const hiddenBadgeCount = selected.length - visibleBadges.length;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn('w-full justify-between font-normal', size === 'sm' && 'h-9 text-xs')}
          >
            <span className={cn('truncate', values.length === 0 && 'text-muted-foreground')}>
              {values.length === 0
                ? placeholder
                : `${values.length} sélectionné${values.length > 1 ? 's' : ''}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.description ?? ''}`}
                    onSelect={() => toggle(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        values.includes(option.value) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="flex flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showBadges && visibleBadges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {visibleBadges.map((option) => (
            <Badge key={option.value} variant="secondary" className="max-w-full gap-1 text-[11px]">
              <span className="max-w-[12rem] truncate">{option.label}</span>
              <button
                type="button"
                aria-label={`Retirer ${option.label}`}
                onClick={() => toggle(option.value)}
                className="rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {hiddenBadgeCount > 0 && <Badge variant="outline" className="text-[11px]">+{hiddenBadgeCount}</Badge>}
        </div>
      )}
    </div>
  );
};

export default MultiSelectCombobox;
