/**
 * ProjectDqeTab — DQE global à l'échelle projet.
 * Refonte v3.1 : fusionne les 3 cartes historiques dans un `DqeWorkspace` unique
 * (KPI header + actions unifiées + sous-onglets Lignes / Comparaison / Suivi budget).
 */
import React from 'react';
import { DqeWorkspace } from '@/components/boq/DqeWorkspace';
import type { ReferentialType } from '@/config/referentials';

interface Props {
  projectId: string;
  projectName?: string;
  referentialCode?: ReferentialType;
  /** Budget restant du projet (pour l'alerte d'écart au moment de la demande de validation). */
  remainingBudget?: number | null;
}

const ProjectDqeTab: React.FC<Props> = ({ projectId, projectName, referentialCode, remainingBudget }) => (
  <DqeWorkspace
    routeContext="project-dqe"
    projectId={projectId}
    projectName={projectName}
    referentialCode={referentialCode}
    remainingBudget={remainingBudget}
    showComparison
  />
);


export default ProjectDqeTab;
