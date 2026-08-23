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
import { T } from '@/components/i18n/T';

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
            <T k="auto.consultantalertspanel.alertes_de_mes_projets" fallback="Alertes de mes projets" />
          </CardTitle>
          <CardDescription><T k="auto.consultantalertspanel.retards_conformite_et_escalades_sur_les_projets_" fallback="Retards, conformité et escalades sur les projets que vous suivez." /></CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" aria-hidden="true" /> <T k="auto.consultantalertspanel.aucune_alerte_active" fallback="Aucune alerte active." />
            </p>
          ) : (
            <Table>
              <caption className="sr-only"><T k="auto.consultantalertspanel.alertes_du_perimetre_consultant" fallback="Alertes du périmètre consultant" /></caption>
              <TableHeader>
                <TableRow>
                  <TableHead><T k="auto.consultantalertspanel.alerte" fallback="Alerte" /></TableHead>
                  <TableHead><T k="auto.consultantalertspanel.severite" fallback="Sévérité" /></TableHead>
                  <TableHead><T k="auto.consultantalertspanel.statut" fallback="Statut" /></TableHead>
                  <TableHead className="text-right"><T k="auto.consultantalertspanel.actions" fallback="Actions" /></TableHead>
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
                        <T k="auto.consultantalertspanel.accuser_reception" fallback="Accuser réception" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                        <T k="auto.consultantalertspanel.resoudre" fallback="Résoudre" />
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
          <CardDescription><T k="auto.consultantalertspanel.suivi_des_expirations_sur_les_projets_de_votre_p" fallback="Suivi des expirations sur les projets de votre périmètre." /></CardDescription>
        </CardHeader>
        <CardContent>
          {expiries.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground"><T k="auto.consultantalertspanel.aucune_garantie_ni_police_a_surveiller" fallback="Aucune garantie ni police à surveiller." /></p>
          ) : (
            <Table>
              <caption className="sr-only"><T k="auto.consultantalertspanel.echeances_des_garanties_bancaires_et_assurances" fallback="Échéances des garanties bancaires et assurances" /></caption>
              <TableHeader>
                <TableRow>
                  <TableHead><T k="auto.consultantalertspanel.type" fallback="Type" /></TableHead>
                  <TableHead>Émetteur / Référence</TableHead>
                  <TableHead><T k="auto.consultantalertspanel.montant" fallback="Montant" /></TableHead>
                  <TableHead><T k="auto.consultantalertspanel.echeance" fallback="Échéance" /></TableHead>
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
