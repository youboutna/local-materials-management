/**
 * BoqImportDialog — one dialog for ALL BOQ imports:
 *   - Project planning (source='quantity_takeoff', phaseId pré-rempli)
 *   - DQE import        (source='dqe')
 *   - Supplier bid      (source='supplier_bid')
 *   - Tender estimate   (source='tender_estimate')
 *
 * Composes ImportDropzone + ImportMappingWizard + BoqLineTable + useBoqImport.
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImportDropzone } from './ImportDropzone';
import { ImportMappingWizard } from './ImportMappingWizard';
import { BoqLineTable } from './BoqLineTable';
import { useBoqImport } from '@/hooks/hexagonal/useBoqImport';
import type { BoqSource } from '@/domain/boq/BoqLine';

interface Props {
  source: BoqSource;
  contextId: string;
  phaseId?: string;
  trigger: React.ReactNode;
  title?: string;
  onImported?: (count: number) => void;
}

export function BoqImportDialog({ source, contextId, phaseId, trigger, title, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const { parseResult, mapping, applyMapping, dtos, isBusy, error, parseFile, commit } =
    useBoqImport({ source, contextId, phaseId });
  const { toast } = useToast();

  const onSubmit = async () => {
    try {
      const r = await commit();
      toast({ title: 'Import terminé', description: `${r.length} lignes créées.` });
      onImported?.(r.length);
      setOpen(false);
    } catch (e) {
      toast({ title: 'Import échoué', description: e instanceof Error ? e.message : String(e), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title ?? 'Importer BOQ (PDF / Excel / CSV)'}</DialogTitle></DialogHeader>

        {!parseResult && <ImportDropzone onFile={parseFile} disabled={isBusy} />}

        {parseResult && (
          <>
            <ImportMappingWizard parseResult={parseResult} mapping={mapping} onChange={applyMapping} />
            <div>
              <h4 className="text-sm font-medium mb-2">Aperçu des lignes ({dtos.length})</h4>
              <BoqLineTable lines={dtos} emptyLabel="Aucune ligne détectée avec le mapping courant." />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={onSubmit} disabled={isBusy || !dtos.length}>
            {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Importer {dtos.length} ligne(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
