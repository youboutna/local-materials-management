import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink, Calendar, DollarSign, FileSignature, Users, FileText, KeyRound } from 'lucide-react';
import { useTenderHex, useTenderSharingSecrets } from '@/hooks/hexagonal';
import { useQuery } from '@tanstack/react-query';
import { TenderSubmissionService } from '@/application/services/TenderSubmissionService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { BoqWorkspace } from '@/components/boq';

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
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
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
              Aucun appel d'offres trouvé pour l'identifiant <code>{id}</code>.
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
              <Badge>{tender.status}</Badge>
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
                value={tender.budgetMin ? <span><DollarSign className="inline h-3 w-3 mr-1" />{tender.budgetMin.toLocaleString('fr-FR')} MRU</span> : null}
              />
              <Field
                label="Budget max"
                value={tender.budgetMax ? <span><DollarSign className="inline h-3 w-3 mr-1" />{tender.budgetMax.toLocaleString('fr-FR')} MRU</span> : null}
              />

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                {tender.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${tender.projectId}`}>
                      Projet associé <ExternalLink className="h-3 w-3 ml-1" />
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
                  <p className="text-xs text-muted-foreground">Soumissions</p>
                  <p className="text-2xl font-bold">{(submissions as any[]).length}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">{docsCount}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Codes secrets actifs</p>
                  <p className="text-2xl font-bold">
                    {(secrets as any[]).filter((s) => s.isActive).length}
                  </p>
                </div>
                <KeyRound className="h-8 w-8 text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* AwardedTenderPreviewDialog est déclenché depuis TenderManagement (soumissions) car il nécessite l'estimateId gagnant. */}
        {false && awardOpen && <span />}
      </div>
    </AppLayout>
  );
};

export default TenderDetail;
