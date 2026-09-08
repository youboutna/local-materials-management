/**
 * src/components/boq/MetreDialog.tsx
 * Dialogue « Calcul métré » — saisie des dimensions L / l / h + type d'ouvrage,
 * calcul temps réel via MeterService (référentiel `element-types` / `formulas`)
 * et application du résultat (quantité + unité verrouillée) à la ligne ciblée.
 */
import { useEffect, useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ELEMENT_TYPES } from '@/config/referentials/boq/element-types.referential';
import { MeterService } from '@/application/services/boq/MeterService';

export interface MetreDialogValue {
  elementType: string | null;
  unit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  quantity: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<MetreDialogValue> & { designation?: string | null };
  onApply: (value: MetreDialogValue) => void;
}

const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')));

export function MetreDialog({ open, onOpenChange, initial, onApply }: Props) {
  const [elementType, setElementType] = useState<string | null>(initial?.elementType ?? null);
  const [length, setLength] = useState<number | null>(initial?.length ?? null);
  const [width, setWidth] = useState<number | null>(initial?.width ?? null);
  const [height, setHeight] = useState<number | null>(initial?.height ?? null);

  useEffect(() => {
    if (!open) return;
    setElementType(initial?.elementType ?? null);
    setLength(initial?.length ?? null);
    setWidth(initial?.width ?? null);
    setHeight(initial?.height ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const dims = MeterService.dimensionsFor(elementType);
  const result = useMemo(
    () => MeterService.quantityFor({ designation: initial?.designation, elementType, length, width, height }),
    [initial?.designation, elementType, length, width, height],
  );
  const unit = result.unit ?? initial?.unit ?? 'u';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,620px)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" /> Calcul métré
          </DialogTitle>
          <DialogDescription>
            La quantité et l'unité découlent du type d'ouvrage (référentiel) et des dimensions saisies.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {initial?.designation ? (
            <p className="rounded-md border bg-muted/40 p-2 text-sm">{initial.designation}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Type d'ouvrage (métré)</Label>
              <Select value={elementType ?? 'generic'} onValueChange={(v) => setElementType(v === 'generic' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generic">— forfait / saisie libre —</SelectItem>
                  {ELEMENT_TYPES.map((e) => (
                    <SelectItem key={e.code} value={e.code}>{e.label} ({e.defaultUnit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Unité (verrouillée)</Label>
              <Input value={unit} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {dims.length && (
              <div className="space-y-1">
                <Label className="text-[11px]">Longueur L (m)</Label>
                <Input inputMode="decimal" value={length ?? ''} onChange={(e) => setLength(num(e.target.value))} />
              </div>
            )}
            {dims.width && (
              <div className="space-y-1">
                <Label className="text-[11px]">Largeur l (m)</Label>
                <Input inputMode="decimal" value={width ?? ''} onChange={(e) => setWidth(num(e.target.value))} />
              </div>
            )}
            {dims.height && (
              <div className="space-y-1">
                <Label className="text-[11px]">Hauteur h (m)</Label>
                <Input inputMode="decimal" value={height ?? ''} onChange={(e) => setHeight(num(e.target.value))} />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">{result.formula}</span>
            <Badge variant="secondary">Quantité : {Number(result.quantity.toFixed(3))} {unit}</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => {
              onApply({ elementType, unit, length, width, height, quantity: result.quantity });
              onOpenChange(false);
            }}
          >
            Appliquer à la ligne
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
