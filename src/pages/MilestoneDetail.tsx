import { AppLayout } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';
import { entityToasts } from '@/hooks/projects/projectToasts';
import { ArrowLeft, Calendar, ExternalLink, Flag } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const milestoneToasts = entityToasts('jalon');

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value ?? '—'}</p>
  </div>
);

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  pending: 'outline',
  delayed: 'destructive',
};

const MilestoneDetail: React.FC = () => {
  const { projectId, milestoneId } = useParams<{ projectId: string; milestoneId: string }>();
  const navigate = useNavigate();
  const { milestones, loading, error, toggleMilestoneStatus } = useMilestonesHex(projectId);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const milestone = milestones.find((m) => m.id === milestoneId);

  return (
    <AppLayout pageTitle="🚩 Détail du jalon">
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} aria-label="Revenir à la page précédente">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" /> Retour
        </Button>

        {loading && <Skeleton className="h-64 w-full" />}

        {error && (
          <Card>
            <CardContent className="p-6 text-destructive">Erreur : {error}</CardContent>
          </Card>
        )}

        {!loading && !milestone && !error && (
          <Card>
            <CardContent className="p-6">
              Aucun jalon trouvé pour l'identifiant <code>{milestoneId}</code>.
            </CardContent>
          </Card>
        )}

        {milestone && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                <div>
                  <CardTitle>{milestone.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{milestone.id}</p>
                </div>
              </div>
              <Badge variant={statusVariant[milestone.status] || 'outline'}>{milestone.status}</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Description" value={milestone.description} />
              <Field
                label="Date cible"
                value={milestone.targetDate ? <span><Calendar className="inline h-3 w-3 mr-1" />{new Date(milestone.targetDate).toLocaleDateString('fr-FR')}</span> : null}
              />
              <Field
                label="Date de complétion"
                value={milestone.completionDate ? new Date(milestone.completionDate).toLocaleDateString('fr-FR') : null}
              />
              <Field label="Poids" value={`${(milestone.weight * 100).toFixed(0)} %`} />
              <Field label="Notes" value={milestone.notes} />

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                {milestone.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${milestone.projectId}`}>
                      Projet <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {milestone.phaseId && milestone.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${milestone.projectId}/phases/${milestone.phaseId}`}>
                      Phase <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={isTogglingStatus}
                  aria-busy={isTogglingStatus}
                  onClick={async () => {
                    setIsTogglingStatus(true);
                    try {
                      const ok = await toggleMilestoneStatus(milestone.id, milestone.status);
                      ok ? milestoneToasts.updateSuccess(milestone.title) : milestoneToasts.updateError();
                    } finally {
                      setIsTogglingStatus(false);
                    }
                  }}
                >
                  {isTogglingStatus
                    ? 'Mise à jour…'
                    : milestone.status === 'completed' ? 'Rouvrir' : 'Marquer terminé'}
                </Button>

              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MilestoneDetail;
