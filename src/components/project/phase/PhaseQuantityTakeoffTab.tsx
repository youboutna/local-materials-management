/**
 * PhaseQuantityTakeoffTab
 * Onglet Métré / DQE d'une phase. Les métrés sont calculés automatiquement
 * (ressources + moteur de métré) et affichés comme lignes DQE dans
 * `QuantityTakeoffs` : aucune liste séparée ni action dupliquée ici.
 */

import React from 'react';
import ProjectDqeTab from '@/components/project/ProjectDqeTab';

interface PhaseQuantityTakeoffTabProps {
  phaseId: string;
  projectId: string;
  phaseName?: string;
}

const PhaseQuantityTakeoffTab: React.FC<PhaseQuantityTakeoffTabProps> = ({
  phaseId,
  projectId,
  phaseName,
}) => (
  <ProjectDqeTab projectId={projectId} />
);

export default PhaseQuantityTakeoffTab;
