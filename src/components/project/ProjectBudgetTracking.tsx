/**
 * ProjectBudgetTracking — compact budget dashboard embedded into the Planning tab.
 * Reuses BoqBudgetDashboard on hex-safe useBoqDocument reads. Zero new tabs.
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { BoqBudgetDashboard, useBoqDocument } from '@/components/boq';

interface Props { projectId: string }

const ProjectBudgetTracking: React.FC<Props> = ({ projectId }) => {
  const planned = useBoqDocument({ source: 'quantity_takeoff', contextId: projectId, projectId });
  const actual = useBoqDocument({ source: 'dqe', contextId: projectId, projectId });

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
        <BoqBudgetDashboard planned={planned.lines} actual={actual.lines} />
      </CardContent>
    </Card>
  );
};

export default ProjectBudgetTracking;
