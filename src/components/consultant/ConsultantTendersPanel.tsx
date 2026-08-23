/**
 * ConsultantTendersPanel — visibilité des appels d'offres publiés
 * (issus des expressions de besoin validées) pour le portail consultant.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnumBadge } from '@/components/i18n/EnumText';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Gavel } from 'lucide-react';
import { usePublicOpenTenders } from '@/hooks/hexagonal/usePublicTendersHex';
import { useI18n } from '@/hooks/useI18n';
import { formatCurrency } from '@/utils/phaseDisplayHelpers';

export const ConsultantTendersPanel: React.FC = () => {
  const { t, language } = useI18n();
  const { data, isLoading } = usePublicOpenTenders();
  const tenders = data ?? [];

  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString(language === 'ar' ? 'ar-MR' : language === 'en' ? 'en-GB' : 'fr-FR') : '—';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gavel className="h-4 w-4" aria-hidden="true" />
          {t('consultant.tenders.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Skeleton className="h-24 w-full" />}
        {!isLoading && tenders.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t('consultant.tenders.empty')}
          </p>
        )}
        {tenders.map((tender) => (
          <div
            key={tender.id}
            className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{tender.title}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3" aria-hidden="true" />
                {t('consultant.tenders.deadline')} :{' '}
                {formatDate(tender.deadlineDate ?? null)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {typeof tender.budgetMax === 'number' && tender.budgetMax > 0 && (
                <span className="text-sm font-semibold">{formatCurrency(tender.budgetMax)}</span>
              )}
              <EnumBadge enumName="tender_status" code={tender.status} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ConsultantTendersPanel;
