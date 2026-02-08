/**
 * PhaseWithDirectMilestonesView - Vue pour phases sans étapes
 * Affiche directement les jalons avec leurs actions
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  DollarSign,
  CheckCircle,
  Filter,
} from "lucide-react";
import { MilestoneNode, MilestoneType } from "./MilestoneNode";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface Milestone {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  type?: MilestoneType | string;
  status: string;
  due_date?: string;
  completed_date?: string;
  documents?: any[];
}

interface PhaseWithDirectMilestonesViewProps {
  phase: {
    id: string;
    phase_name?: string;
    project_id?: string;
    milestones?: Milestone[];
  };
  projectId?: string;
  onScheduleInspection?: (milestoneId: string) => void;
  onRequestPayment?: (milestoneId: string) => void;
  onValidateMilestone?: (milestoneId: string) => void;
  onViewMilestoneDetails?: (milestoneId: string) => void;
  onAddMilestone?: () => void;
  className?: string;
}

export const PhaseWithDirectMilestonesView: React.FC<PhaseWithDirectMilestonesViewProps> = ({
  phase,
  projectId,
  onScheduleInspection,
  onRequestPayment,
  onValidateMilestone,
  onViewMilestoneDetails,
  onAddMilestone,
  className,
}) => {
  const milestones = Array.isArray(phase.milestones) ? phase.milestones : [];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Stats par type
  const stats = useMemo(() => {
    const byType = {
      inspection: milestones.filter(m => m.type === "inspection").length,
      payment: milestones.filter(m => m.type === "payment" || m.type === "paiement").length,
      validation: milestones.filter(m => m.type === "validation").length,
      other: milestones.filter(m => !["inspection", "payment", "paiement", "validation"].includes(m.type || "")).length,
    };
    const byStatus = {
      completed: milestones.filter(m => m.status === "completed").length,
      in_progress: milestones.filter(m => m.status === "in_progress").length,
      pending: milestones.filter(m => m.status === "pending").length,
    };
    return { byType, byStatus };
  }, [milestones]);

  // Filtrer les jalons
  const filteredMilestones = useMemo(() => {
    return milestones.filter(m => {
      if (filterType && m.type !== filterType) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      return true;
    });
  }, [milestones, filterType, filterStatus]);

  // Grouper par type
  const groupedMilestones = useMemo(() => {
    const groups: Record<string, Milestone[]> = {
      inspection: [],
      payment: [],
      validation: [],
      other: [],
    };
    
    filteredMilestones.forEach(m => {
      const type = m.type?.toLowerCase() || "other";
      if (type === "inspection") groups.inspection.push(m);
      else if (type === "payment" || type === "paiement") groups.payment.push(m);
      else if (type === "validation") groups.validation.push(m);
      else groups.other.push(m);
    });
    
    return groups;
  }, [filteredMilestones]);

  const clearFilters = () => {
    setFilterType(null);
    setFilterStatus(null);
  };

  const hasFilters = filterType || filterStatus;

  if (milestones.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun jalon défini</h3>
          <p className="text-muted-foreground mb-4">
            Cette phase n'a pas de jalons configurés.
          </p>
          {onAddMilestone && (
            <Button onClick={onAddMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un jalon
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5" />
              Jalons directs ({milestones.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Badges stats */}
              <div className="hidden md:flex items-center gap-1">
                {stats.byType.inspection > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <ClipboardCheck className="h-3 w-3 mr-1" />
                    {stats.byType.inspection}
                  </Badge>
                )}
                {stats.byType.payment > 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {stats.byType.payment}
                  </Badge>
                )}
                {stats.byType.validation > 0 && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {stats.byType.validation}
                  </Badge>
                )}
              </div>

              {/* Filtres */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={hasFilters ? "secondary" : "ghost"} size="sm">
                    <Filter className="h-4 w-4 mr-1" />
                    Filtrer
                    {hasFilters && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                        {(filterType ? 1 : 0) + (filterStatus ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Par type</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterType(filterType === "inspection" ? null : "inspection")}>
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    Inspections
                    {filterType === "inspection" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType(filterType === "payment" ? null : "payment")}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Paiements
                    {filterType === "payment" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType(filterType === "validation" ? null : "validation")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validations
                    {filterType === "validation" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Par statut</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setFilterStatus(filterStatus === "pending" ? null : "pending")}>
                    En attente
                    {filterStatus === "pending" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(filterStatus === "in_progress" ? null : "in_progress")}>
                    En cours
                    {filterStatus === "in_progress" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus(filterStatus === "completed" ? null : "completed")}>
                    Complétés
                    {filterStatus === "completed" && <CheckCircle className="h-3 w-3 ml-auto" />}
                  </DropdownMenuItem>
                  
                  {hasFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                        Effacer les filtres
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {onAddMilestone && (
                <Button variant="ghost" size="sm" onClick={onAddMilestone}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              )}
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Groupe Inspections */}
            {groupedMilestones.inspection.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardCheck className="h-3 w-3 text-blue-600" />
                  Inspections ({groupedMilestones.inspection.length})
                </div>
                <div className="space-y-2">
                  {groupedMilestones.inspection.map((milestone) => (
                    <MilestoneNode
                      key={milestone.id}
                      milestone={milestone}
                      phaseId={phase.id}
                      projectId={projectId || phase.project_id}
                      onScheduleInspection={onScheduleInspection}
                      onRequestPayment={onRequestPayment}
                      onValidate={onValidateMilestone}
                      onViewDetails={onViewMilestoneDetails}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Groupe Paiements */}
            {groupedMilestones.payment.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  Paiements ({groupedMilestones.payment.length})
                </div>
                <div className="space-y-2">
                  {groupedMilestones.payment.map((milestone) => (
                    <MilestoneNode
                      key={milestone.id}
                      milestone={milestone}
                      phaseId={phase.id}
                      projectId={projectId || phase.project_id}
                      onScheduleInspection={onScheduleInspection}
                      onRequestPayment={onRequestPayment}
                      onValidate={onValidateMilestone}
                      onViewDetails={onViewMilestoneDetails}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Groupe Validations */}
            {groupedMilestones.validation.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-purple-600" />
                  Validations ({groupedMilestones.validation.length})
                </div>
                <div className="space-y-2">
                  {groupedMilestones.validation.map((milestone) => (
                    <MilestoneNode
                      key={milestone.id}
                      milestone={milestone}
                      phaseId={phase.id}
                      projectId={projectId || phase.project_id}
                      onScheduleInspection={onScheduleInspection}
                      onRequestPayment={onRequestPayment}
                      onValidate={onValidateMilestone}
                      onViewDetails={onViewMilestoneDetails}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Groupe Autres */}
            {groupedMilestones.other.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-2">
                  <Target className="h-3 w-3" />
                  Autres jalons ({groupedMilestones.other.length})
                </div>
                <div className="space-y-2">
                  {groupedMilestones.other.map((milestone) => (
                    <MilestoneNode
                      key={milestone.id}
                      milestone={milestone}
                      phaseId={phase.id}
                      projectId={projectId || phase.project_id}
                      onScheduleInspection={onScheduleInspection}
                      onRequestPayment={onRequestPayment}
                      onValidate={onValidateMilestone}
                      onViewDetails={onViewMilestoneDetails}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message si aucun résultat après filtrage */}
            {filteredMilestones.length === 0 && hasFilters && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun jalon ne correspond aux filtres.</p>
                <Button variant="link" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PhaseWithDirectMilestonesView;
