/**
 * ConsultantInspectionsPanel — contexte « Contrôle » :
 * consulter les phases, réaliser une inspection, valider une phase,
 * vérifier la conformité documentaire avant validation.
 *
 * Aucune requête Supabase directe : hooks hexagonaux uniquement.
 */
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, ClipboardCheck, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { usePhasesHex } from '@/hooks/hexagonal/usePhasesHex';
import { useInspectionsListHex } from '@/hooks/hexagonal/useInspectionsListHex';
import { useCreateInspection } from '@/hooks/hexagonal/useInspectionsCrudHex';
import { useI18n } from '@/hooks/useI18n';

interface ProjectOption {
  id: string;
  title?: string | null;
}

interface Props {
  projects: ProjectOption[];
}

export function ConsultantInspectionsPanel({ projects }: Props) {
  const { t, translateStatus, formatDate } = useI18n();
  const [projectId, setProjectId] = useState<string>('');
  const { phases, isLoading, updatePhase, isUpdating, refetch } = usePhasesHex(projectId || undefined);
  const { data: inspections = [], refetch: refetchInspections } = useInspectionsListHex(projectId || '');
  const createInspection = useCreateInspection();

  const [dialogPhaseId, setDialogPhaseId] = useState<string | null>(null);
  const [form, setForm] = useState({ inspector: '', progress: '0', comments: '' });

  /** Conformité : une phase est validable si elle porte au moins une inspection réalisée. */
  const inspectionsByPhase = useMemo(() => {
    const map = new Map<string, number>();
    for (const insp of inspections as unknown as Array<Record<string, unknown>>) {
      const phaseId = (insp.phaseId ?? insp.phase_id) as string | undefined;
      if (!phaseId) continue;
      map.set(phaseId, (map.get(phaseId) ?? 0) + 1);
    }
    return map;
  }, [inspections]);

  const submitInspection = async () => {
    if (!dialogPhaseId || !projectId) return;
    if (!form.inspector.trim()) {
      toast.error(t('inspection.inspector_required') || 'Nom de l’inspecteur requis');
      return;
    }
    try {
      await createInspection.mutateAsync({
        projectId,
        phaseId: dialogPhaseId,
        inspector: form.inspector.trim(),
        date: new Date().toISOString(),
        status: 'completed',
        progressAtInspection: Number(form.progress) || 0,
        comments: form.comments,
      } as never);
      toast.success(t('inspection.created') || 'Inspection enregistrée');
      setDialogPhaseId(null);
      setForm({ inspector: '', progress: '0', comments: '' });
      await refetchInspections();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const validatePhase = async (phaseId: string, progress: number) => {
    if (!inspectionsByPhase.get(phaseId)) {
      toast.error(
        t('consultant.phase.compliance_blocked') ||
          'Conformité non vérifiée : réalisez une inspection avant de valider la phase.',
      );
      return;
    }
    const ok = await updatePhase(phaseId, { status: 'validated', progress });
    if (ok) {
      toast.success(t('consultant.phase.validated') || 'Phase validée');
      await refetch();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
            {t('consultant.inspections.title') || 'Inspections et validation de conformité'}
          </CardTitle>
          <CardDescription>
            {t('consultant.inspections.description') ||
              'Consultez les phases, réalisez une inspection puis validez la phase une fois la conformité vérifiée.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md space-y-1">
            <Label htmlFor="consultant-inspection-project">{t('common.project') || 'Projet'}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger id="consultant-inspection-project">
                <SelectValue placeholder={t('common.choose_project') || 'Choisir un projet…'} />
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

          {!projectId ? (
            <p className="text-sm text-muted-foreground">
              {t('common.no_project_selected') || 'Aucun projet sélectionné.'}
            </p>
          ) : isLoading ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {t('common.loading') || 'Chargement…'}
            </p>
          ) : phases.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t('phases.empty') || 'Aucune phase enregistrée pour ce projet.'}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.phase') || 'Phase'}</TableHead>
                  <TableHead>{t('common.status') || 'Statut'}</TableHead>
                  <TableHead>{t('common.progress') || 'Avancement'}</TableHead>
                  <TableHead>{t('consultant.inspections.count') || 'Inspections'}</TableHead>
                  <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.map((phase) => {
                  const progress = Number(phase.progress ?? 0);
                  const count = inspectionsByPhase.get(phase.id) ?? 0;
                  const isValidated = phase.status === 'validated';
                  return (
                    <TableRow key={phase.id}>
                      <TableCell className="font-medium">{phase.phaseName ?? 'Phase'}</TableCell>
                      <TableCell>
                        <Badge variant={isValidated ? 'default' : 'secondary'}>
                          {translateStatus(phase.status ?? 'in_progress')}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-40">
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={count > 0 ? 'outline' : 'destructive'} className="gap-1">
                          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                          {count}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDialogPhaseId(phase.id);
                            setForm({ inspector: '', progress: String(progress), comments: '' });
                          }}
                        >
                          {t('consultant.inspections.perform') || 'Réaliser une inspection'}
                        </Button>
                        <Button
                          size="sm"
                          disabled={isUpdating || isValidated}
                          onClick={() => validatePhase(phase.id, progress)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" aria-hidden="true" />
                          {t('consultant.phase.validate') || 'Valider la phase'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {inspections.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {(t('consultant.inspections.last') || 'Dernière inspection') + ' : '}
              {formatDate(
                ((inspections as unknown as Array<Record<string, unknown>>)[0]?.date ??
                  (inspections as unknown as Array<Record<string, unknown>>)[0]?.scheduledDate) as string,
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!dialogPhaseId} onOpenChange={(open) => !open && setDialogPhaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('consultant.inspections.perform') || 'Réaliser une inspection'}</DialogTitle>
            <DialogDescription>
              {t('consultant.inspections.dialog_description') ||
                'Le rapport est rattaché à la phase et conditionne la validation de conformité.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="insp-inspector">{t('inspection.inspector') || 'Inspecteur'}</Label>
              <Input
                id="insp-inspector"
                value={form.inspector}
                onChange={(e) => setForm((f) => ({ ...f, inspector: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="insp-progress">{t('common.progress') || 'Avancement'} (%)</Label>
              <Input
                id="insp-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((f) => ({ ...f, progress: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="insp-comments">{t('common.comments') || 'Observations'}</Label>
              <Textarea
                id="insp-comments"
                value={form.comments}
                onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogPhaseId(null)}>
              {t('common.cancel') || 'Annuler'}
            </Button>
            <Button onClick={submitInspection} disabled={createInspection.isPending}>
              {createInspection.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('common.save') || 'Enregistrer'}
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConsultantInspectionsPanel;
