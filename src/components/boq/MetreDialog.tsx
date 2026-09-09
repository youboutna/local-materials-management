/**
 * src/components/boq/MetreDialog.tsx
 * Dialogue « Calcul métré » — saisie des dimensions L / l / h, ouvertures à
 * déduire (portes / fenêtres) et type d'ouvrage ; calcul temps réel via
 * MeterService (référentiels `element-types` / `formulas`) et recommandations
 * métier issues du référentiel `boq/recommendations`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Calculator, Lightbulb } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ELEMENT_TYPES } from '@/config/referentials/boq/element-types.referential';
import { getRecommendationItems } from '@/config/referentials/boq/recommendations.referential';
import { MeterService } from '@/application/services/boq/MeterService';
import type { MeterOpening } from '@/dtos/boq/MeterInputDTO';
import { T } from '@/components/i18n/T';
import { useLanguage } from '@/contexts/LanguageContext';

export interface MetreDialogValue {
  elementType: string | null;
  unit: string;
  length: number | null;
  width: number | null;
  height: number | null;
  quantity: number;
  openings?: MeterOpening[];
  deductOpenings?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Partial<MetreDialogValue> & { designation?: string | null };
  onApply: (value: MetreDialogValue) => void;
}

const num = (v: string) => (v === '' ? null : Number(v.replace(',', '.')));

export function MetreDialog({ open, onOpenChange, initial, onApply }: Props) {
  const { t } = useLanguage();
  const [elementType, setElementType] = useState<string | null>(initial?.elementType ?? null);
  const [length, setLength] = useState<number | null>(initial?.length ?? null);
  const [width, setWidth] = useState<number | null>(initial?.width ?? null);
  const [height, setHeight] = useState<number | null>(initial?.height ?? null);
  const [openCount, setOpenCount] = useState<number | null>(null);
  const [openWidth, setOpenWidth] = useState<number | null>(null);
  const [openHeight, setOpenHeight] = useState<number | null>(null);
  const [deduct, setDeduct] = useState(true);

  useEffect(() => {
    if (!open) return;
    setElementType(initial?.elementType ?? null);
    setLength(initial?.length ?? null);
    setWidth(initial?.width ?? null);
    setHeight(initial?.height ?? null);
    const first = initial?.openings?.[0];
    setOpenCount(first?.count ?? null);
    setOpenWidth(first?.width ?? null);
    setOpenHeight(first?.height ?? null);
    setDeduct(initial?.deductOpenings ?? true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openings = useMemo<MeterOpening[]>(
    () => (openWidth && openHeight ? [{ width: openWidth, height: openHeight, count: openCount ?? 1 }] : []),
    [openWidth, openHeight, openCount],
  );

  const dims = MeterService.dimensionsFor(elementType);
  const result = useMemo(
    () => MeterService.quantityFor({
      designation: initial?.designation, elementType, length, width, height,
      openings, deductOpenings: deduct,
    }),
    [initial?.designation, elementType, length, width, height, openings, deduct],
  );
  const unit = result.unit ?? initial?.unit ?? 'u';
  const recommendations = useMemo(() => getRecommendationItems(elementType ?? ''), [elementType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[min(96vw,680px)] max-w-none overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" /> <T k="auto.metredialog.calcul_metre" fallback="Calcul métré" />
          </DialogTitle>
          <DialogDescription>
            La quantité et l'unité découlent du type d'ouvrage (référentiel), des dimensions saisies et des ouvertures déduites.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {initial?.designation ? (
            <p className="rounded-md border bg-muted/40 p-2 text-sm">{initial.designation}</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-[11px]"><T k="auto.metredialog.type_d_ouvrage_metre" fallback="Type d'ouvrage (métré)" /></Label>
              <Select value={elementType ?? 'generic'} onValueChange={(v) => setElementType(v === 'generic' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="generic">— forfait / saisie libre —</SelectItem>
                  {ELEMENT_TYPES.map((e) => (
                    <SelectItem key={e.code} value={e.code}>{e.label} ({e.defaultUnit})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]"><T k="auto.metredialog.unite_verrouillee" fallback="Unité (verrouillée)" /></Label>
              <Input value={unit} readOnly className="bg-muted" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {dims.length && (
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.longueur_l_m" fallback="Longueur L (m)" /></Label>
                <Input inputMode="decimal" value={length ?? ''} onChange={(e) => setLength(num(e.target.value))} />
              </div>
            )}
            {dims.width && (
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.largeur_l_m" fallback="Largeur l (m)" /></Label>
                <Input inputMode="decimal" value={width ?? ''} onChange={(e) => setWidth(num(e.target.value))} />
              </div>
            )}
            {dims.height && (
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.hauteur_h_m" fallback="Hauteur h (m)" /></Label>
                <Input inputMode="decimal" value={height ?? ''} onChange={(e) => setHeight(num(e.target.value))} />
              </div>
            )}
          </div>

          {/* Ouvertures à déduire (portes, fenêtres, trémies de dalle…) */}
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground"><T k="auto.metredialog.ouvertures_a_deduire" fallback="Ouvertures à déduire" /></span>
              <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <T k="auto.metredialog.deduire" fallback="Déduire" />
                <Switch checked={deduct} onCheckedChange={setDeduct} aria-label={t('auto.metredialog.deduire_les_ouvertures')} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.nombre" fallback="Nombre" /></Label>
                <Input inputMode="numeric" value={openCount ?? ''} onChange={(e) => setOpenCount(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.largeur_m" fallback="Largeur (m)" /></Label>
                <Input inputMode="decimal" value={openWidth ?? ''} onChange={(e) => setOpenWidth(num(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]"><T k="auto.metredialog.hauteur_m" fallback="Hauteur (m)" /></Label>
                <Input inputMode="decimal" value={openHeight ?? ''} onChange={(e) => setOpenHeight(num(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">{result.formula}</span>
            <Badge variant="secondary">Quantité : {Number(result.quantity.toFixed(3))} {unit}</Badge>
          </div>

          {/* Recommandations métier selon le type d'ouvrage */}
          {recommendations.length > 0 && (
            <div className="rounded-md border p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Lightbulb className="h-3.5 w-3.5 text-primary" /> Recommandations ({recommendations.length})
              </div>
              <ul className="grid gap-1 text-xs sm:grid-cols-2">
                {recommendations.map((r) => (
                  <li key={r.label} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}><T k="auto.metredialog.annuler" fallback="Annuler" /></Button>
          <Button
            onClick={() => {
              onApply({
                elementType, unit, length, width, height,
                quantity: result.quantity,
                openings, deductOpenings: deduct,
              });
              onOpenChange(false);
            }}
          >
            <T k="auto.metredialog.appliquer_a_la_ligne" fallback="Appliquer à la ligne" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
