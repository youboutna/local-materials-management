/**
 * InvoiceLifecycleTimeline — frise du cycle documentaire
 * DQE → Devis → Contrat → Décompte → Facture finale.
 *
 * 100 % référentiel : les étapes, statuts et TypeCodes proviennent de
 * `invoice-document-types.referential`. Aucune couleur codée en dur (tokens).
 */
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/useI18n';
import {
  INVOICE_DOCUMENT_TYPES,
  getInvoiceDocumentType,
  getInvoiceDocumentTypeLabel,
  type InvoiceActor,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';

interface Props {
  current: InvoiceDocumentType;
  actor?: InvoiceActor;
  businessStatus?: string | null;
  billedPercentage?: number | null;
  className?: string;
}

export const InvoiceLifecycleTimeline: React.FC<Props> = ({
  current,
  actor,
  businessStatus,
  billedPercentage,
  className,
}) => {
  const { language, t, translateStatus } = useI18n();
  const currentIndex = useMemo(
    () => INVOICE_DOCUMENT_TYPES.findIndex((d) => d.code === current),
    [current],
  );
  const def = getInvoiceDocumentType(current);
  const statusLabel = translateStatus(businessStatus || def.initialStatus);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-xs">
        {INVOICE_DOCUMENT_TYPES.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          const allowed = !actor || step.actors.includes(actor);
          const stepLabel = getInvoiceDocumentTypeLabel(step.code, language);
          return (
            <li key={step.code} className="flex items-center gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-1 transition-colors',
                  active && 'border-primary bg-primary/10 font-medium text-primary',
                  done && 'border-border bg-muted text-muted-foreground',
                  !active && !done && 'border-dashed border-border text-muted-foreground',
                  !allowed && 'opacity-60',
                )}
                title={stepLabel}
              >
                {done ? <Check className="h-3 w-3" /> : null}
                {stepLabel}
              </span>
              {index < INVOICE_DOCUMENT_TYPES.length - 1 ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{t('dqe.lifecycle.status')} : {statusLabel}</Badge>
        {def.requiresPercentage && billedPercentage != null ? (
          <Badge variant="outline">
            {t('dqe.lifecycle.billed_progress')} {Number(billedPercentage).toFixed(2)} %
          </Badge>
        ) : null}
        <span>
          {t('dqe.lifecycle.possible_statuses')} :{' '}
          {def.statuses.map((s) => translateStatus(s)).join(' · ')}
        </span>
      </div>
    </div>
  );
};

export default InvoiceLifecycleTimeline;
