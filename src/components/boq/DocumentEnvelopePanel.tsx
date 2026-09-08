/**
 * src/components/boq/DocumentEnvelopePanel.tsx
 * Panneau de contexte « Enveloppe du document » : émetteur, destinataire,
 * référence, projet, validité, devise et normes Factur-X / EN 16931 extraits
 * par le parseur. Ces informations ne sont JAMAIS des lignes DQE.
 *
 * Responsive : une seule carte, grille 1 colonne (mobile) → 2 colonnes (≥ md),
 * repliable pour rester compacte sur petits écrans.
 */
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileText, Building2, Mail, Phone, MapPin, Send } from 'lucide-react';
import type { DqeEnvelope } from '@/application/services/boq/parsers/envelopeDetection';

interface Props {
  envelope: DqeEnvelope;
  className?: string;
}

export function DocumentEnvelopePanel({ envelope, className }: Props) {
  const [open, setOpen] = useState(true);
  const { emitter, receiver } = envelope;
  const refs: { label: string; value?: string | number }[] = [
    { label: 'N° document', value: envelope.documentNumber },
    { label: 'Date', value: envelope.documentDate },
    { label: 'Projet', value: envelope.projectCode },
    { label: 'Devise', value: envelope.currency },
    {
      label: 'Validité',
      value: envelope.validityDays
        ? `${envelope.validityDays} j${envelope.validityEndDate ? ` (jusqu'au ${envelope.validityEndDate})` : ''}`
        : undefined,
    },
    { label: 'Appel d’offres', value: envelope.tenderReference },
  ].filter((r) => r.value != null && String(r.value).trim());

  const hasContent = refs.length || emitter.name || receiver.name || envelope.standard;
  if (!hasContent) return null;

  return (
    <section className={`rounded-md border bg-muted/20 p-3 ${className ?? ''}`} aria-label="Enveloppe du document">
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Enveloppe du document {envelope.documentNumber ? `· ${envelope.documentNumber}` : ''}</span>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden="true" />
              {open ? 'Réduire' : 'Afficher'}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {([
              { icon: Building2, title: 'Émetteur', party: emitter },
              { icon: Send, title: 'Destinataire', party: receiver },
            ] as const).map(({ icon: Icon, title, party }) => (
              <div key={title} className="min-w-0 space-y-1 rounded-md bg-background/60 p-2">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {title}
                </div>
                <p className="break-words text-sm font-medium">{party.name ?? '—'}</p>
                {party.address && (
                  <p className="flex items-start gap-1 break-words text-[11px] text-muted-foreground">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    {party.address}
                  </p>
                )}
                {party.phone && (
                  <p className="flex items-center gap-1 break-all text-[11px] text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {party.phone}
                  </p>
                )}
                {party.email && (
                  <p className="flex items-center gap-1 break-all text-[11px] text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {party.email}
                  </p>
                )}
              </div>
            ))}
          </div>

          {(refs.length > 0 || envelope.standard) && (
            <div className="flex flex-wrap gap-1.5">
              {refs.map((r) => (
                <Badge key={r.label} variant="outline" className="max-w-full whitespace-normal text-[11px] font-normal">
                  <span className="text-muted-foreground">{r.label} :</span>
                  <span className="ml-1 font-medium">{String(r.value)}</span>
                </Badge>
              ))}
              {envelope.standard && (
                <Badge variant="secondary" className="whitespace-normal text-[11px] font-normal">
                  {envelope.standard}
                  {envelope.facturXType ? ` · ${envelope.facturXType}` : ''}
                </Badge>
              )}
              {envelope.signatureStatus === 'PENDING' && (
                <Badge variant="outline" className="whitespace-normal text-[11px] font-normal">
                  En attente de signature
                </Badge>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}
