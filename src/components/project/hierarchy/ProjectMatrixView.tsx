import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Milestone,
  ClipboardCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  id: string;
  title?: string;
  phase_name?: string;
  phase?: string;
  name?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  milestones?: any[];
  inspections?: any[];
  payments?: any[];
}

interface ProjectMatrixViewProps {
  projectId: string;
  phases: Phase[];
  onPhaseClick?: (phaseId: string) => void;
}

interface MilestoneBadgesProps {
  completed: number;
  total: number;
  type: "milestone" | "inspection" | "payment";
}

const MilestoneBadges: React.FC<MilestoneBadgesProps> = ({ completed, total, type }) => {
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const getConfig = () => {
    switch (type) {
      case "milestone":
        return {
          icon: <Milestone className="h-3 w-3" />,
          color: completed === total ? "bg-success/10 text-success" : "bg-muted",
        };
      case "inspection":
        return {
          icon: <ClipboardCheck className="h-3 w-3" />,
          color: completed === total ? "bg-success/10 text-success" : "bg-info/10 text-info",
        };
      case "payment":
        return {
          icon: <Wallet className="h-3 w-3" />,
          color: completed === total ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
        };
    }
  };

  const config = getConfig();

  return (
    <Badge variant="outline" className={cn("text-xs gap-1", config.color)}>
      {config.icon}
      <span>{completed}/{total}</span>
    </Badge>
  );
};

export const ProjectMatrixView: React.FC<ProjectMatrixViewProps> = ({
  projectId,
  phases,
  onPhaseClick,
}) => {
  const navigate = useNavigate();

  const handleViewPhase = (phaseId: string) => {
    if (onPhaseClick) {
      onPhaseClick(phaseId);
    } else {
      navigate(`/projects/${projectId}/phases/${phaseId}`);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          label: "Terminée",
          className: "bg-success/10 text-success border-success/20",
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case "in_progress":
        return {
          label: "En cours",
          className: "bg-info/10 text-info border-info/20",
          icon: <Clock className="h-3 w-3" />,
        };
      case "delayed":
        return {
          label: "En retard",
          className: "bg-destructive/10 text-destructive border-destructive/20",
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      default:
        return {
          label: "Planifiée",
          className: "bg-muted text-muted-foreground",
          icon: <Target className="h-3 w-3" />,
        };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  const calculatePhaseStats = (phase: Phase) => {
    const milestones = phase.milestones || [];
    const inspections = phase.inspections || [];
    const payments = phase.payments || [];

    return {
      milestones: {
        total: milestones.length,
        completed: milestones.filter((m) => m.status === "completed").length,
      },
      inspections: {
        total: inspections.length,
        completed: inspections.filter((i) => i.status === "completed" || i.status === "approved").length,
      },
      payments: {
        total: payments.length,
        completed: payments.filter((p) => p.status === "paid" || p.status === "completed").length,
      },
    };
  };

  if (phases.length === 0) {
    return null;
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Vue Matrice : Projet × Phases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Phase</TableHead>
                <TableHead className="text-center font-semibold w-32">Progression</TableHead>
                <TableHead className="text-center font-semibold">Jalons</TableHead>
                <TableHead className="text-center font-semibold">Inspections</TableHead>
                <TableHead className="text-center font-semibold">Paiements</TableHead>
                <TableHead className="text-center font-semibold w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phases.map((phase) => {
                const phaseName = phase.title || phase.phase_name || phase.phase || phase.name || "Phase";
                const startDate = phase.startDate || phase.start_date;
                const endDate = phase.endDate || phase.end_date;
                const statusConfig = getStatusConfig(phase.status);
                const stats = calculatePhaseStats(phase);

                return (
                  <TableRow 
                    key={phase.id} 
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleViewPhase(phase.id)}
                  >
                    <TableCell>
                      <div className="min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{phaseName}</span>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs shrink-0", statusConfig.className)}
                          >
                            {statusConfig.icon}
                            <span className="ml-1">{statusConfig.label}</span>
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(startDate)} → {formatDate(endDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <Progress value={phase.progress} className="w-full h-2" />
                        <span className="text-xs font-medium">{phase.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadges
                        completed={stats.milestones.completed}
                        total={stats.milestones.total}
                        type="milestone"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadges
                        completed={stats.inspections.completed}
                        total={stats.inspections.total}
                        type="inspection"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <MilestoneBadges
                        completed={stats.payments.completed}
                        total={stats.payments.total}
                        type="payment"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPhase(phase.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectMatrixView;
