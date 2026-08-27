import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeTenderSubmissionWindow } from '@/domain/services/tenderSubmissionWindow';

import {
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  MapPin,
  Search,
  Send,
} from 'lucide-react';

export interface SupplierTenderViewModel {
  id: string;
  title: string;
  description: string;
  projectReference?: string;
  deadlineDate?: string;
  launchDate?: string;
  status: string;
  projectTitle?: string;
  location?: string;
  currentPhase?: number;
}

interface SupplierTenderListProps {
  tenders: SupplierTenderViewModel[];
  onSelect: (tenderId: string) => void;
  onCreateQuote: (tenderId: string) => void;
  /** Ouvre directement l'étape de soumission (si la fenêtre est ouverte). */
  onSubmit?: (tenderId: string) => void;
}

function remainingDays(deadline?: string) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}


export function SupplierTenderList({ tenders, onSelect, onCreateQuote, onSubmit }: SupplierTenderListProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const term = search.trim().toLowerCase();
  const visible = term
    ? tenders.filter((tender) =>
        [tender.title, tender.description, tender.projectReference, tender.projectTitle, tender.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term)),
      )
    : tenders;

  return (
    <section aria-labelledby="supplier-tenders-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 id="supplier-tenders-heading" className="text-lg font-bold sm:text-xl">
            {t('supplier_experience.available_tenders')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('supplier_experience.available_tenders_description')}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 pl-9"
            aria-label={t('supplier_experience.search_tender', undefined, 'Rechercher un appel d’offres')}
            placeholder={t('supplier_experience.search_tender', undefined, 'Rechercher un appel d’offres')}
          />
        </div>
      </div>

      {visible.length === 0 && (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('supplier_experience.no_match', undefined, 'Aucun appel d’offres ne correspond à votre recherche.')}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visible.map((tender) => {

          const days = remainingDays(tender.deadlineDate);
          return (
            <Card key={tender.id} className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-0">
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-success-soft text-success-soft-foreground hover:bg-success-soft">
                          {t('supplier_experience.status_open')}
                        </Badge>
                        {tender.projectReference && (
                          <span className="text-xs font-medium text-muted-foreground">{tender.projectReference}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold leading-snug sm:text-xl">{tender.title}</h3>
                    </div>
                    <FileText className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{tender.description}</p>

                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    {tender.projectTitle && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <dd className="truncate">{tender.projectTitle}</dd>
                      </div>
                    )}
                    {tender.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <dd className="truncate">{tender.location}</dd>
                      </div>
                    )}
                    {tender.deadlineDate && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <dd>{new Date(tender.deadlineDate).toLocaleDateString()}</dd>
                      </div>
                    )}
                    {days !== null && days >= 0 && (
                      <div className="flex items-center gap-2 font-medium text-warning">
                        <Clock3 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <dd>{days} {t('supplier_experience.days_remaining')}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="grid gap-2 border-t bg-muted/30 p-3 sm:grid-cols-[1fr_auto]">
                  <Button className="h-11 w-full justify-between" onClick={() => onSelect(tender.id)}>
                    {t('supplier_experience.view_tender')}
                    <ChevronRight className="rtl-flip" aria-hidden="true" />
                  </Button>
                  <Button variant="outline" className="h-11" onClick={() => onCreateQuote(tender.id)}>
                    <Calculator aria-hidden="true" />
                    {t('supplier_experience.create_quote')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

interface SupplierTenderDetailHeaderProps {
  tender: SupplierTenderViewModel;
  selectedDocuments: number;
  isComplete: boolean;
  isSubmitted: boolean;
  canSubmit: boolean;
  hasDao: boolean;
  onBack: () => void;
  onOpenDao: () => void;
  onOpenSubmission: () => void;
}

export function SupplierTenderDetailHeader({
  tender,
  selectedDocuments,
  isComplete,
  isSubmitted,
  canSubmit,
  hasDao,
  onBack,
  onOpenDao,
  onOpenSubmission,
}: SupplierTenderDetailHeaderProps) {
  const { t } = useLanguage();
  const days = remainingDays(tender.deadlineDate);
  const progress = isSubmitted ? 100 : isComplete ? 75 : selectedDocuments > 0 ? 50 : 25;
  const steps = [
    t('supplier_experience.step_information'),
    t('supplier_experience.step_eligibility'),
    t('supplier_experience.step_documents'),
    t('supplier_experience.step_submission'),
  ];

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <Button variant="ghost" className="h-11 px-2" onClick={onBack}>
        <ArrowLeft className="rtl-flip" aria-hidden="true" />
        {t('supplier_experience.back_to_tenders')}
      </Button>

      <section className="space-y-5 border-b pb-6" aria-labelledby="supplier-tender-title">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              canSubmit
                ? 'bg-success text-success-foreground hover:bg-success/90'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }
          >
            {canSubmit ? t('supplier_experience.status_open') : t('supplier_experience.status_closed')}
          </Badge>
          {tender.projectReference && <span className="text-sm text-muted-foreground">{tender.projectReference}</span>}
        </div>


        <div className="max-w-3xl">
          <h2 id="supplier-tender-title" className="text-2xl font-bold leading-tight sm:text-4xl">{tender.title}</h2>
          {tender.projectTitle && <p className="mt-2 font-medium text-muted-foreground">{tender.projectTitle}</p>}
        </div>

        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          {tender.location && (
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><dd>{tender.location}</dd></div>
          )}
          {tender.deadlineDate && (
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted-foreground" /><dd>{new Date(tender.deadlineDate).toLocaleDateString()}</dd></div>
          )}
          {days !== null && days >= 0 && (
            <div className="flex items-center gap-2 font-semibold text-warning"><Clock3 className="h-4 w-4" /><dd>{days} {t('supplier_experience.days_remaining')}</dd></div>
          )}
        </dl>

        <div className="grid gap-3 sm:grid-cols-2 sm:max-w-2xl">
          <Button variant="outline" className="h-12" disabled={!hasDao} onClick={onOpenDao}>
            <Download aria-hidden="true" />
            {t('supplier_experience.download_dao')}
          </Button>
          <Button
            className={`h-12 ${canSubmit && !isSubmitted ? 'bg-success text-success-foreground hover:bg-success/90' : ''}`}
            disabled={!canSubmit && !isSubmitted}
            onClick={onOpenSubmission}
          >
            <FileCheck2 aria-hidden="true" />
            {isSubmitted ? t('supplier_experience.view_submission') : t('supplier_experience.open_submission')}
          </Button>

        </div>
      </section>

      <section className="space-y-3" aria-labelledby="supplier-progress-title">
        <div className="flex items-center justify-between gap-4">
          <h3 id="supplier-progress-title" className="font-bold">{t('supplier_experience.progress_title')}</h3>
          <span className="text-sm font-semibold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const done = progress >= (index + 1) * 25;
            return (
              <li key={step} className="min-w-0 text-center">
                <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'}`}>
                  {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className="mt-1 hidden text-xs text-muted-foreground sm:block">{step}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {tender.description && (
        <section className="border-t pt-5" aria-labelledby="supplier-overview-title">
          <h3 id="supplier-overview-title" className="font-bold">{t('supplier_experience.overview')}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{tender.description}</p>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur md:hidden">
        <Button className="h-12 w-full" disabled={!canSubmit && !isSubmitted} onClick={onOpenSubmission}>
          <FileCheck2 aria-hidden="true" />
          {isSubmitted ? t('supplier_experience.view_submission') : t('supplier_experience.open_submission')}
        </Button>
      </div>
    </div>
  );
}