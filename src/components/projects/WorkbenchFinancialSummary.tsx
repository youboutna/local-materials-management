import { Link } from 'react-router-dom';
import { useWorkbenchFinance } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import ProjectGanttTimeline from '@/components/project/ProjectGanttTimeline';
import UnifiedPERTAnalysis from '@/components/project/UnifiedPERTAnalysis';
import { DecompteService } from '@/application/services/DecompteService';
import type { WorkbenchView } from '@/dtos/entities/ProjectWorkbenchDTO';

/** Presentation only; values and planning models come from canonical services. */
export function WorkbenchFinancialSummary({projectId,view}:{projectId:string;view:WorkbenchView}) {
  const {t,language}=useLanguage();
  const query=useWorkbenchFinance(projectId);
  if(query.isLoading) return <p role="status">{t('common.loading')}</p>;
  if(query.error) return <div><p role="alert" className="text-destructive">{query.error.message}</p><Button variant="outline" onClick={()=>query.refetch()}>{t('workbench.retry')}</Button></div>;
  if(!query.data) return null;
  const {financials,metrics,decomptes,payments}=query.data;
  const money=(value:number)=>`${value.toLocaleString(language)} ${financials.currency}`;
  if(view==='calendar') return <details className="border-y border-border py-3"><summary className="cursor-pointer font-medium">{t('workbench.planning_analysis')}</summary><div className="space-y-5 pt-4"><ProjectGanttTimeline gantt={metrics.gantt} /><UnifiedPERTAnalysis pert={metrics.pert} referenceDurationDays={metrics.referenceDurationDays} /></div></details>;
  if(view==='consumption') return <div className="divide-y divide-border">{[query.data.resources.human,query.data.resources.materials,query.data.resources.equipment].flatMap(bucket=>bucket.lines).map(line=><div key={line.id} className="grid gap-2 py-3 sm:grid-cols-3"><span className="font-medium">{line.name}</span><span>{t('workbench.planned')}: {line.plannedQuantity} {line.unit}</span><span>{t('workbench.actual')}: {line.actualQuantity} {line.unit}</span></div>)}</div>;
  if(view!=='expense' && view!=='revenue') return null;
  if(view==='revenue') return <div className="border-y border-border py-4"><p className="text-sm text-muted-foreground">{t('workbench.revenue_unreconciled')}</p><Button asChild variant="outline" className="mt-3"><Link to={`/dqe/list?projectId=${projectId}`}>{t('workbench.documents')}</Link></Button></div>;
  return <section className="space-y-4">
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-5">{(['budgetTotal','engaged','spent','paid','remainingToPay'] as const).map(key=><div key={key} className="border-b border-border py-3"><dt className="text-sm text-muted-foreground">{t(`workbench.financial_${key}`)}</dt><dd className="text-lg font-semibold">{money(financials[key])}</dd></div>)}</dl>
    <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to={`/dqe/list?projectId=${projectId}`}>{t('workbench.documents')}</Link></Button><Button asChild variant="outline"><Link to={`/projects/${projectId}?tab=financial`}>{t('workbench.manage_payments')}</Link></Button></div>
    <div className="divide-y divide-border">{decomptes.map(record=><div key={record.id} className="flex flex-wrap justify-between gap-3 py-3"><Link to={`/projects/${projectId}?tab=financial`} className="font-medium">{record.decompteNumber}</Link><span>{t(`workbench.status_${record.status}`)} · {money(record.validatedAmount)}</span></div>)}</div>
    <details><summary className="cursor-pointer">{t('workbench.payment')}</summary>{payments.map(payment=><div key={payment.id} className="flex flex-wrap justify-between gap-3 border-b border-border py-3"><Link to={`/projects/${projectId}?tab=financial`}>{payment.transactionId || payment.invoiceNumber || payment.paymentDate || t('workbench.undated')}</Link><span>{money(payment.amount)} · {payment.decompteId ? t('workbench.linked_decompte') : t('workbench.unallocated')}</span></div>)}</details>
  </section>;
}