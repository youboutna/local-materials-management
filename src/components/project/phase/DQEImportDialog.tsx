/**
 * DQEImportDialog
 * Upload a DQE workbook (xlsx/xls), preview parsed rows, choose a default
 * material, then batch-create QuantityTakeoff records linked to the current phase.
 *
 * Pure UI: business logic lives in DQEImportService (see mem://constraints/no-react-in-services).
 */

import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAvailableMaterials } from '@/hooks/hexagonal';
import DQEImportService, {
  type DQEParseResult,
} from '@/application/services/DQEImportService';

interface DQEImportDialogProps {
  projectId: string;
  phaseId: string;
  trigger?: React.ReactNode;
}

const DQEImportDialog: React.FC<DQEImportDialogProps> = ({ projectId, phaseId, trigger }) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<DQEParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [defaultMaterialId, setDefaultMaterialId] = useState<string>('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: materials, isLoading: materialsLoading } = useAvailableMaterials();

  const resetState = () => {
    setFile(null);
    setParseResult(null);
    setParseError(null);
    setDefaultMaterialId('');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setParseResult(null);
    setParseError(null);
    if (!selected) return;

    setParsing(true);
    try {
      const result = await DQEImportService.parseFile(selected);
      setParseResult(result);
      if (result.rows.length === 0) {
        setParseError('Aucune ligne DQE détectée dans le fichier.');
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parseResult || !defaultMaterialId) return;
    setImporting(true);
    try {
      const { created, failed } = await DQEImportService.importRows(parseResult.rows, {
        projectId,
        phaseId,
        defaultMaterialId,
      });

      queryClient.invalidateQueries({ queryKey: ['quantity-takeoffs', projectId] });
      queryClient.invalidateQueries({ queryKey: ['phase-materials', phaseId] });

      toast({
        title: `${created.length} ligne(s) importée(s)`,
        description: failed.length
          ? `${failed.length} ligne(s) ignorée(s) — voir l'aperçu pour le détail.`
          : 'Tout le DQE a été ajouté à la phase.',
        variant: failed.length ? 'default' : 'default',
      });

      if (created.length > 0) {
        setOpen(false);
        resetState();
      }
    } catch (error) {
      toast({
        title: 'Échec de l\'import',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parseResult?.validRows ?? 0;
  const invalidCount = (parseResult?.rows.length ?? 0) - validCount;

  const totalValueLabel = useMemo(() => {
    if (!parseResult) return '';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MRU',
      maximumFractionDigits: 0,
    }).format(parseResult.totalValue);
  }, [parseResult]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetState();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer DQE
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importer un DQE dans la phase
          </DialogTitle>
          <DialogDescription>
            Charger un devis quantitatif estimatif (.xlsx / .xls). Les colonnes attendues sont
            <em> Désignation, Unité, Quantité, Prix unitaire</em>. Les lignes seront créées comme
            métrés rattachés à cette phase.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="dqe-file">Fichier DQE</Label>
            <Input
              id="dqe-file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={parsing || importing}
            />
          </div>

          {parsing && (
            <p className="text-sm text-muted-foreground">Analyse du fichier en cours…</p>
          )}

          {parseError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <span className="text-destructive">{parseError}</span>
            </div>
          )}

          {parseResult && parseResult.rows.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" /> {validCount} valides
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> {invalidCount} en erreur
                  </Badge>
                )}
                <Badge variant="outline">Total estimé : {totalValueLabel}</Badge>
                <Badge variant="outline">Feuille : {parseResult.sheetName}</Badge>
              </div>

              <div>
                <Label htmlFor="default-material">Matériau par défaut *</Label>
                <Select value={defaultMaterialId} onValueChange={setDefaultMaterialId}>
                  <SelectTrigger id="default-material">
                    <SelectValue
                      placeholder={
                        materialsLoading ? 'Chargement…' : 'Sélectionner un matériau'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(materials ?? []).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} {m.unit ? `(${m.unit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  La désignation et l'unité d'origine sont conservées dans la note de chaque
                  métré.
                </p>
              </div>

              <ScrollArea className="h-64 rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 text-left">
                    <tr>
                      <th className="px-2 py-1 w-10">#</th>
                      <th className="px-2 py-1">Poste</th>
                      <th className="px-2 py-1">Désignation</th>
                      <th className="px-2 py-1 w-16">Unité</th>
                      <th className="px-2 py-1 w-20 text-right">Qté</th>
                      <th className="px-2 py-1 w-24 text-right">PU</th>
                      <th className="px-2 py-1 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.rows.map((row) => (
                      <tr
                        key={row.lineNumber}
                        className={
                          row.errors.length > 0
                            ? 'bg-destructive/5 text-destructive'
                            : 'border-t'
                        }
                        title={row.errors.join(', ') || undefined}
                      >
                        <td className="px-2 py-1">{row.lineNumber}</td>
                        <td className="px-2 py-1">
                          {row.category?.label.fr ?? row.categoryCode ?? '—'}
                        </td>
                        <td className="px-2 py-1 truncate max-w-xs">{row.designation || '—'}</td>
                        <td className="px-2 py-1">{row.unit || '—'}</td>
                        <td className="px-2 py-1 text-right">{row.quantity.toLocaleString('fr-FR')}</td>
                        <td className="px-2 py-1 text-right">{row.unitPrice.toLocaleString('fr-FR')}</td>
                        <td className="px-2 py-1 text-right">
                          {row.totalPrice.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={importing}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={!parseResult || validCount === 0 || !defaultMaterialId || importing}
          >
            {importing ? 'Import en cours…' : `Importer ${validCount} ligne(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DQEImportDialog;
