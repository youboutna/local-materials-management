/**
 * Portail Consultant (/consultant-portal)
 * Le consultant est une partie prenante (interne, externe ou indépendante) qui :
 *  - suit et valide l'avancement des projets / phases / jalons via inspections,
 *  - déclenche une demande de paiement (décompte) à 100 % ou en réception définitive,
 *  - reçoit alertes (retard, garantie bancaire, assurance) et notifications de paiement.
 */
import { useMemo, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, CheckCircle2, DollarSign, FileSpreadsheet, FileText, FolderKanban, ShieldAlert } from 'lucide-react';
import { DqeWorkspace } from '@/components/boq/DqeWorkspace';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';
import { useConsultantPortalHex } from '@/hooks/hexagonal/useConsultantPortalHex';
import { ConsultantValidationPanel } from '@/components/invoices/ConsultantValidationPanel';
import { AssociatedPaymentsPanel } from '@/components/common/AssociatedPaymentsPanel';
import { MonitoringDocumentsPanel } from '@/components/documents/panels/MonitoringDocumentsPanel';
import ConsultantProgressValidation from './components/ConsultantProgressValidation';
import ConsultantInspectionsPanel from './components/ConsultantInspectionsPanel';

import ConsultantAlertsPanel from './components/ConsultantAlertsPanel';

import { TranslatedDocumentType } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
import { Gavel } from 'lucide-react';
import { ConsultantTendersPanel } from '@/components/consultant/ConsultantTendersPanel';
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
                ? 'text-2xl font-semibold text-warning'
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

  // Projet ciblé pour l'analyse des décomptes via le module DQE.
  const [invoiceProjectId, setInvoiceProjectId] = useState<string | null>(null);

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
              <BreadcrumbLink href="/"><T k="auto.consultantdashboard.accueil" fallback="Accueil" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage><T k="auto.consultantdashboard.portail_consultant" fallback="Portail Consultant" /></BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            <T k="auto.consultantdashboard.suivi_validation_et_declenchement_de_paiement" fallback="Suivi, validation et déclenchement de paiement" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? 'Chargement de votre périmètre…'
              : hasScope
                ? `Vous êtes consultant sur ${projects.length} projet(s).`
                : "Aucun projet ne vous est assigné en tant que consultant."}
          </p>
        </header>

        <section aria-label="Indicateurs clés" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:grid sm:grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <T k="auto.consultantdashboard.avancement" fallback="Avancement" />
            </TabsTrigger>
            <TabsTrigger value="inspections" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <T k="consultant.inspections.tab" fallback="Inspections" />
            </TabsTrigger>

            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <T k="auto.consultantdashboard.decomptes" fallback="Décomptes" />
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              <T k="auto.consultantdashboard.paiements" fallback="Paiements" />
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <T k="auto.consultantdashboard.alertes" fallback="Alertes" />
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <T k="auto.consultantdashboard.documents" fallback="Documents" />
            </TabsTrigger>
            <TabsTrigger value="tenders" className="flex items-center gap-2">
              <Gavel className="h-4 w-4" aria-hidden="true" />
              <T k="consultant.tenders.tab" fallback="Appels d'offres" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspections">
            <ConsultantInspectionsPanel projects={projects} />
          </TabsContent>

          <TabsContent value="tenders">
            <ConsultantTendersPanel />
          </TabsContent>


          <TabsContent value="validation">
            <ConsultantProgressValidation projects={projects} />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
                  <T k="auto.consultantdashboard.analyse_des_decomptes_module_dqe" fallback="Analyse des décomptes (module DQE)" />
                </CardTitle>
                <CardDescription>
                  Sélectionnez un projet pour analyser les décomptes / factures ligne par ligne,
                  avec le même moteur de calcul et de parsing que le portail fournisseur.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasScope ? (
                  <>
                    <div className="max-w-md space-y-1">
                      <Label htmlFor="consultant-invoice-project"><T k="auto.consultantdashboard.projet" fallback="Projet" /></Label>
                      <Select
                        value={invoiceProjectId ?? ''}
                        onValueChange={(v) => setInvoiceProjectId(v)}
                      >
                        <SelectTrigger id="consultant-invoice-project">
                          <SelectValue placeholder="Choisir un projet…" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.title ?? p.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {invoiceProjectId ? (
                      <DqeWorkspace
                        routeContext="supplier-invoice"
                        projectId={invoiceProjectId}
                        projectName={projects.find((p) => p.id === invoiceProjectId)?.title}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        <T k="auto.consultantdashboard.aucun_projet_selectionne" fallback="Aucun projet sélectionné." />
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <T k="auto.consultantdashboard.vous_n_etes_assigne_a_aucun_projet_en_tant_que_c" fallback="Vous n'êtes assigné à aucun projet en tant que consultant." />
                  </p>
                )}
              </CardContent>
            </Card>

            <ConsultantValidationPanel />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {unreadPaymentNotifications.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base"><T k="auto.consultantdashboard.notifications_de_paiement_a_traiter" fallback="Notifications de paiement à traiter" /></CardTitle>
                  <CardDescription>
                    <T k="auto.consultantdashboard.accedez_aux_demandes_de_paiement_qui_vous_ont_et" fallback="Accédez aux demandes de paiement qui vous ont été notifiées." />
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
                        <Badge variant="outline"><TranslatedDocumentType code={n.type} /></Badge>
                        {n.actionUrl && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={n.actionUrl}><T k="auto.consultantdashboard.ouvrir" fallback="Ouvrir" /></a>
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => markNotificationAsRead(n.id)}>
                          <T k="auto.consultantdashboard.marquer_lu" fallback="Marquer lu" />
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
                  <T k="auto.consultantdashboard.paiements_de_mes_projets" fallback="Paiements de mes projets" />
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
                    <p><T k="auto.consultantdashboard.vous_n_etes_assigne_a_aucun_projet_en_tant_que_c" fallback="Vous n'êtes assigné à aucun projet en tant que consultant." /></p>
                    <p className="text-sm"><T k="auto.consultantdashboard.contactez_l_administrateur_pour_vous_affecter_a_" fallback="Contactez l'administrateur pour vous affecter à un projet." /></p>
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
