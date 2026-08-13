import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProjectMetricsPanel from '@/components/project/ProjectMetricsPanel';
import type { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';

/**
 * WorkflowMetricsPreview — aperçu temps réel des métriques projet pendant les
 * workflows de création et d'édition.
 *
 * Source unique : ProjectMetricsOrchestrator (via ProjectMetricsPanel), donc
 * les valeurs et le formatage sont identiques au détail projet, au dashboard
 * monitoring et au rapport PDF.
 */
interface Props {
  formData?: ProjectWorkflowData | null;
  mode: 'create' | 'edit';
  className?: string;
}

export const WorkflowMetricsPreview: React.FC<Props> = ({ formData, mode, className }) => {
  const project = (formData?.projectData ?? null) as any;
  const related = (formData?.relatedData ?? {}) as any;

  const phases = useMemo(() => (related.phases ?? []) as any[], [related.phases]);
  const risks = useMemo(() => (related.risks ?? []) as any[], [related.risks]);

  const hasMinimalData = Boolean(project?.title || project?.budget || phases.length > 0);

  if (!hasMinimalData) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-sm text-muted-foreground">
          Les indicateurs (avancement pondéré, EVM, alertes) apparaîtront dès que le titre, le
          budget ou les phases seront renseignés.
        </CardContent>
      </Card>
    );
  }

  return (
    <ProjectMetricsPanel
      className={className}
      variant="compact"
      project={project}
      phases={phases}
      actualCost={project?.actualCost ?? 0}
      documentsCount={(related.documents ?? []).length}
      inspectionsCount={(related.inspections ?? []).length}
      risks={risks}
      // En création, les alertes de retard ne sont pertinentes qu'après saisie des dates.
      showAlerts={mode === 'edit' || Boolean(project?.startDate && project?.endDate)}
    />
  );
};

export default WorkflowMetricsPreview;
