import { useEffect, useState } from 'react';
import { FileScan, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTechnicalPlan } from '@/hooks/hexagonal/useTechnicalPlan';
import { useI18n } from '@/hooks/useI18n';
import type { TechnicalPlanElementDTO } from '@/dtos/boq/TechnicalPlanDTO';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { ToMeterInputsContext } from '@/application/services/boq/UnifiedBoqParser';
import { TechnicalPlanTransformer } from '@/dtos/transforms/TechnicalPlanTransformer';
import { ELEMENT_TYPES, type ElementTypeCode } from '@/config/referentials/boq/element-types.referential';

export function TechnicalPlanImport({ context, onPrepared, disabled }: {
  context: ToMeterInputsContext; onPrepared: (lines: BoqLineDTO[]) => void; disabled?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<TechnicalPlanElementDTO[]>([]);
  const source = useTechnicalPlan();
  useEffect(() => { setElements(source.plan?.elements ?? []); }, [source.plan]);
  const update = (index: number, value: TechnicalPlanElementDTO) => setElements((previous) => previous.map((element, row) => row === index ? value : element));
  const submit = async () => {
    try { onPrepared(await source.prepare(elements, context)); setOpen(false); source.reset(); }
    catch { /* error retained by hook */ }
  };
  return <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) source.reset(); }}>
    <DialogTrigger asChild><Button size="sm" variant="outline" disabled={disabled}><FileScan className="mr-1 h-4 w-4" />{t('plans.import')}</Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
      <DialogHeader><DialogTitle>{t('plans.import')}</DialogTitle></DialogHeader>
      <Input type="file" accept="application/pdf,.pdf" aria-label={t('plans.file')} disabled={source.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) void source.parse(file); }} />
      {source.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
      {source.error && <p role="alert" className="text-sm text-destructive">{source.error}</p>}
      {source.plan && <>
        <div className="text-sm">{source.plan.fileName} · {source.plan.pages.length} {t('plans.pages')}</div>
        <ul className="text-xs text-destructive">{source.plan.warnings.map((warning, index) => <li key={index}>{t(`plans.warning.${warning.code}`)} · {warning.page}</li>)}</ul>
        <div className="space-y-3">
          {elements.map((element, index) => <section key={`${index}:${element.page}`} className="border-b pb-3">
            <div className="mb-2 flex items-center gap-2">
              <Input className="max-w-32" value={element.ref} aria-label={t('plans.reference')} onChange={(event) => update(index, { ...element, ref: event.target.value, confirmed: false })} />
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={element.rawLabel}>{element.rawLabel}</span>
              <Button size="icon" variant="ghost" aria-label={t('plans.remove')} onClick={() => setElements((previous) => previous.filter((_, row) => row !== index))}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-6">
              <div><Label>{t('plans.type')}</Label><Select value={element.elementType} onValueChange={(value) => update(index, { ...element, elementType: value as ElementTypeCode, confirmed: false })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ELEMENT_TYPES.map((type) => <SelectItem key={type.code} value={type.code}>{t(`plans.type.${type.code}`)}</SelectItem>)}</SelectContent></Select></div>
              {(['length', 'width', 'height'] as const).map((field) => <div key={field}><Label>{t(`plans.${field}`)} (m)</Label><Input type="number" min="0" step="any" value={element[field] ?? ''} onChange={(event) => update(index, TechnicalPlanTransformer.updateDimension(element, field, event.target.value))} /></div>)}
              <div><Label>{t('plans.count')}</Label><Input type="number" min="1" step="1" value={element.count} onChange={(event) => update(index, { ...element, count: Number(event.target.value), confirmed: false })} /></div>
              <Label className="flex min-h-9 items-center gap-2"><Checkbox checked={element.confirmed} onCheckedChange={(value) => update(index, { ...element, confirmed: value === true })} />{t('plans.confirmed')}</Label>
            </div>
          </section>)}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={() => setElements((previous) => [...previous, { ref: `M${previous.length + 1}`, page: 1, rawLabel: '', elementType: 'concrete_beam', count: 1, confirmed: false }])}><Plus className="mr-1 h-4 w-4" />{t('plans.add')}</Button>
          <Button onClick={submit} disabled={source.isPending || !elements.some((element) => element.confirmed)}>{t('plans.prepare')}</Button>
        </div>
      </>}
    </DialogContent>
  </Dialog>;
}