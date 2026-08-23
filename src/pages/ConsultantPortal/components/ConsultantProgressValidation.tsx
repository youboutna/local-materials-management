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

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
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
          <CardTitle><T k="auto.consultantprogressvalidation.validation_d_avancement" fallback="Validation d'avancement" /></CardTitle>
          <CardDescription><T k="auto.consultantprogressvalidation.aucun_projet_ne_vous_est_assigne_en_tant_que_con" fallback="Aucun projet ne vous est assigné en tant que consultant." /></CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base"><T k="auto.consultantprogressvalidation.projet_suivi" fallback="Projet suivi" /></CardTitle>
          <CardDescription>
            <T k="auto.consultantprogressvalidation.selectionnez_le_projet_dont_vous_validez_l_avanc" fallback="Sélectionnez le projet dont vous validez l'avancement des phases et jalons." />
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[18rem] space-y-1">
            <Label htmlFor="consultant-project"><T k="auto.consultantprogressvalidation.projet" fallback="Projet" /></Label>
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
            <T k="auto.consultantprogressvalidation.demande_de_paiement_reception" fallback="Demande de paiement (réception)" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base"><T k="auto.consultantprogressvalidation.phases_du_projet" fallback="Phases du projet" /></CardTitle>
          <CardDescription>
            <T k="auto.consultantprogressvalidation.validez_la_progression_constatee_en_inspection_a" fallback="Validez la progression constatée en inspection. À 100 %, déclenchez le décompte." />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Chargement des phases…
            </div>
          ) : phases.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground"><T k="auto.consultantprogressvalidation.aucune_phase_enregistree_pour_ce_projet" fallback="Aucune phase enregistrée pour ce projet." /></p>
          ) : (
            <Table>
              <caption className="sr-only"><T k="auto.consultantprogressvalidation.phases_du_projet_et_validation_de_progression" fallback="Phases du projet et validation de progression" /></caption>
              <TableHeader>
                <TableRow>
                  <TableHead><T k="auto.consultantprogressvalidation.phase" fallback="Phase" /></TableHead>
                  <TableHead><T k="auto.consultantprogressvalidation.statut" fallback="Statut" /></TableHead>
                  <TableHead><T k="auto.consultantprogressvalidation.progression" fallback="Progression" /></TableHead>
                  <TableHead><T k="auto.consultantprogressvalidation.progression_validee" fallback="Progression validée (%)" /></TableHead>
                  <TableHead className="text-right"><T k="auto.consultantprogressvalidation.actions" fallback="Actions" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.map((phase) => {
                  const current = Number(phase.progress ?? 0);
                  const draft = drafts[phase.id] ?? String(current);
                  return (
                    <TableRow key={phase.id}>
                      <TableCell className="font-medium">
                        {phase.phaseName ?? 'Phase'}
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
                          aria-label={`Progression validée pour ${phase.phaseName}`}
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
                          <T k="auto.consultantprogressvalidation.valider" fallback="Valider" />
                        </Button>
                        <Button
                          size="sm"
                          disabled={Number(draft) < 100}
                          onClick={() => openPaymentRequest(phase.id, Number(draft))}
                        >
                          <Wallet className="mr-1 h-4 w-4" aria-hidden="true" />
                          <T k="auto.consultantprogressvalidation.decompte" fallback="Décompte" />
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
          <CardTitle className="text-base"><T k="auto.consultantprogressvalidation.jalons" fallback="Jalons" /></CardTitle>
          <CardDescription><T k="auto.consultantprogressvalidation.declenchement_des_jalons_contractuels_valides_en" fallback="Déclenchement des jalons contractuels validés en inspection." /></CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground"><T k="auto.consultantprogressvalidation.aucun_jalon_defini" fallback="Aucun jalon défini." /></p>
          ) : (
            <Table>
              <caption className="sr-only"><T k="auto.consultantprogressvalidation.jalons_du_projet" fallback="Jalons du projet" /></caption>
              <TableHeader>
                <TableRow>
                  <TableHead><T k="auto.consultantprogressvalidation.jalon" fallback="Jalon" /></TableHead>
                  <TableHead><T k="auto.consultantprogressvalidation.echeance" fallback="Échéance" /></TableHead>
                  <TableHead><T k="auto.consultantprogressvalidation.statut" fallback="Statut" /></TableHead>
                  <TableHead className="text-right"><T k="auto.consultantprogressvalidation.action" fallback="Action" /></TableHead>
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
                      <Badge variant={m.status === 'completed' ? 'default' : 'secondary'}><TranslatedStatus code={m.status} /></Badge>
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
