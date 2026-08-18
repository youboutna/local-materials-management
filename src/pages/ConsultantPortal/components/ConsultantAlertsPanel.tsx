/**
 * ConsultantAlertsPanel
 * Alertes du périmètre consultant (retards, conformité) + échéances
 * garanties bancaires / assurances, comme pour le directeur.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExpiryCountdown } from '@/components/common/ExpiryCountdown';
import { AlertTriangle, BellOff, CheckCircle2 } from 'lucide-react';
import type { AlertData } from '@/dtos/entities/AlertDTO';
import type { ExpiryItem } from '@/hooks/hexagonal/useConsultantPortalHex';
import { formatAmount2 } from '@/utils/reportNumbers';

interface Props {
  alerts: AlertData[];
  expiries: ExpiryItem[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

const severityVariant = (severity?: string) =>
  severity === 'critical' ? 'destructive' : severity === 'high' ? 'default' : 'secondary';

export function ConsultantAlertsPanel({ alerts, expiries, onAcknowledge, onResolve }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Alertes de mes projets
          </CardTitle>
          <CardDescription>Retards, conformité et escalades sur les projets que vous suivez.</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" aria-hidden="true" /> Aucune alerte active.
            </p>
          ) : (
            <Table>
              <caption className="sr-only">Alertes du périmètre consultant</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Alerte</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.slice(0, 30).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant(alert.severity as string)}>
                        {String(alert.severity ?? 'info')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{String(alert.status ?? 'active')}</Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
                        Accuser réception
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                        Résoudre
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Échéances garanties &amp; assurances</CardTitle>
          <CardDescription>Suivi des expirations sur les projets de votre périmètre.</CardDescription>
        </CardHeader>
        <CardContent>
          {expiries.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Aucune garantie ni police à surveiller.</p>
          ) : (
            <Table>
              <caption className="sr-only">Échéances des garanties bancaires et assurances</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Émetteur / Référence</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Échéance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiries.slice(0, 30).map((item) => (
                  <TableRow key={`${item.kind}-${item.id}`}>
                    <TableCell>
                      <Badge variant="outline">
                        {item.kind === 'bank_guarantee' ? 'Garantie bancaire' : 'Assurance'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.reference}</p>
                    </TableCell>
                    <TableCell>{item.amount ? `${formatAmount2(item.amount)} MRU` : '—'}</TableCell>
                    <TableCell>
                      <ExpiryCountdown expiryDate={item.expiryDate} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ConsultantAlertsPanel;
