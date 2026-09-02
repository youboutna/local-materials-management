/**
 * src/components/boq/EdbValidationPanel.tsx
 * EdbValidationPanel — rapport de validation EDB affiché AVANT toute écriture.
 * Erreurs de calcul bloquantes + écart budgétaire avec décision explicite (A/B/C).
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { EdbBudgetDecision, EdbValidationReport } from '@/dtos/boq/EdbValidationDTO';
import { AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';

import { TranslatedStatus, TranslatedUnit } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
interface Props {
  report: EdbValidationReport;
  decision: EdbBudgetDecision;
  onDecisionChange: (d: EdbBudgetDecision) => void;
  onFixErrors: () => void;
  disabled?: boolean;
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function EdbValidationPanel({ report, decision, onDecisionChange, onFixErrors, disabled }: Props) {
  const { errors, warnings, budgetDiscrepancy: d } = report;

  return (
    <section className="rounded-md border p-3 space-y-3" aria-labelledby="edb-validation-title">
      <header className="flex items-center justify-between gap-2">
        <h4 id="edb-validation-title" className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
          <T k="auto.edbvalidationpanel.validation_de_l_expression_de_besoin_edb" fallback="Validation de l’expression de besoin (EDB)" />
        </h4>
        <Badge variant={report.status === 'READY' ? 'secondary' : 'outline'}><TranslatedStatus code={report.status} /></Badge>
      </header>

      {errors.length > 0 ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-destructive">
              Erreurs bloquantes ({errors.length})
            </span>
            <Button size="sm" variant="outline" onClick={onFixErrors} disabled={disabled}>
              <Wrench className="h-3.5 w-3.5 mr-1" aria-hidden />
              <T k="auto.edbvalidationpanel.corriger_automatiquement_forfait" fallback="Corriger automatiquement (forfait)" />
            </Button>
          </div>
          <ul className="text-xs text-destructive/90 space-y-1 pl-5 list-disc max-h-32 overflow-y-auto">
            {errors.map((e, i) => (
              <li key={`${e.lotId}-${i}`}>
                <strong>{e.lotId ?? '—'} – {e.designation}</strong> : {e.message}
                <span className="block text-muted-foreground">
                  ➜ Correction : unité = <TranslatedUnit code={e.suggestedFix.unit} />, quantité = {e.suggestedFix.quantity}, PU = {fmt(e.suggestedFix.unitPrice)} MRU
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
          Aucune erreur de calcul détectée (quantité × PU = montant).
        </p>
      )}

      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
          <span className="text-sm font-medium text-warning">Alertes ({warnings.length})</span>
          <ul className="text-xs text-warning/90 space-y-0.5 pl-5 list-disc mt-1 max-h-28 overflow-y-auto">
            {warnings.map((w, i) => <li key={i}>{w.message}</li>)}
          </ul>
        </div>
      )}

      {d && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="block text-muted-foreground"><T k="auto.edbvalidationpanel.budget_projet_restant" fallback="Budget projet restant" /></span>
              <strong>{fmt(d.projectBudget)} MRU</strong>
            </div>
            <div className="rounded border p-2">
              <span className="block text-muted-foreground"><T k="auto.edbvalidationpanel.total_dqe" fallback="Total DQE" /></span>
              <strong>{fmt(d.dqeTotal)} MRU</strong>
            </div>
            <div className="rounded border p-2">
              <span className="block text-muted-foreground"><T k="auto.edbvalidationpanel.ecart" fallback="Écart" /></span>
              <strong className="text-warning">
                {d.difference > 0 ? '+' : ''}{fmt(d.difference)} MRU ({d.percentage.toFixed(2)} %)
              </strong>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium"><T k="auto.edbvalidationpanel.decision_du_validateur" fallback="Décision du validateur" /></Label>
            <RadioGroup value={decision} onValueChange={(v) => onDecisionChange(v as EdbBudgetDecision)} disabled={disabled}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="ADJUST_PROJECT_BUDGET" id="edb-opt-a" />
                <Label htmlFor="edb-opt-a" className="text-xs font-normal leading-5">
                  (A) Ajuster le budget projet à {fmt(d.dqeTotal)} MRU — KPI (CPI/SPI) recalculés, note d’historique ajoutée.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="ADJUST_DQE" id="edb-opt-b" />
                <Label htmlFor="edb-opt-b" className="text-xs font-normal leading-5">
                  (B) Ajuster le DQE (réduction proportionnelle à {fmt(d.projectBudget)} MRU).
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="KEEP_DISCREPANCY" id="edb-opt-c" />
                <Label htmlFor="edb-opt-c" className="text-xs font-normal leading-5">
                  (C) Conserver l’écart — indicateur « Écart DQE/Budget » permanent (tableau de bord + rapports PDF).
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      )}
    </section>
  );
}
