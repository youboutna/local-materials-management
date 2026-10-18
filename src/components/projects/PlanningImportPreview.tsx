import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {useLanguage} from '@/contexts/LanguageContext';
import {projectImportTemplateService} from '@/application/services/ProjectImportTemplateService';
import {ProjectMetricsOrchestrator} from '@/application/services/ProjectMetricsOrchestrator';
import ProjectGanttTimeline from '@/components/project/ProjectGanttTimeline';
import UnifiedPERTAnalysis from '@/components/project/UnifiedPERTAnalysis';
import {DEFAULT_PLANNING_MAPPING} from '@/config/referentials/projects/planning-import.referential';
import type {PlanningPreviewDTO,PlanningTextMappingDTO} from '@/dtos/entities/PlanningPreviewDTO';
import {Download,Eye} from 'lucide-react';
export function PlanningImportPreview({referentialCode,onPrepared}:{referentialCode:string;onPrepared:(file:File)=>void}) {
  const {t}=useLanguage();
  const [text,setText]=useState('');const [title,setTitle]=useState('');const [reference,setReference]=useState('');const [date,setDate]=useState('');const [currency,setCurrency]=useState('MRU');
  const [mapping,setMapping]=useState<PlanningTextMappingDTO>({...DEFAULT_PLANNING_MAPPING});
  const [preview,setPreview]=useState<PlanningPreviewDTO>();const [error,setError]=useState('');
  const metrics=preview?ProjectMetricsOrchestrator.compute({project:{title:preview.project.title,startDate:preview.project.startDate,endDate:preview.project.endDate},phases:preview.project.phases?.map((phase,index)=>({id:phase.externalRef ?? String(index),name:phase.name,startDate:phase.startDate,endDate:phase.endDate,progress:0}))}):undefined;
  const prepare=()=>{if(!preview)return;const file=new File([JSON.stringify({projects:[preview.project]},null,2)],`${reference}.json`,{type:'application/json'});onPrepared(file);};
  return <details className="border-y border-border py-4"><summary className="font-medium cursor-pointer">{t('planning.pasted')}</summary><div className="space-y-4 pt-4">
    <div className="grid gap-3 sm:grid-cols-2"><div><Label>{t('planning.title')}</Label><Input value={title} onChange={e=>{setTitle(e.target.value);setPreview(undefined);}} /></div><div><Label>{t('planning.reference')}</Label><Input value={reference} onChange={e=>{setReference(e.target.value);setPreview(undefined);}} /></div><div><Label>{t('planning.anchor')}</Label><Input type="date" value={date} onChange={e=>{setDate(e.target.value);setPreview(undefined);}} /></div><div><Label>{t('planning.currency')}</Label><Input value={currency} onChange={e=>{setCurrency(e.target.value);setPreview(undefined);}} /></div></div>
    <Textarea aria-label={t('planning.source')} placeholder={t('planning.source')} rows={8} value={text} onChange={e=>{setText(e.target.value);setPreview(undefined);}} />
    <details><summary className="cursor-pointer">{t('planning.mapping')}</summary><div className="grid gap-3 sm:grid-cols-2 pt-3">{(['phaseColumn','missionsColumn','scheduleColumn','deliverableColumn','daysPerWeek'] as const).map(key=><div key={key}><Label>{t(`planning.${key}`)}</Label><Input type="number" min="0" value={mapping[key]} onChange={e=>{setMapping({...mapping,[key]:Number(e.target.value)});setPreview(undefined);}} /></div>)}{(['weekPattern','postDeliveryPattern','milestonePattern'] as const).map(key=><div key={key}><Label>{t(`planning.${key}`)}</Label><Input value={mapping[key]} onChange={e=>{setMapping({...mapping,[key]:e.target.value});setPreview(undefined);}} /></div>)}</div></details>
    <Button variant="outline" onClick={()=>{setError('');try{setPreview(projectImportTemplateService.previewPlanning({text,title,reference,startDate:date,currency,referentialCode,mapping}));}catch(e){setError(e instanceof Error?e.message:t('common.error'));}}}><Eye className="h-4 w-4 mr-2" />{t('planning.preview')}</Button>
    {error&&<p role="alert" className="text-destructive">{error}</p>}
    {preview&&<><div className="divide-y divide-border">{preview.project.phases?.map((phase,index)=><div key={phase.externalRef} className="grid gap-3 py-3 sm:grid-cols-3"><Input aria-label={t('planning.phase')} value={phase.name} onChange={e=>setPreview({...preview,project:{...preview.project,phases:preview.project.phases?.map((p,i)=>i===index?{...p,name:e.target.value}:p)}})} /><span>{phase.startDate} → {phase.endDate}</span><span className="break-words">{phase.milestones?.map(item=>`${item.title} · ${item.targetDate}`).join(' / ')}</span></div>)}</div>{metrics&&<><ProjectGanttTimeline gantt={metrics.gantt} /><UnifiedPERTAnalysis pert={metrics.pert} referenceDurationDays={metrics.referenceDurationDays} /></>}{preview.warnings.map((warning,index)=><p key={index} className="text-destructive">{warning}</p>)}<details open={preview.unmatchedLines.length>0}><summary className="cursor-pointer">{t('planning.unmapped')} ({preview.unmatchedLines.length})</summary><div className="max-h-64 overflow-auto text-sm">{preview.unmatchedLines.map(line=><p key={line.line} className="py-1 break-words">{line.line}: {line.text}</p>)}</div></details><Button onClick={prepare}><Download className="h-4 w-4 mr-2" />{t('planning.prepare')}</Button></>}
  </div></details>;
}