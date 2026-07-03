import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentFacetDef } from './types';

interface Props {
  facets: DocumentFacetDef[];
  /** selected values per facet key */
  selected: Record<string, Set<string>>;
  onToggle: (key: string, value: string, multi: boolean) => void;
  onClear: () => void;
}

export function DocumentHubSidebar({ facets, selected, onToggle, onClear }: Props) {
  const anySelected = Object.values(selected).some((s) => s.size > 0);

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card/20 md:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Filtres
            </h4>
            {anySelected && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClear}>
                Réinitialiser
              </Button>
            )}
          </div>

          {facets.map((facet, idx) => {
            const sel = selected[facet.key] ?? new Set<string>();
            if (facet.options.length === 0) return null;
            return (
              <div key={facet.key}>
                {idx > 0 && <Separator className="my-3" />}
                <div className="mb-2 text-xs font-medium text-foreground">{facet.label}</div>
                <div className="space-y-1">
                  {facet.options.map((opt) => {
                    const active = sel.has(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => onToggle(facet.key, opt.value, facet.multi ?? true)}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {typeof opt.count === 'number' && (
                          <span className="ml-2 text-xs tabular-nums opacity-70">{opt.count}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
