/**
 * Portail Consultant (/consultant-portal)
 * Le consultant est une partie prenante (interne, externe ou indépendante) qui :
 *  - suit et valide l'avancement des projets / phases / jalons via inspections,
 *  - déclenche une demande de paiement (décompte) à 100 % ou en réception définitive,
 *  - reçoit alertes (retard, garantie bancaire, assurance) et notifications de paiement.
 */
import { useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, CheckCircle2, DollarSign, FileText, FolderKanban, ShieldAlert } from 'lucide-react';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';
import { useConsultantPortalHex } from '@/hooks/hexagonal/useConsultantPortalHex';
import { ConsultantValidationPanel } from '@/components/invoices/ConsultantValidationPanel';
import { AssociatedPaymentsPanel } from '@/components/common/AssociatedPaymentsPanel';
import { MonitoringDocumentsPanel } from '@/components/documents/panels/MonitoringDocumentsPanel';
import ConsultantProgressValidation from './components/ConsultantProgressValidation';
import ConsultantAlertsPanel from './components/ConsultantAlertsPanel';

const KpiCard = ({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  tone?: 'default' | 'warning' | 'danger';
}) => (
  <Card>
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p
          className={
            tone === 'danger'
              ? 'text-2xl font-semibold text-destructive'
              : tone === 'warning'
                ? 'text-2xl font-semibold text-amber-600'
                : 'text-2xl font-semibold text-foreground'
          }
        >
          {value}
        </p>
      </div>
      <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
    </CardContent>
  </Card>
);

const ConsultantDashboard = () => {
  const { userId } = useAuthUserHex();
  const {
    projects,
    alerts,
    expiries,
    paymentNotifications,
    kpis,
    isLoading,
    acknowledgeAlert,
    resolveAlert,
    markNotificationAsRead,
  } = useConsultantPortalHex(userId ?? undefined);

  const hasScope = projects.length > 0;

  const unreadPaymentNotifications = useMemo(
    () => paymentNotifications.filter((n) => !n.read),
    [paymentNotifications],
  );

  return (
    <AppLayout pageTitle="Portail Consultant">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Portail Consultant</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Suivi, validation et déclenchement de paiement
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Chargement de votre périmètre…'
              : hasScope
                ? `Vous êtes consultant sur ${projects.length} projet(s).`
                : "Aucun projet ne vous est assigné en tant que consultant."}
          </p>
        </header>

        <section aria-label="Indicateurs clés" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Projets suivis" value={kpis.projectCount} icon={FolderKanban} />
          <KpiCard
            label="Alertes ouvertes"
            value={kpis.openAlerts}
            icon={AlertTriangle}
            tone={kpis.openAlerts > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            label="Alertes critiques"
            value={kpis.criticalAlerts}
            icon={ShieldAlert}
            tone={kpis.criticalAlerts > 0 ? 'danger' : 'default'}
          />
          <KpiCard
            label="Échéances < 30 j"
            value={kpis.expiringSoon}
            icon={CheckCircle2}
            tone={kpis.expiringSoon > 0 ? 'warning' : 'default'}
          />
          <KpiCard
            label="Notifications paiement"
            value={kpis.pendingPaymentNotifications}
            icon={Bell}
            tone={kpis.pendingPaymentNotifications > 0 ? 'warning' : 'default'}
          />
        </section>

        <Tabs defaultValue="validation" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Avancement
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Décomptes
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              Paiements
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Alertes
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="validation">
            <ConsultantProgressValidation projects={projects} />
          </TabsContent>

          <TabsContent value="invoices">
            <ConsultantValidationPanel />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {unreadPaymentNotifications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notifications de paiement à traiter</CardTitle>
                  <CardDescription>
                    Accédez aux demandes de paiement qui vous ont été notifiées.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unreadPaymentNotifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground">{n.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{n.type}</Badge>
                        {n.actionUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={n.actionUrl}>Ouvrir</a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => markNotificationAsRead(n.id)}>
                          Marquer lu
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-5 w-5" aria-hidden="true" />
                  Paiements de mes projets
                </CardTitle>
                <CardDescription>
                  {hasScope
                    ? 'Paiements liés aux projets où vous êtes consultant.'
                    : 'Aucun paiement à valider pour vos projets.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasScope ? (
                  <AssociatedPaymentsPanel
                    entityType="validation"
                    entityId={userId ?? ''}
                    showActions
                    onPaymentCreated={() => {}}
                  />
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" aria-hidden="true" />
                    <p>Vous n'êtes assigné à aucun projet en tant que consultant.</p>
                    <p className="text-sm">Contactez l'administrateur pour vous affecter à un projet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <ConsultantAlertsPanel
              alerts={alerts}
              expiries={expiries}
              onAcknowledge={acknowledgeAlert}
              onResolve={resolveAlert}
            />
          </TabsContent>

          <TabsContent value="documents">
            <MonitoringDocumentsPanel
              scope="payment"
              heading="Pièces justificatives des décomptes et paiements"
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ConsultantDashboard;
