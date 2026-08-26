/**
 * ProjectDqeTab — DQE global à l'échelle projet.
 * Refonte v3.1 : fusionne les 3 cartes historiques dans un `DqeWorkspace` unique
 * (KPI header + actions unifiées + sous-onglets Lignes / Comparaison / Suivi budget).
 */
import React from 'react';
import { DqeWorkspace } from '@/components/boq/DqeWorkspace';

import { FileSpreadsheet } from 'lucide-react';
import type { ReferentialType } from '@/config/referentials';
import { useI18n } from '@/hooks/useI18n';

interface Props {
  projectId: string;
  projectName?: string;
  referentialCode?: ReferentialType;
  /** Budget restant du projet (pour l'alerte d'écart au moment de la demande de validation). */
  remainingBudget?: number | null;
}

const ProjectDqeTab: React.FC<Props> = ({ projectId, projectName, referentialCode, remainingBudget }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      {/* Ligne de contexte uniquement : titre + actions vivent dans le bloc Historique. */}
      <p className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <FileSpreadsheet className="h-4 w-4 text-primary" />
        {projectName ? `${t('dqe.header.project_ref')} · ${projectName}` : t('dqe.navigation.project_scope')}
      </p>


      <DqeWorkspace
        routeContext="project-dqe"
        projectId={projectId}
        projectName={projectName}
        referentialCode={referentialCode}
        remainingBudget={remainingBudget}
        showComparison
      />
    </div>
  );
};


export default ProjectDqeTab;
