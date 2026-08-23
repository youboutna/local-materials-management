import { useMemo } from 'react';
import {
  Calendar,
  Megaphone,
  FileText,
  Award,
  Shield,
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import {
  TENDER_WORKFLOW_REFERENTIAL,
  getTenderWorkflowLabel,
  type TenderWorkflowCategory,
  type TenderWorkflowLang,
} from '@/config/referentials/tender/workflow.referential';

/**
 * Étape de workflow officiel présentée à l'UI.
 * `code` reste l'unique valeur technique ; les libellés sont résolus par langue.
 */
export interface OfficialWorkflowStep {
  id: number;
  code: string;
  title: string;
  description: string;
  requiredDocuments: string[];
  estimatedDuration: number; // en jours
  category: TenderWorkflowCategory;
}

/** Projette le référentiel niveau 3 dans la langue demandée (doctrine i18n UI-only). */
export const buildOfficialWorkflowSteps = (
  lang: TenderWorkflowLang,
): OfficialWorkflowStep[] =>
  TENDER_WORKFLOW_REFERENTIAL.map((step) => ({
    id: step.order,
    code: step.code,
    title: getTenderWorkflowLabel(step.title, lang),
    description: getTenderWorkflowLabel(step.description, lang),
    requiredDocuments: step.requiredDocuments.map((doc) =>
      getTenderWorkflowLabel(doc.labels, lang),
    ),
    estimatedDuration: step.estimatedDuration,
    category: step.category,
  }));

/** Hook de consommation UI : réactif au changement de langue. */
export const useOfficialWorkflowSteps = (): OfficialWorkflowStep[] => {
  const { language } = useI18n();
  return useMemo(
    () => buildOfficialWorkflowSteps(language as TenderWorkflowLang),
    [language],
  );
};

export const getStepIcon = (category: string) => {
  switch (category) {
    case 'planning': return Calendar;
    case 'publicity': return Megaphone;
    case 'analysis': return FileText;
    case 'attribution': return Award;
    case 'control': return Shield;
    default: return FileText;
  }
};

export const getStepColor = (category: string) => {
  switch (category) {
    case 'planning': return 'bg-primary/10 border-primary/30 text-primary';
    case 'publicity': return 'bg-success-soft border-success/30 text-success';
    case 'analysis': return 'bg-warning/10 border-warning/30 text-warning';
    case 'attribution': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'control': return 'bg-destructive/10 border-destructive/30 text-destructive';
    default: return 'bg-muted border-border text-foreground';
  }
};
