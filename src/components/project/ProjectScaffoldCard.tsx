/**
 * ProjectScaffoldCard — complète un projet vide (importé ou créé) depuis les
 * référentiels : statuts de phases alignés sur le calendrier, DQE socle réparti
 * sur le budget, ressources planifiées et tâches d'exécution.
 *
 * Présentation uniquement : toute la logique vit dans ProjectScaffoldService.
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectScaffoldHex } from '@/hooks/hexagonal/useProjectScaffoldHex';
import { formatAmount2 } from '@/utils/reportNumbers';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

interface ProjectScaffoldCardProps {
  projectId: string;
  onCompleted?: () => void;
}

const ProjectScaffoldCard: React.FC<ProjectScaffoldCardProps> = ({ projectId, onCompleted }) => {
  const { plan, isLoadingPlan, scaffoldProject, isScaffolding } = useProjectScaffoldHex(projectId);

  const nothingToDo =
    !!plan && !plan.needsBaselineDqe && !plan.needsTasks && !plan.needsStatusSync;

  const handleRun = async () => {
    await scaffoldProject();
    onCompleted?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Compléter le projet depuis les référentiels
          </span>
          <Button onClick={handleRun} disabled={isScaffolding || isLoadingPlan || !plan?.phaseCount}>
            {isScaffolding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Complétion…
              </>
            ) : (
              'Compléter le projet'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{plan?.phaseCount ?? 0} phase(s)</Badge>
          <Badge variant="outline">{plan?.boqLineCount ?? 0} ligne(s) DQE</Badge>
          <Badge variant="outline">{plan?.taskCount ?? 0} tâche(s) rattachée(s)</Badge>
          <Badge variant="outline">Budget {formatAmount2(plan?.budgetTotal ?? 0, plan?.currency ?? 'MRU')}</Badge>
        </div>

        {nothingToDo ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Le projet est déjà complet : DQE, ressources, tâches et statuts de phases sont alignés.
          </p>
        ) : (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {plan?.needsStatusSync && <li>• Statuts de phases à recaler sur les dates réelles</li>}
            {plan?.needsBaselineDqe && (
              <li>• DQE prévisionnel à générer et répartir sur les phases depuis le budget</li>
            )}
            {plan?.needsTasks && (
              <li>• {plan.pendingLines ?? plan.pendingTaskLines} ligne(s) de bordereau à convertir en tâches</li>
            )}
            {!plan?.phaseCount && <li>• Générez d'abord les phases depuis un référentiel</li>}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectScaffoldCard;
