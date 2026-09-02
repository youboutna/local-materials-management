/**
 * src/components/boq/DocumentContextSummary.tsx
 * Rappel compact (lecture seule) de la configuration du document DQE :
 * périmètre WBS, classification par défaut, responsable, référentiels et
 * profil fiscal. Affiché dans les dialogues d'import et de calcul métré afin
 * que l'utilisateur enrichisse ses lignes en connaissance du contexte.
 *
 * Composant purement présentationnel — aucune logique métier.
 */
import { Badge } from '@/components/ui/badge';
import { Settings2 } from 'lucide-react';
import { T } from '@/components/i18n/T';

export interface DocumentContextItem {
  label: string;
  value: string;
}

interface Props {
  items: DocumentContextItem[];
  className?: string;
}

export function DocumentContextSummary({ items, className }: Props) {
  if (!items.length) return null;
  return (
    <div className={`rounded-md border bg-muted/20 p-2 ${className ?? ''}`}>
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <T k="dqe.context.title" fallback="Configuration du document" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Badge key={item.label} variant="outline" className="max-w-full whitespace-normal text-[11px] font-normal">
            <span className="text-muted-foreground">{item.label} :</span>
            <span className="ml-1 font-medium">{item.value}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
