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
  referentialCode?: ReferentialType;
}

const ProjectDqeTab: React.FC<Props> = ({ projectId, referentialCode }) => (
  <DqeWorkspace
    routeContext="project-dqe"
    projectId={projectId}
    referentialCode={referentialCode}
    showComparison
  />
);

export default ProjectDqeTab;
