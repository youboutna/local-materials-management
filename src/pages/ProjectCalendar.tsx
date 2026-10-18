import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format, parseISO, isValid, addDays, addMonths, addYears, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { fr, arSA, enUS } from 'date-fns/locale';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkbenchProjects, useProjectWorkbench, useWorkbenchOperations } from '@/hooks/hexagonal/useProjectWorkbenchHex';
import { ProjectWorkbenchService } from '@/application/services/ProjectWorkbenchService';
import { WORKBENCH_VIEWS } from '@/config/referentials/projects/project-workbench.referential';
import type { WorkbenchView, CalendarPeriod, ProjectOperationDTO } from '@/dtos/entities/ProjectWorkbenchDTO';
import { ProjectOperationEditor } from '@/components/projects/ProjectOperationEditor';
import { InfrastructureWorkbench } from '@/components/gis/InfrastructureWorkbench';
import AdvancedQuantityCalculator from '@/components/project/AdvancedQuantityCalculator';
import { ChevronLeft, ChevronRight, Plus, CalendarDays, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
export default function ProjectCalendar() {
  const { t, language } = useLanguage(); const locale = language === 'fr' ? fr : language === 'ar' ? arSA : enUS;
  const [params,setParams] = useSearchParams(); const projectId = params.get('projectId') || '';
  const requestedView = params.get('view') as WorkbenchView; const view = WORKBENCH_VIEWS.includes(requestedView) ? requestedView : 'calendar';
  const period: CalendarPeriod = ['day','month','year'].includes(params.get('period') || '') ? params.get('period') as CalendarPeriod : 'month';
  const rawDate = params.get('date') || format(new Date(),'yyyy-MM-dd'); const date = isValid(parseISO(rawDate)) ? rawDate : format(new Date(),'yyyy-MM-dd'); const selectedDate = parseISO(date);
  const [search,setSearch] = useState(''); const [editing,setEditing] = useState<ProjectOperationDTO | 'new' | null>(null); const [error,setError] = useState('');
  const projects = useWorkbenchProjects(); const authorized = projects.data?.some(project => project.id === projectId); const data = useProjectWorkbench(authorized ? projectId : ''); const operations = useWorkbenchOperations(projectId);
  const patch = (values: Record<string,string>) => { setParams(current => { const next = new URLSearchParams(current); Object.entries(values).forEach(([key,value]) => next.set(key,value)); return next; }); setEditing(null); setError(''); };
  const filtered = projects.data?.filter(project => `${project.title} ${project.reference || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())) || [];
  const events = ProjectWorkbenchService.inPeriod(data.data?.events || [],date,period);
  const kind = view === 'consumption' || view === 'expense' || view === 'revenue' ? view : null;
  const visibleEntries = data.data?.operations.filter(entry => entry.kind === kind && events.some(event => event.id === entry.id)) || [];
  const move = (direction: number) => patch({ date: format(period === 'day' ? addDays(selectedDate,direction) : period === 'month' ? addMonths(selectedDate,direction) : addYears(selectedDate,direction),'yyyy-MM-dd') });
  return <AppLayout pageTitle={t('workbench.title')}>
    <div className="space-y-6 min-w-0">
      <div className="flex items-center gap-3"><CalendarDays className="h-7 w-7 text-primary" /><h1 className="text-2xl font-semibold">{t('workbench.title')}</h1></div>
      <div className="grid gap-3 sm:grid-cols-2"><Input aria-label={t('workbench.search')} placeholder={t('workbench.search')} value={search} onChange={e => setSearch(e.target.value)} /><Select value={authorized ? projectId : ''} onValueChange={value => patch({projectId:value})}><SelectTrigger aria-label={t('workbench.project')}><SelectValue placeholder={t('workbench.project')} /></SelectTrigger><SelectContent>{filtered.map(project => <SelectItem value={project.id} key={project.id}>{project.title}{project.reference ? ` · ${project.reference}` : ''}</SelectItem>)}</SelectContent></Select></div>
      <nav className="flex flex-wrap gap-1 border-b border-border pb-3">{WORKBENCH_VIEWS.map(item => <Button key={item} variant={view === item ? 'default' : 'ghost'} onClick={() => patch({view:item})}>{t(`workbench.${item}`)}</Button>)}</nav>
      {projects.isLoading && <p role="status">{t('common.loading')}</p>}{projects.error && <p role="alert" className="text-destructive">{projects.error.message}</p>}
      {projectId && projects.isSuccess && !authorized && <p role="alert" className="text-destructive">{t('workbench.denied')}</p>}
      {data.isLoading && <p role="status">{t('common.loading')}</p>}{data.error && <p role="alert" className="text-destructive">{data.error.message}</p>}
      {data.data && authorized && <>
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold break-words">{data.data.project.title}</h2><Button asChild variant="outline"><Link to={`/projects/${projectId}`}><ArrowUpRight className="h-4 w-4 mr-2" />{t('workbench.project_details')}</Link></Button></div>
        {view !== 'plans' && view !== 'infrastructure' && <div className="flex flex-wrap gap-2 items-center"><Button variant="outline" size="icon" aria-label={t('workbench.previous')} onClick={() => move(-1)}><ChevronLeft className="h-4 w-4" /></Button><Input className="w-40" type="date" aria-label={t('workbench.date')} value={date} onChange={e => patch({date:e.target.value})} /><Button variant="outline" size="icon" aria-label={t('workbench.next')} onClick={() => move(1)}><ChevronRight className="h-4 w-4" /></Button>{(['day','month','year'] as const).map(item => <Button key={item} variant={item === period ? 'secondary' : 'ghost'} onClick={() => patch({period:item})}>{t(`workbench.${item}`)}</Button>)}<Button variant="ghost" onClick={() => patch({date:format(new Date(),'yyyy-MM-dd')})}>{t('workbench.today')}</Button></div>}
        {view === 'calendar' && <>
          {period === 'month' && <div className="grid grid-cols-7 border-l border-t border-border">{eachDayOfInterval({ start:startOfWeek(startOfMonth(selectedDate),{weekStartsOn:1}),end:endOfWeek(endOfMonth(selectedDate),{weekStartsOn:1}) }).map(day => { const key = format(day,'yyyy-MM-dd'); const count = (data.data?.events || []).filter(event => event.date === key).length; return <Button key={key} variant="ghost" className="h-20 sm:h-24 rounded-none border-b border-r border-border flex-col items-start justify-start gap-1 p-2" onClick={() => patch({date:key,period:'day'})}><span className={format(day,'MM') === format(selectedDate,'MM') ? 'text-foreground' : 'text-muted-foreground'}>{format(day,'d')}</span>{count > 0 && <span className="text-xs text-primary">{count} <span className="hidden sm:inline">{t('workbench.events')}</span></span>}</Button>; })}</div>}
          <div className="divide-y divide-border">{events.map(event => <Link key={event.id} to={event.href} className="flex justify-between items-center py-3 gap-3"><div><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{t(`workbench.${event.kind}`)} · {t(`workbench.${event.dateKind}`)}</p></div><span className="text-sm whitespace-nowrap">{event.date && format(parseISO(event.date),'dd MMM yyyy',{locale})}</span></Link>)}</div>{!events.length && <p className="text-muted-foreground">{t('workbench.empty')}</p>}
          {(data.data.events.filter(event => !event.date).length > 0) && <details><summary className="cursor-pointer">{t('workbench.undated')}</summary>{data.data.events.filter(event => !event.date).map(event => <Link className="block py-2" key={event.id} to={event.href}>{event.title}</Link>)}</details>}
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to={`/projects/${projectId}?tab=resources`}>{t('workbench.resources')}</Link></Button><Button asChild variant="outline"><Link to={`/projects/${projectId}?tab=phases`}>{t('workbench.phase')}</Link></Button><Button asChild variant="outline"><Link to={`/projects/${projectId}?tab=financial`}>{t('workbench.payment')}</Link></Button><Button asChild variant="outline"><Link to={`/projects/${projectId}?tab=tasks&execution=inspections`}>{t('workbench.inspection')}</Link></Button></div>
        </>}
        {kind && <><div className="flex justify-between items-center gap-3"><p className="text-sm text-muted-foreground">{t('workbench.recorded_total')}: {visibleEntries.reduce((sum,entry) => sum + entry.amount,0).toLocaleString(language)} {data.data.project.currency}</p>{data.data.canManage && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4 mr-2" />{t('workbench.add')}</Button>}</div>{editing && <ProjectOperationEditor key={editing === 'new' ? 'new' : editing.id} projectId={projectId} currency={data.data.project.currency} date={date} kind={kind} phases={data.data.project.phases} existing={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}{error && <p role="alert" className="text-destructive">{error}</p>}<div className="divide-y divide-border">{visibleEntries.map(entry => <div key={entry.id} className="flex justify-between items-center gap-3 py-3"><div><p className="font-medium">{entry.label}</p><p className="text-sm text-muted-foreground">{entry.occurredOn} · {entry.quantity} {entry.unit} · {entry.amount.toLocaleString(language)} {entry.currency}</p></div>{data.data?.canManage && <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={() => setEditing(entry)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={t('common.delete')} disabled={operations.isPending} onClick={async () => { if (!window.confirm(t('common.confirm_delete'))) return; try { await operations.deleteOperation(entry.id); } catch(e) { setError(e instanceof Error ? e.message : t('common.error')); } }}><Trash2 className="h-4 w-4" /></Button></div>}</div>)}</div>{!visibleEntries.length && <p className="text-muted-foreground">{t('workbench.empty')}</p>}</>}
        {view === 'plans' && (data.data.canManage ? <AdvancedQuantityCalculator projectId={projectId} /> : <p className="text-muted-foreground">{t('workbench.denied')}</p>)}
        {view === 'infrastructure' && <InfrastructureWorkbench key={projectId} project={data.data.project} canManage={data.data.canManage} />}
      </>}
    </div>
  </AppLayout>;
}