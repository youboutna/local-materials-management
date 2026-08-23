import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { BoqWorkspace } from '@/components/boq';
import { AppLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTenderHex, useTenderSharingSecrets } from '@/hooks/hexagonal';
// NOTE: RepositoryFactory is used below for a read-only document count query;
// no dedicated tender-document-count service method exists yet.
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, DollarSign, ExternalLink, FileSignature, FileText, KeyRound, Users } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatAmount2, formatNumber2, formatPercent2 } from '@/utils/reportNumbers';

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value ?? '—'}</p>
  </div>
);

const TenderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tender, loading, error } = useTenderHex(id);
  const [awardOpen, setAwardOpen] = useState(false);

  const { data: submissions = [] } = useQuery({
    queryKey: ['tender-submissions', id],
    queryFn: async () => (id ? ((await TenderSubmissionService.getTenderSubmissions(id)) as any[]) : []),
    enabled: !!id,
  });
  const { data: secrets = [] } = useTenderSharingSecrets(id);
  const { data: docsCount = 0 } = useQuery({
    queryKey: ['tender-docs-count', id],
    queryFn: async () => {
      if (!id) return 0;
      try {
        const repo = RepositoryFactory.getTenderDocumentRepository();
        const docs: any[] = (await (repo as any).getDocumentsByTenderId?.(id)) ?? [];
        return docs.length;
      } catch {
        return 0;
      }
    },
    enabled: !!id,
  });

  return (
    <AppLayout pageTitle="📄 Détail de l'appel d'offres">
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> <T k="auto.tenderdetail.retour" fallback="Retour" />
        </Button>

        {loading && <Skeleton className="h-64 w-full" />}

        {error && (
          <Card>
            <CardContent className="p-6 text-destructive">
              Erreur de chargement : {error.message}
            </CardContent>
          </Card>
        )}

        {!loading && !tender && !error && (
          <Card>
            <CardContent className="p-6">
              <T k="auto.tenderdetail.aucun_appel_d_offres_trouve_pour_l_identifiant" fallback="Aucun appel d'offres trouvé pour l'identifiant" /> <code>{id}</code>.
            </CardContent>
          </Card>
        )}

        {tender && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{tender.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">{tender.tenderNumber || tender.id}</p>
              </div>
              <Badge><TranslatedStatus code={tender.status} /></Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Description" value={tender.description} />
              <Field label="Type de marché" value={tender.marketType} />
              <Field label="Mode de sélection" value={tender.selectionMode} />
              <Field label="Source de financement" value={tender.financingSource} />
              <Field
                label="Publication"
                value={tender.publicationDate ? <span><Calendar className="inline h-3 w-3 mr-1" />{new Date(tender.publicationDate).toLocaleDateString('fr-FR')}</span> : null}
              />
              <Field
                label="Clôture"
                value={tender.deadlineDate ? <span><Calendar className="inline h-3 w-3 mr-1" />{new Date(tender.deadlineDate).toLocaleDateString('fr-FR')}</span> : null}
              />
              <Field
                label="Budget min"
                value={tender.budgetMin ? <span><DollarSign className="inline h-3 w-3 mr-1" />{formatAmount2(tender.budgetMin)}</span> : null}
              />
              <Field
                label="Budget max"
                value={tender.budgetMax ? <span><DollarSign className="inline h-3 w-3 mr-1" />{formatAmount2(tender.budgetMax)}</span> : null}
              />

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                {tender.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${tender.projectId}`}>
                      <T k="auto.tenderdetail.projet_associe" fallback="Projet associé" /> <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to={`/tender-management?tenderId=${tender.id}`}>
                    Soumissions & évaluation <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                {(tender.status === 'awarded' || tender.status === 'under_evaluation') && tender.projectId && (
                  <Button asChild>
                    <Link to={`/tender-management?tenderId=${tender.id}&action=award`}>
                      <FileSignature className="h-4 w-4 mr-1" /> Signer contrat & hydrater projet
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {tender && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground"><T k="auto.tenderdetail.soumissions" fallback="Soumissions" /></p>
                  <p className="text-2xl font-bold">{(submissions as any[]).length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground"><T k="auto.tenderdetail.documents" fallback="Documents" /></p>
                  <p className="text-2xl font-bold">{docsCount}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground"><T k="auto.tenderdetail.codes_secrets_actifs" fallback="Codes secrets actifs" /></p>
                  <p className="text-2xl font-bold">
                    {(secrets as any[]).filter((s) => s.isActive).length}
                  </p>
                </div>
                <KeyRound className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {tender && (
          <Card>
            <CardHeader>
              <CardTitle>DQE / Chiffrage estimatif</CardTitle>
              <p className="text-sm text-muted-foreground">
                Import BPU, saisie manuelle, calcul métré, génération devis signé et alignement projet.
              </p>
            </CardHeader>
            <CardContent>
              <BoqWorkspace
                source="tender_estimate"
                contextId={tender.id}
                projectId={tender.projectId ?? undefined}
                mode="bid"
                estimateId={tender.id}
              />
            </CardContent>
          </Card>
        )}

        {/* AwardedTenderPreviewDialog est déclenché depuis TenderManagement. */}
        {false && awardOpen && <span />}
      </div>
    </AppLayout>
  );
};

export default TenderDetail;
