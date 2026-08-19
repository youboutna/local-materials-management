/**
 * ProjectBudgetTracking — compact budget dashboard embedded into the Planning tab.
 * Reuses BoqBudgetDashboard on hex-safe useBoqDocument reads. Zero new tabs.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { BoqBudgetDashboard, useBoqDocument } from '@/components/boq';
import { useProjectPhasesHex } from '@/hooks/hexagonal';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';

interface Props { projectId: string }

const ProjectBudgetTracking: React.FC<Props> = ({ projectId }) => {
  const planned = useBoqDocument({ source: 'quantity_takeoff', contextId: projectId, projectId });
  const actual = useBoqDocument({ source: 'dqe', contextId: projectId, projectId });
  const { phases } = useProjectPhasesHex(projectId);
  const { milestones } = useMilestonesHex(projectId);

  const phaseLabels = React.useMemo(
    () => Object.fromEntries((phases ?? []).map((p) => [p.id, p.name || p.phaseName || 'Phase'])),
    [phases],
  );
  const milestoneLabels = React.useMemo(
    () => Object.fromEntries((milestones ?? []).map((m) => [m.id, m.title])),
    [milestones],
  );


  if (planned.isLoading || actual.isLoading) return null;
  if (!planned.lines.length && !actual.lines.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" /> Suivi budgétaire (jalons)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BoqBudgetDashboard
          planned={planned.lines}
          actual={actual.lines}
          phaseLabels={phaseLabels}
          milestoneLabels={milestoneLabels}
        />
      </CardContent>
    </Card>
  );
};

export default ProjectBudgetTracking;
