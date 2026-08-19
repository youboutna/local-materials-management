import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Activity } from 'lucide-react';
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
  /** Replie le bandeau par défaut afin de ne pas masquer le workflow. */
  defaultOpen?: boolean;
}

export const WorkflowMetricsPreview: React.FC<Props> = ({ formData, mode, className, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const project = (formData?.projectData ?? null) as any;
  const related = (formData?.relatedData ?? {}) as any;

  const phases = useMemo(() => (related.phases ?? []) as any[], [related.phases]);
  const risks = useMemo(() => (related.risks ?? []) as any[], [related.risks]);

  const hasMinimalData = Boolean(project?.title || project?.budget || phases.length > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <Card>
        <CardContent className="p-2">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Indicateurs temps réel (avancement, EVM, alertes)
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            {hasMinimalData ? (
              <ProjectMetricsPanel
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
            ) : (
              <p className="p-2 text-sm text-muted-foreground">
                Les indicateurs (avancement pondéré, EVM, alertes) apparaîtront dès que le titre, le
                budget ou les phases seront renseignés.
              </p>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );

};

export default WorkflowMetricsPreview;
