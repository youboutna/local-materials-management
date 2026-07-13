/**
 * BoqImportDialog — one dialog for ALL BOQ imports.
 * Sources: 'quantity_takeoff' | 'dqe' | 'supplier_bid' | 'tender_estimate'.
 *
 * P0/P1 features:
 *  - Pre-commit unit/dimension validation with per-row messages (BoqValidatorService).
 *  - Default WBS (Phase › Jalon › Tâche) applied to every imported line.
 *  - Column mapping wizard, dropzone, live preview.
 */
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImportDropzone } from './ImportDropzone';
import { ImportMappingWizard } from './ImportMappingWizard';
import { BoqLineTable } from './BoqLineTable';
import { WbsSelector, type WbsValue } from './WbsSelector';
import { useBoqImport } from '@/hooks/hexagonal/useBoqImport';
import { BoqValidatorService } from '@/application/services/boq/BoqValidatorService';
import type { BoqSource } from '@/domain/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { getReferentialOptions, getPhasesForReferential, type ReferentialType } from '@/config/referentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

interface Props {
  source: BoqSource;
  contextId: string;
  phaseId?: string;
  /** Optional project referential (SOMELEC / PNDS / SDAU / MR_PUBLIC …) used to
   *  auto-classify each line into Phase → Étape[Jalon] → Tâche. */
  defaultReferentialCode?: ReferentialType;
  /** Project owning the BOQ. Defaults to contextId for project-level sources. */
  projectId?: string;
  trigger: React.ReactNode;
  title?: string;
  onImported?: (count: number) => void;
}

interface RowIssue { index: number; designation: string; message: string }

function validateLines(lines: BoqLineDTO[]): RowIssue[] {
  const issues: RowIssue[] = [];
  lines.forEach((l, i) => {
    // Skip strict materialId check for imports (may be filled later)
    const res = BoqValidatorService.validate({
      materialId: l.materialId ?? 'import-placeholder',
      elementType: l.elementType ?? l.designation,
      unit: l.unit,
      length: l.length ?? l.quantity,
      width: l.width,
      height: l.height,
      unitPrice: l.unitPrice,
    });
    if (!res.ok) {
      issues.push({ index: i + 1, designation: l.designation, message: res.message });
    }
  });
  return issues;
}

export function BoqImportDialog({ source, contextId, phaseId, defaultReferentialCode, projectId, trigger, title, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [wbs, setWbs] = useState<WbsValue>({ phaseId: phaseId ?? null });
  const [projectReferentialCode, setProjectReferentialCode] = useState<ReferentialType | undefined>(defaultReferentialCode);
  const [referentialCode, setReferentialCode] = useState<ReferentialType | undefined>(defaultReferentialCode);
  const [phaseMapping, setPhaseMapping] = useState<Record<string, string>>({});
  const resolvedProjectId = projectId ?? (source === 'quantity_takeoff' || source === 'dqe' ? contextId : undefined);
  const refOptions = useMemo(() => getReferentialOptions(), []);
  const { parseResult, mapping, applyMapping, dtos, isBusy, error, parseFile, commit, setDtos } =
    useBoqImport({ source, contextId, phaseId, referentialCode });
  const { toast } = useToast();

  const isAltReferential = !!referentialCode && !!projectReferentialCode && referentialCode !== projectReferentialCode;
  const altPhases = useMemo(
    () => (isAltReferential && referentialCode ? getPhasesForReferential(referentialCode) : []),
    [isAltReferential, referentialCode]
  );
  const projectPhases = useMemo(
    () => (projectReferentialCode ? getPhasesForReferential(projectReferentialCode) : []),
    [projectReferentialCode]
  );

  const wbsEnrichedDtos = useMemo<BoqLineDTO[]>(() => {
    return dtos.map((l) => {
      const rawPhaseId = l.phaseId ?? wbs.phaseId ?? undefined;
      const mapped = isAltReferential && rawPhaseId ? phaseMapping[rawPhaseId] : undefined;
      return {
        ...l,
        phaseId: mapped ?? rawPhaseId,
        milestoneId: mapped ? undefined : (l.milestoneId ?? wbs.milestoneId ?? undefined),
        taskId: mapped ? undefined : (l.taskId ?? wbs.taskId ?? undefined),
      };
    });
  }, [dtos, wbs, isAltReferential, phaseMapping]);

  const issues = useMemo(() => validateLines(wbsEnrichedDtos), [wbsEnrichedDtos]);

  const updateLine = (index: number, patch: Partial<BoqLineDTO>) => {
    setDtos((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) return prev;
      const merged: BoqLineDTO = { ...current, ...patch };
      if (patch.quantity !== undefined || patch.unitPrice !== undefined) {
        merged.totalHt = (merged.quantity ?? 0) * (merged.unitPrice ?? 0);
      }
      next[index] = merged;
      return next;
    });
  };

  const removeLine = (index: number) => {
    setDtos((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (defaultReferentialCode) {
      setProjectReferentialCode(defaultReferentialCode);
      setReferentialCode(defaultReferentialCode);
    }
  }, [defaultReferentialCode]);

  useEffect(() => {
    if (!open || !resolvedProjectId || defaultReferentialCode) return;
    let cancelled = false;
    const loadProjectReferential = async () => {
      try {
        const service = new ProjectService(RepositoryFactory.getProjectRepository());
        const project = await service.getProjectById(resolvedProjectId);
        if (!cancelled && project?.referentialCode) {
          setProjectReferentialCode(project.referentialCode);
          setReferentialCode(project.referentialCode);
        }
      } catch {
        // Keep import usable even if project metadata cannot be loaded.
      }
    };
    loadProjectReferential();
    return () => { cancelled = true; };
  }, [defaultReferentialCode, open, resolvedProjectId]);

  useEffect(() => {
    if (!referentialCode || wbs.phaseId) return;
    const phases = getPhasesForReferential(referentialCode);
    if (phases.length > 0) {
      setWbs({ phaseId: phases[0].code, milestoneId: null, taskId: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referentialCode]);

  // Selecting a referential in the dialog NEVER persists to the project — the
  // project referential is managed by the project workflow module. When the
  // user picks an alternate one, a mapping panel appears instead.
  const handleReferentialChange = (next?: ReferentialType) => {
    setReferentialCode(next);
    setWbs({ phaseId: phaseId ?? null, milestoneId: null, taskId: null });
    setPhaseMapping({});
  };

  const onSubmit = async () => {
    if (issues.length > 0) {
      toast({
        title: `${issues.length} ligne(s) invalide(s)`,
        description: 'Corrigez les unités / dimensions avant import.',
        variant: 'destructive',
      });
      return;
    }
    if (isAltReferential && altPhases.some((p) => !phaseMapping[p.code])) {
      toast({
        title: 'Mapping incomplet',
        description: 'Associez chaque phase du référentiel choisi à une phase du projet.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setDtos(wbsEnrichedDtos);
      const r = await commit(wbsEnrichedDtos);
      toast({ title: 'Import terminé', description: `${r.length} ligne(s) créée(s).` });
      window.dispatchEvent(new CustomEvent('boq-imported', { detail: { source, contextId, count: r.length } }));
      onImported?.(r.length);
      setOpen(false);
    } catch (e) {
      toast({
        title: 'Import échoué',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title ?? 'Importer BOQ (PDF / Excel / CSV)'}</DialogTitle></DialogHeader>

        {!parseResult && <ImportDropzone onFile={parseFile} disabled={isBusy} />}

        {parseResult && (
          <>
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-medium">
                  Référentiel projet (auto-classification Phase → Étape[Jalon] → Tâche)
                </Label>
                {projectReferentialCode && (
                  <span className="text-xs text-muted-foreground">
                    Projet : <code>{projectReferentialCode}</code>
                  </span>
                )}
              </div>
              <Select
                value={referentialCode ?? '__none__'}
                onValueChange={(v) => handleReferentialChange(v === '__none__' ? undefined : (v as ReferentialType))}
                disabled={isBusy}
              >
                <SelectTrigger><SelectValue placeholder="Aucun (heuristiques FR par défaut)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Aucun (heuristiques FR par défaut)</SelectItem>
                  {refOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAltReferential && (
                <p className="text-xs text-muted-foreground">
                  Référentiel différent de celui du projet — le mapping ci-dessous convertit les phases vers le référentiel projet avant import.
                </p>
              )}
            </section>

            {isAltReferential && projectPhases.length > 0 && (
              <section className="rounded-md border p-3 space-y-2 bg-muted/30">
                <h4 className="text-sm font-medium">Mapping phases : référentiel choisi → référentiel projet</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {altPhases.map((altPh) => (
                    <div key={altPh.code} className="flex items-center gap-2">
                      <span className="text-xs flex-1 truncate" title={altPh.label}>{altPh.label}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Select
                        value={phaseMapping[altPh.code] ?? '__none__'}
                        onValueChange={(v) => setPhaseMapping((m) => ({ ...m, [altPh.code]: v === '__none__' ? '' : v }))}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="w-56 h-8"><SelectValue placeholder="Choisir phase projet" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— non mappée —</SelectItem>
                          {projectPhases.map((p) => (
                            <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h4 className="text-sm font-medium mb-2">WBS par défaut (appliqué aux lignes sans phase/jalon/tâche)</h4>
              <WbsSelector value={wbs} onChange={setWbs} disabled={isBusy} referentialCode={referentialCode} />
            </section>



            <ImportMappingWizard parseResult={parseResult} mapping={mapping} onChange={applyMapping} />

            {issues.length > 0 && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 space-y-1">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  {issues.length} ligne(s) invalide(s) — corriger avant import
                </div>
                <ul className="text-xs text-destructive/90 max-h-32 overflow-y-auto space-y-0.5 pl-6 list-disc">
                  {issues.slice(0, 15).map((i) => (
                    <li key={i.index}>#{i.index} — {i.designation || '(sans désignation)'} : {i.message}</li>
                  ))}
                  {issues.length > 15 && <li>… {issues.length - 15} de plus</li>}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Aperçu ({wbsEnrichedDtos.length} lignes) — éditable</h4>
              <BoqLineTable
                lines={wbsEnrichedDtos}
                emptyLabel="Aucune ligne détectée avec le mapping courant."
                editable
                referentialCode={referentialCode}
                onChange={updateLine}
                onRemove={removeLine}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={isBusy || !wbsEnrichedDtos.length || issues.length > 0}>
            {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importer {wbsEnrichedDtos.length} ligne(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
