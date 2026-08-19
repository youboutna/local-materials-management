import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Activity } from 'lucide-react';
import ProjectMetricsPanel from '@/components/project/ProjectMetricsPanel';
import type { ProjectWorkflowData } from '@/dtos/workflows/ProjectWorkflowDTOs';

/**
 * WorkflowMetricsPreview — accès discret aux métriques projet pendant les
 * workflows de création et d'édition.
 *
 * Le bandeau plein écran a été remplacé par un simple déclencheur : les
 * indicateurs s'ouvrent dans un panneau latéral, sans masquer le workflow.
 * Source unique : ProjectMetricsOrchestrator (via ProjectMetricsPanel).
 */
interface Props {
  formData?: ProjectWorkflowData | null;
  mode: 'create' | 'edit';
  className?: string;
  /** Conservé pour compatibilité : ouvre le panneau au montage. */
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
    <div className={`flex justify-end ${className ?? ''}`}>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Activity className="h-4 w-4" />
            Indicateurs
            {phases.length > 0 ? (
              <Badge variant="secondary" className="text-[10px]">
                {phases.length} phase(s)
              </Badge>
            ) : null}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Indicateurs temps réel</SheetTitle>
            <SheetDescription>
              Avancement pondéré, EVM et alertes calculés à partir des données saisies.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
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
              <p className="text-sm text-muted-foreground">
                Les indicateurs (avancement pondéré, EVM, alertes) apparaîtront dès que le titre, le
                budget ou les phases seront renseignés.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default WorkflowMetricsPreview;
