/**
 * SupplierQuoteStatusPanel — « Suivre l'état du devis / de la soumission ».
 * Reçu → En analyse → Accepté / Rejeté, sourcé depuis les soumissions du prestataire.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ListChecks } from 'lucide-react';
import { useSupplierSubmissionsHex } from '@/hooks/hexagonal/useSupplierSubmissionsHex';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  supplierId?: string;
}

const TONE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'secondary',
  under_review: 'outline',
  approved: 'default',
  rejected: 'destructive',
};

export function SupplierQuoteStatusPanel({ supplierId }: Props) {
  const { t, translateStatus, formatDate } = useI18n();
  const { data: submissions = [], isLoading } = useSupplierSubmissionsHex(supplierId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
          {t('supplier.quotes.tracking') || 'Suivi de mes devis / soumissions'}
        </CardTitle>
        <CardDescription>
          {t('supplier.quotes.tracking_description') ||
            'État de traitement de chaque offre transmise au gestionnaire.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.loading') || 'Chargement…'}
          </p>
        ) : submissions.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            {t('supplier.quotes.empty') || 'Aucune soumission transmise pour le moment.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tender.reference') || "Appel d'offres"}</TableHead>
                <TableHead>{t('common.date') || 'Date'}</TableHead>
                <TableHead>{t('common.status') || 'Statut'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">
                    {s.tender?.title ?? s.tenderId?.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(s.submissionDate ?? s.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TONE[s.status] ?? 'secondary'}>{translateStatus(s.status)}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default SupplierQuoteStatusPanel;
