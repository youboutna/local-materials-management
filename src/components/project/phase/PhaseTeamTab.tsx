/**
 * PhaseTeamTab
 * Onglet « Équipe » d'une phase : membres internes affectés (CRUD unique,
 * source de vérité de la main d'œuvre affichée dans l'onglet Ressources).
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import { T } from '@/components/i18n/T';

interface PhaseTeamTabProps {
  phaseId: string;
  projectId: string;
}

const PhaseTeamTab: React.FC<PhaseTeamTabProps> = ({ phaseId }) => (
  <Card>
    <CardHeader className="py-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <T k="auto.phaseteam.membres_internes" fallback="Membres internes de la phase" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <PhaseEmployees phaseId={phaseId} />
    </CardContent>
  </Card>
);

export default PhaseTeamTab;
