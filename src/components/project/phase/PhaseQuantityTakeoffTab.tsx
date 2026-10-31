/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase. Les métrés sont calculés automatiquement
 * (ressources + moteur de métré) et affichés comme lignes DQE dans
 * `DqeWorkspace` : aucune liste séparée ni création automatique à l'affichage.
 */

import React from 'react';
import ProjectDqeTab from '@/components/project/ProjectDqeTab';

interface PhaseQuantityTakeoffTabProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseQuantityTakeoffTab: React.FC<PhaseQuantityTakeoffTabProps> = ({
  projectId,
}) => (
  <ProjectDqeTab projectId={projectId} />
);

export default PhaseQuantityTakeoffTab;
