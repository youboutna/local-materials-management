import { useLanguage } from '@/contexts/LanguageContext';
/**
 * BudgetConsistencyAlerts — restitution UI des contrôles de cohérence budgétaire.
 * Pure présentation : consomme `BudgetConsistencyService` (aucun accès données).
 */
import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BudgetFinding } from '@/application/services/BudgetConsistencyService';

interface Props {
  findings: readonly BudgetFinding[];
  /** Message affiché quand aucun écart n'est détecté. */
  okLabel?: string;
  className?: string;
}

const STYLES: Record<BudgetFinding['severity'], { wrapper: string; Icon: typeof Info; badge: 'destructive' | 'secondary' | 'outline' }> = {
  error: { wrapper: 'border-destructive/40 bg-destructive/10 text-foreground', Icon: AlertCircle, badge: 'destructive' },
  warning: { wrapper: 'border-warning/40 bg-warning/10 text-foreground', Icon: TriangleAlert, badge: 'secondary' },
  info: { wrapper: 'border-border bg-muted/50 text-foreground', Icon: Info, badge: 'outline' },
};

export const BudgetConsistencyAlerts: React.FC<Props> = ({ findings, okLabel, className }) => {
  const { t } = useLanguage();
  if (findings.length === 0) {
    if (!okLabel) return null;
    return (
      <div className={`flex items-start gap-2 rounded-md border border-success/40 bg-success/10 p-3 text-sm ${className ?? ''}`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
        <span>{okLabel}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className ?? ''}`} role="status" aria-live="polite">
      {findings.map((f, i) => {
        const s = STYLES[f.severity];
        return (
          <div key={`${f.code}-${i}`} className={`flex flex-wrap items-start gap-2 rounded-md border p-3 text-sm ${s.wrapper}`}>
            <s.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{f.label}</span>
                <Badge variant={s.badge} className="text-xs">
                  {f.severity === 'error' ? t('auto.budgetconsistencyalerts.bloquant') : f.severity === 'warning' ? t('auto.budgetconsistencyalerts.avertissement') : t('auto.budgetconsistencyalerts.information')}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{f.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BudgetConsistencyAlerts;
