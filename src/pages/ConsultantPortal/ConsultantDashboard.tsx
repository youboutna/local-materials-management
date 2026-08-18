import React, { useMemo } from 'react';
import { useAuthUserHex } from '@/hooks/hexagonal/useAuthUserHex';
import { useProjectsHex } from '@/hooks/hexagonal/useProjectsHex';
import { AssociatedPaymentsPanel } from '@/components/common/AssociatedPaymentsPanel';
import { ConsultantValidationPanel } from '@/components/invoices/ConsultantValidationPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, DollarSign } from 'lucide-react';
import { AppLayout } from '@/components/layout';

const ConsultantDashboard = () => {
  const { userId } = useAuthUserHex();
  const { projects = [], isLoading } = useProjectsHex();

  const consultantProjectIds = useMemo(() => {
    return projects
      .filter((p: any) => p.consultantId === userId || p.consultant_id === userId)
      .map((p: any) => p.id);
  }, [projects, userId]);

  const hasConsultantScope = consultantProjectIds.length > 0;

  return (
    <AppLayout
      pageTitle="Bureau de Conseil"
      pageDescription="Validation des factures d'avancement et paiements directs"
    >
      <div className="max-w-6xl mx-auto">
        <p className="text-muted-foreground mb-6">
          {hasConsultantScope 
            ? `Vous êtes consultant sur ${consultantProjectIds.length} projet(s).` 
            : 'Aucun projet ne vous est assigné en tant que consultant.'}
        </p>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Factures d'avancement
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Paiements directs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <ConsultantValidationPanel />
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Paiements en attente de validation
                </CardTitle>
                <CardDescription>
                  {hasConsultantScope 
                    ? 'Paiements liés aux projets où vous êtes consultant.' 
                    : 'Aucun paiement à valider pour vos projets.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasConsultantScope ? (
                  <AssociatedPaymentsPanel
                    entityType="validation"
                    entityId={userId ?? ''}
                    showActions={true}
                    onPaymentCreated={() => {}}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Vous n'êtes assigné à aucun projet en tant que consultant.</p>
                    <p className="text-sm">Contactez l'administrateur pour vous affecter à un projet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default ConsultantDashboard;