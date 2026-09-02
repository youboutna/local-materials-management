/**
 * DocumentPerimeter — périmètre WBS contrôlé d'un document DQE.
 * Le composant reste agnostique de la persistance : son parent fournit le DTO.
 */
import { useState } from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { WbsPhase } from '@/config/referentials/wbs/wbs.referential';
import { WbsScopeSelector, type WbsScopeValue } from './WbsScopeSelector';

interface Props {
  phases: WbsPhase[];
  value: WbsScopeValue;
  onChange: (value: WbsScopeValue) => void;
  disabled?: boolean;
}

export function DocumentPerimeter({ phases, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(true);
  const selectionCount = value.phaseIds.length + value.milestoneIds.length + value.taskIds.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border bg-muted/20">
      <div className="flex min-h-10 items-center justify-between gap-2 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <ListFilter className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate text-xs font-semibold">Périmètre du document</span>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {selectionCount > 0 ? `${selectionCount} sélectionné${selectionCount > 1 ? 's' : ''}` : 'Non restreint'}
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={open ? 'Réduire le périmètre' : 'Développer le périmètre'}>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="border-t px-3 py-3">
        <WbsScopeSelector phases={phases} value={value} onChange={onChange} disabled={disabled} />
      </CollapsibleContent>
    </Collapsible>
  );
}
