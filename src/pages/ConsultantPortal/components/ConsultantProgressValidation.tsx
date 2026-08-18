/**
 * ConsultantProgressValidation
 * Validation d'avancement par le consultant : phases, jalons, inspections.
 * À 100 % (ou réception définitive) le consultant déclenche une demande de paiement
 * via le formulaire unifié (aucune logique de paiement dupliquée ici).
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Loader2, Wallet } from 'lucide-react';
import { usePhasesHex } from '@/hooks/hexagonal/usePhasesHex';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';
import { useInspectionsListHex } from '@/hooks/hexagonal/useInspectionsListHex';
import UnifiedPaymentFormDialog, {
  type UnifiedPaymentFormDefaults,
} from '@/components/payments/UnifiedPaymentFormDialog';
import type { ConsultantProjectRef } from '@/hooks/hexagonal/useConsultantPortalHex';

interface Props {
  projects: ConsultantProjectRef[];
}

export function ConsultantProgressValidation({ projects }: Props) {
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentDefaults, setPaymentDefaults] = useState<UnifiedPaymentFormDefaults>({});

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const { phases, isLoading, updatePhase, isUpdating, refetch } = usePhasesHex(projectId || undefined);
  const { milestones, toggleMilestoneStatus } = useMilestonesHex(projectId || undefined);
  const { data: inspections = [] } = useInspectionsListHex(projectId || '');

  const handleValidate = async (phaseId: string, currentProgress: number) => {
    const raw = drafts[phaseId];
    const progress = Math.max(0, Math.min(100, Number(raw ?? currentProgress)));
    const ok = await updatePhase(phaseId, {
      progress,
      status: progress >= 100 ? 'completed' : 'in_progress',
    });
    if (ok) {
      setDrafts((prev) => ({ ...prev, [phaseId]: String(progress) }));
      await refetch();
    }
  };

  const openPaymentRequest = (phaseId?: string, progress?: number) => {
    const lastInspection = inspections[0];
    setPaymentDefaults({
      projectId,
      projectTitle: selectedProject?.title,
      phaseId,
      inspectionId: lastInspection?.id,
      progressAtPayment: progress,
      contextLabel: phaseId
        ? 'Demande déclenchée après validation consultant de la phase'
        : 'Demande déclenchée après réception définitive (consultant)',
    });
    setPaymentOpen(true);
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Validation d'avancement</CardTitle>
          <CardDescription>Aucun projet ne vous est assigné en tant que consultant.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Projet suivi</CardTitle>
          <CardDescription>
            Sélectionnez le projet dont vous validez l'avancement des phases et jalons.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[18rem] space-y-1">
            <Label htmlFor="consultant-project">Projet</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="consultant-project" aria-label="Sélectionner un projet suivi">
                <SelectValue placeholder="Choisir un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => openPaymentRequest(undefined, selectedProject?.progress)}
            disabled={!projectId}
          >
            <Wallet className="mr-2 h-4 w-4" aria-hidden="true" />
            Demande de paiement (réception)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Phases du projet</CardTitle>
          <CardDescription>
            Validez la progression constatée en inspection. À 100 %, déclenchez le décompte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des phases…
            </div>
          ) : phases.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Aucune phase enregistrée pour ce projet.</p>
          ) : (
            <Table>
              <caption className="sr-only">Phases du projet et validation de progression</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Phase</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Progression validée (%)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.map((phase) => {
                  const current = Number(phase.progress ?? 0);
                  const draft = drafts[phase.id] ?? String(current);
                  return (
                    <TableRow key={phase.id}>
                      <TableCell className="font-medium">
                        {phase.phaseName ?? phase.name ?? 'Phase'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={current >= 100 ? 'default' : 'secondary'}>
                          {current >= 100 ? 'Terminée' : (phase.status ?? 'en cours')}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-40">
                        <Progress value={Math.min(100, current)} aria-label={`Progression ${current}%`} />
                        <span className="text-xs text-muted-foreground">{current.toFixed(2)} %</span>
                      </TableCell>
                      <TableCell className="w-32">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={draft}
                          aria-label={`Progression validée pour ${phase.phaseName ?? phase.name}`}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [phase.id]: e.target.value }))
                          }
                        />
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleValidate(phase.id, current)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          disabled={Number(draft) < 100}
                          onClick={() => openPaymentRequest(phase.id, Number(draft))}
                        >
                          <Wallet className="mr-1 h-4 w-4" aria-hidden="true" />
                          Décompte
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Jalons</CardTitle>
          <CardDescription>Déclenchement des jalons contractuels validés en inspection.</CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Aucun jalon défini.</p>
          ) : (
            <Table>
              <caption className="sr-only">Jalons du projet</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Jalon</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.title}</TableCell>
                    <TableCell>
                      {m.targetDate ? new Date(m.targetDate).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'completed' ? 'default' : 'secondary'}>{m.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleMilestoneStatus(m.id, m.status)}
                      >
                        {m.status === 'completed' ? 'Réouvrir' : 'Valider'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UnifiedPaymentFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        origin="auto-post-inspection"
        defaults={paymentDefaults}
        lockProject
      />
    </div>
  );
}

export default ConsultantProgressValidation;
