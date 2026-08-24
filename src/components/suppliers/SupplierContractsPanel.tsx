/**
 * SupplierContractsPanel — « Voir les contrats signés » (portail prestataire).
 * Source unique : ContractService (btp.contracts) via hook hexagonal.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileSignature, Loader2 } from 'lucide-react';
import { useSupplierContractsHex } from '@/hooks/hexagonal/useContractsHex';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  supplierId?: string;
}

export function SupplierContractsPanel({ supplierId }: Props) {
  const { t, translateStatus, formatDate } = useI18n();
  const { data: contracts = [], isLoading } = useSupplierContractsHex(supplierId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-5 w-5" aria-hidden="true" />
          {t('supplier.contracts.title') || 'Contrats et bons de commande'}
        </CardTitle>
        <CardDescription>
          {t('supplier.contracts.description') ||
            'Contrats issus des attributions d’appels d’offres pour votre compte.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t('common.loading') || 'Chargement…'}
          </p>
        ) : contracts.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            {t('supplier.contracts.empty') || 'Aucun contrat signé pour le moment.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('supplier.contracts.number') || 'N° contrat'}</TableHead>
                <TableHead>{t('supplier.contracts.object') || 'Objet'}</TableHead>
                <TableHead>{t('common.status') || 'Statut'}</TableHead>
                <TableHead>{t('supplier.contracts.start') || 'Début'}</TableHead>
                <TableHead className="text-right">{t('common.amount') || 'Montant'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.contractNumber}</TableCell>
                  <TableCell className="text-sm">{c.title}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'signed' ? 'default' : 'secondary'}>
                      {translateStatus(c.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(c.startDate)}</TableCell>
                  <TableCell className="text-right text-sm">
                    {c.totalAmount.toLocaleString()} {c.currency}
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

export default SupplierContractsPanel;
