/**
 * ProjectDqeTab — DQE global à l'échelle projet.
 * Refonte v3.1 : fusionne les 3 cartes historiques dans un `DqeWorkspace` unique
 * (KPI header + actions unifiées + sous-onglets Lignes / Comparaison / Suivi budget).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { DqeWorkspace } from '@/components/boq/DqeWorkspace';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, History, Plus } from 'lucide-react';
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
  // Navigation contextualisée : le projet courant est porté par l'URL.
  const base = `/projects/${encodeURIComponent(projectId)}/dqe`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {t('dqe.navigation.module')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {projectName ? `${t('dqe.header.project_ref')} · ${projectName}` : t('dqe.navigation.project_scope')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm">
            <Link to={`${base}/new`}>
              <Plus className="h-4 w-4 mr-1" />
              {t('dqe.navigation.new')}
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`${base}/list`}>
              <History className="h-4 w-4 mr-1" />
              {t('dqe.navigation.list')}
            </Link>
          </Button>
        </div>
      </div>

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
