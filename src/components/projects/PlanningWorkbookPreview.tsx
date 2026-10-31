import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { projectImportTemplateService } from '@/application/services/ProjectImportTemplateService';
import { DEFAULT_WORKBOOK_MAPPING } from '@/config/referentials/projects/planning-import.referential';
import type { PlanningWorkbookDTO, PlanningWorkbookPreviewDTO } from '@/dtos/entities/PlanningWorkbookDTO';
import { Eye, Check, Paperclip } from 'lucide-react';

export function PlanningWorkbookPreview({ source, referentialCode, onPrepared, onSource }: {
  source: PlanningWorkbookDTO;
  referentialCode: string;
  onPrepared: (file: File) => void;
  onSource: (file: File) => void;
}) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('MRU');
  const [budget, setBudget] = useState('');
  const [mapping, setMapping] = useState({ ...DEFAULT_WORKBOOK_MAPPING });
  const [narrative, setNarrative] = useState('');
  const [preview, setPreview] = useState<PlanningWorkbookPreviewDTO>();
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const reset = () => { setPreview(undefined); setReviewed(false); };
  const prepare = () => {
    if (!preview || !reviewed) return;
    onPrepared(new File([JSON.stringify({ projects: [preview.project] }, null, 2)], `${reference}.json`, { type: 'application/json' }));
  };
  return <section className="min-w-0 space-y-4 border-y border-border py-4">
    <h3 className="font-medium">{t('planning.workbook')} · {source.sheets.length} {t('planning.sheets')}</h3>
    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">{source.sheets.map(sheet => <span key={sheet.name}>{sheet.name} ({sheet.rows.length})</span>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">
      {([{ key: 'title', value: title, set: setTitle }, { key: 'reference', value: reference, set: setReference }, { key: 'currency', value: currency, set: setCurrency }] as const).map(field => <div key={field.key}><Label htmlFor={`ptba-${field.key}`}>{t(`planning.${field.key}`)}</Label><Input id={`ptba-${field.key}`} placeholder={t(`planning.${field.key}`)} value={field.value} onChange={event => { field.set(event.target.value); reset(); }} /></div>)}
      <div><Label htmlFor="ptba-date">{t('planning.anchor')}</Label><Input id="ptba-date" type="date" value={date} onChange={event => { setDate(event.target.value); reset(); }} /></div>
      <div><Label htmlFor="ptba-scale">{t('planning.amountMultiplier')}</Label><Input id="ptba-scale" type="number" min="0" value={mapping.amountMultiplier} onChange={event => { setMapping({ ...mapping, amountMultiplier: Number(event.target.value) }); reset(); }} /></div>
      <div><Label htmlFor="ptba-budget">{t('planning.budget')} ({currency})</Label><Input id="ptba-budget" type="number" min="0" placeholder={t('planning.budget')} value={budget} onChange={event => { setBudget(event.target.value); reset(); }} /></div>
      <div><Label htmlFor="ptba-narrative" className="flex items-center gap-2"><Paperclip className="h-4 w-4" />{t('planning.narrative')}</Label><Input id="ptba-narrative" type="file" accept=".docx" disabled={reading} onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return;
        setReading(true); setError(''); reset();
        try { setNarrative(await projectImportTemplateService.readNarrative(file)); onSource(file); } catch (cause) { setNarrative(''); setError(cause instanceof Error ? cause.message : t('common.error')); } finally { setReading(false); }
      }} /></div>
    </div>
    <details><summary className="cursor-pointer">{t('planning.mapping')}</summary><div className="grid gap-3 pt-3 sm:grid-cols-3">{(Object.keys(DEFAULT_WORKBOOK_MAPPING) as Array<keyof typeof DEFAULT_WORKBOOK_MAPPING>).filter(key => key !== 'amountMultiplier').map(key => <div key={key}><Label htmlFor={`ptba-${key}`}>{t(`planning.${key}`)}</Label><Input id={`ptba-${key}`} type={typeof mapping[key] === 'number' ? 'number' : 'text'} min="0" value={mapping[key]} onChange={event => { setMapping({ ...mapping, [key]: typeof mapping[key] === 'number' ? Number(event.target.value) : event.target.value }); reset(); }} /></div>)}</div></details>
    <Button variant="outline" disabled={reading || !budget.trim()} onClick={() => {
      setError(''); setReviewed(false);
      try { setPreview(projectImportTemplateService.previewWorkbook({ source: { ...source, narrative }, title, reference, startDate: date, currency, budget: Number(budget), referentialCode, mapping })); } catch (cause) { setError(cause instanceof Error ? cause.message : t('common.error')); }
    }}><Eye className="mr-2 h-4 w-4" />{t('planning.preview')}</Button>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {preview && <>
      <div className="max-h-96 overflow-auto"><Table><TableHeader><TableRow><TableHead>{t('planning.sourceRow')}</TableHead><TableHead>{t('planning.codeColumn')}</TableHead><TableHead>{t('planning.title')}</TableHead><TableHead>{t('planning.responsibleColumn')}</TableHead><TableHead>{t('planning.quantityColumn')}</TableHead><TableHead>{t('planning.amountColumn')} ({currency})</TableHead></TableRow></TableHeader><TableBody>{preview.rows.filter(row => row.kind !== 'unmapped').map(row => <TableRow key={`${row.sheet}:${row.row}`}><TableCell>{row.sheet}:{row.row}</TableCell><TableCell>{row.code}</TableCell><TableCell className="min-w-48 whitespace-normal break-words">{row.title}</TableCell><TableCell>{row.responsible || '—'}</TableCell><TableCell>{row.quantity ?? '—'} {row.unit}</TableCell><TableCell>{row.amount?.toLocaleString() ?? '—'}</TableCell></TableRow>)}</TableBody></Table></div>
      <details open={preview.warnings.length > 0}><summary className="cursor-pointer">{t('planning.review')} ({preview.warnings.length})</summary><div className="max-h-48 overflow-auto text-sm">{preview.warnings.map((warning, index) => <p key={index} className="py-1 text-destructive">{warning.sheet}:{warning.row} · {t(`planning.warning.${warning.code}`)}</p>)}</div></details>
      <details><summary className="cursor-pointer">{t('planning.unmapped')} ({preview.rows.filter(row => row.kind === 'unmapped').length})</summary><div className="max-h-48 overflow-auto text-sm">{preview.rows.filter(row => row.kind === 'unmapped').map(row => <p key={`${row.sheet}:${row.row}`}>{row.sheet}:{row.row} · {row.code} {row.title} {row.sourceAmount ?? ''}</p>)}</div></details>
      <div className="flex items-start gap-2"><Checkbox id="ptba-reviewed" checked={reviewed} onCheckedChange={value => setReviewed(value === true)} /><Label htmlFor="ptba-reviewed">{t('planning.confirmReview')}</Label></div>
      <Button disabled={!reviewed} onClick={prepare}><Check className="mr-2 h-4 w-4" />{t('planning.prepare')}</Button>
    </>}
  </section>;
}