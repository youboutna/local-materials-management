/**
 * SupplierSubmissionWizard
 * Dossier de soumission fournisseur en 3 étapes accordéon (IDENTIFICATION / TECHNICAL / COMMERCIAL),
 * dépôt de fichiers groupé (un seul bloc par étape) et barre d'actions sticky.
 * Purement présentationnel : l'état des fichiers reste porté par le parent.
 */
import { useRef, useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, FileText, Plus, Send, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export type SubmissionCategory = 'administrative' | 'technical' | 'financial';

const STEPS: { code: SubmissionCategory; step: number; labelKey: string; fallback: string; hintKey: string; hintFallback: string }[] = [
  {
    code: 'administrative',
    step: 1,
    labelKey: 'supplier_submission.step_identification',
    fallback: 'Identification (administratif)',
    hintKey: 'supplier_submission.hint_identification',
    hintFallback: 'Registre de commerce, statuts, attestations fiscales et sociales.',
  },
  {
    code: 'technical',
    step: 2,
    labelKey: 'supplier_submission.step_technical',
    fallback: 'Technique (documents)',
    hintKey: 'supplier_submission.hint_technical',
    hintFallback: 'Références, qualifications, méthodologie, planning prévisionnel.',
  },
  {
    code: 'financial',
    step: 3,
    labelKey: 'supplier_submission.step_commercial',
    fallback: 'Commercial (prix)',
    hintKey: 'supplier_submission.hint_commercial',
    hintFallback: 'Devis quantitatif, garanties bancaires, bilan et cautions.',
  },
];

export interface SupplierSubmissionWizardProps {
  files: Record<string, File>;
  minPerCategory?: number;
  notes: string;
  isPending: boolean;
  isComplete: boolean;
  onAddFiles: (category: SubmissionCategory, files: File[]) => void;
  onRemoveFile: (key: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  children?: React.ReactNode;
}

export function SupplierSubmissionWizard({
  files,
  minPerCategory = 2,
  notes,
  isPending,
  isComplete,
  onAddFiles,
  onRemoveFile,
  onNotesChange,
  onSubmit,
  children,
}: SupplierSubmissionWizardProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<string>('administrative');
  const inputs = useRef<Partial<Record<SubmissionCategory, HTMLInputElement | null>>>({});

  const entriesFor = (category: SubmissionCategory) =>
    Object.entries(files).filter(([key]) => key.startsWith(`${category}-`));

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="space-y-3">
        {STEPS.map(({ code, step, labelKey, fallback, hintKey, hintFallback }) => {
          const rows = entriesFor(code);
          const done = rows.length >= minPerCategory;
          return (
            <AccordionItem key={code} value={code} className="rounded-lg border bg-card px-4">
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex w-full items-center gap-3 text-left">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" aria-hidden="true" /> : step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{t(labelKey, undefined, fallback)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{t(hintKey, undefined, hintFallback)}</span>
                  </span>
                  <Badge variant={done ? 'default' : 'secondary'} className="shrink-0">
                    {rows.length}/{minPerCategory}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                <div className="rounded-md border border-dashed p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {t('supplier_submission.attach_documents', undefined, 'Joindre les documents')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => inputs.current[code]?.click()}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      {t('supplier_submission.add_files', undefined, 'Ajouter des fichiers')}
                    </Button>
                  </div>
                  <input
                    ref={(el) => { inputs.current[code] = el; }}
                    type="file"
                    multiple
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(event) => {
                      const list = Array.from(event.target.files ?? []);
                      if (list.length) onAddFiles(code, list);
                      event.target.value = '';
                    }}
                  />

                  {rows.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {rows.map(([key, file]) => (
                        <li key={key} className="flex items-center gap-3 rounded-md border bg-background p-2">
                          <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            aria-label={t('common.delete', undefined, 'Supprimer')}
                            onClick={() => onRemoveFile(key)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('supplier_submission.no_file_yet', undefined, 'Aucun fichier ajouté pour cette étape.')}
                    </p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="rounded-lg border bg-card p-4">
        <Label htmlFor="submission-notes">
          {t('supplier_submission.notes', undefined, 'Notes complémentaires (optionnel)')}
        </Label>
        <Textarea
          id="submission-notes"
          value={notes}
          rows={3}
          className="mt-2"
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </div>

      {children}

      <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {Object.keys(files).length} {t('supplier_submission.files_selected', undefined, 'fichier(s) sélectionné(s)')}
          {isComplete && (
            <span className="ml-2 font-medium text-success">
              ✓ {t('supplier_submission.complete', undefined, 'Dossier complet')}
            </span>
          )}
        </p>
        <Button
          className="h-12 bg-success text-success-foreground hover:bg-success/90"
          disabled={!isComplete || isPending}
          onClick={onSubmit}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isPending
            ? t('supplier_submission.submitting', undefined, 'Soumission en cours…')
            : t('supplier_submission.submit', undefined, 'Soumettre la soumission')}
        </Button>
      </div>
    </div>
  );
}

export default SupplierSubmissionWizard;
