/**
 * BoqImportDialog — one dialog for ALL BOQ imports.
 * Sources: 'quantity_takeoff' | 'dqe' | 'supplier_bid' | 'tender_estimate'.
 *
 * P0/P1 features:
 *  - Pre-commit unit/dimension validation with per-row messages (BoqValidatorService).
 *  - Default WBS (Phase › Jalon › Tâche) applied to every imported line.
 *  - Column mapping wizard, dropzone, live preview.
 */
import { useMemo, useState } from 'react';
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
import { getReferentialOptions, type ReferentialType } from '@/config/referentials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Props {
  source: BoqSource;
  contextId: string;
  phaseId?: string;
  /** Optional project referential (SOMELEC / PNDS / SDAU / MR_PUBLIC …) used to
   *  auto-classify each line into Phase → Étape[Jalon] → Tâche. */
  defaultReferentialCode?: ReferentialType;
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

export function BoqImportDialog({ source, contextId, phaseId, defaultReferentialCode, trigger, title, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [wbs, setWbs] = useState<WbsValue>({ phaseId: phaseId ?? null });
  const [referentialCode, setReferentialCode] = useState<ReferentialType | undefined>(defaultReferentialCode);
  const refOptions = useMemo(() => getReferentialOptions(), []);
  const { parseResult, mapping, applyMapping, dtos, isBusy, error, parseFile, commit, setDtos } =
    useBoqImport({ source, contextId, phaseId, referentialCode });
  const { toast } = useToast();

  const wbsEnrichedDtos = useMemo<BoqLineDTO[]>(() => {
    return dtos.map((l) => ({
      ...l,
      phaseId: l.phaseId ?? wbs.phaseId ?? undefined,
      milestoneId: l.milestoneId ?? wbs.milestoneId ?? undefined,
      taskId: l.taskId ?? wbs.taskId ?? undefined,
    }));
  }, [dtos, wbs]);

  const issues = useMemo(() => validateLines(wbsEnrichedDtos), [wbsEnrichedDtos]);

  const onSubmit = async () => {
    if (issues.length > 0) {
      toast({
        title: `${issues.length} ligne(s) invalide(s)`,
        description: 'Corrigez les unités / dimensions avant import.',
        variant: 'destructive',
      });
      return;
    }
    try {
      // Push WBS-enriched dtos back to hook state before commit
      setDtos(wbsEnrichedDtos);
      const r = await commit();
      toast({ title: 'Import terminé', description: `${r.length} ligne(s) créée(s).` });
      // Broadcast so KPI panels (Métrés / DQE) auto-refresh across the app
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
            <section>
              <h4 className="text-sm font-medium mb-2">WBS par défaut (appliqué aux lignes sans phase/jalon/tâche)</h4>
              <WbsSelector value={wbs} onChange={setWbs} disabled={isBusy} />
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
              <h4 className="text-sm font-medium mb-2">Aperçu ({wbsEnrichedDtos.length} lignes)</h4>
              <BoqLineTable lines={wbsEnrichedDtos} emptyLabel="Aucune ligne détectée avec le mapping courant." />
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
