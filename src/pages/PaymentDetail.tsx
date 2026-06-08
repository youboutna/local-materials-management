import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { PaymentService } from '@/application/services/PaymentService';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: payment, isLoading, isError, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;
      const service = new PaymentService(RepositoryFactory.getPaymentRepository() as any);
      return service.getPaymentById(id);
    },
    enabled: !!id,
  });

  return (
    <AppLayout pageTitle="💳 Détail du paiement">
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} aria-label="Revenir à la page précédente">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" /> Retour
        </Button>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {isError && (
          <Card>
            <CardContent className="p-6 text-destructive">
              Erreur de chargement : {(error as Error)?.message ?? 'inconnue'}
            </CardContent>
          </Card>
        )}

        {!isLoading && !payment && !isError && (
          <Card>
            <CardContent className="p-6">
              Aucun paiement trouvé pour l'identifiant <code>{id}</code>.
            </CardContent>
          </Card>
        )}

        {payment && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Paiement {payment.transactionId || payment.id}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{payment.id}</p>
              </div>
              {payment.status && <Badge>{payment.status}</Badge>}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Montant" value={`${payment.amount?.toLocaleString('fr-FR')} MRU`} />
              <Field label="Méthode" value={payment.paymentMethod} />
              <Field label="Date" value={payment.paymentDate} />
              <Field label="Bénéficiaire" value={payment.contractorName} />
              <Field label="Contact" value={payment.contractorContact} />
              <Field label="Progression" value={`${payment.progressAtPayment ?? 0}%`} />
              {payment.bankName && <Field label="Banque" value={payment.bankName} />}
              {payment.accountNumber && <Field label="Compte" value={payment.accountNumber} />}
              {payment.checkNumber && <Field label="N° chèque" value={payment.checkNumber} />}
              {payment.mobileNumber && <Field label="Mobile" value={`${payment.mobileOperator ?? ''} ${payment.mobileNumber}`} />}

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                {payment.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${payment.projectId}`}>
                      Projet <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {payment.inspectionId && (
                  <Button variant="outline" asChild>
                    <Link to={`/inspections/${payment.inspectionId}`}>
                      Inspection liée <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {payment.phaseId && payment.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${payment.projectId}/phases/${payment.phaseId}`}>
                      Phase <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

const Field: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value ?? '—'}</p>
  </div>
);

export default PaymentDetailPage;
