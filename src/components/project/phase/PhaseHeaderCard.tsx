import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Edit, 
  Layers, 
  RefreshCw,
  Target 
} from 'lucide-react';
import { PhaseDTO } from '@/types/phase-dto';
import { cn } from '@/lib/utils';
import {
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
  formatDate,
  formatCurrency,
  calculateRemainingDays,
} from '@/utils/phaseHelpers';

interface PhaseHeaderCardProps {
  phase: PhaseDTO;
  projectId: string;
  onBack: () => void;
  onEdit?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const PhaseHeaderCard: React.FC<PhaseHeaderCardProps> = ({
  phase,
  projectId,
  onBack,
  onEdit,
  onRefresh,
  isRefreshing = false,
}) => {
  const remainingDays = calculateRemainingDays(phase.end_date);
  const stepsCount = phase.steps?.length || 0;
  const completedSteps = phase.steps?.filter(s => s.status === 'completed').length || 0;

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Back + Title */}
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl lg:text-2xl font-bold">
                  {phase.phase_name}
                </CardTitle>
                <Badge 
                  className={cn(
                    "flex items-center gap-1.5",
                    getStatusColor(phase.status)
                  )}
                >
                  {getStatusIcon(phase.status)}
                  <span>{getStatusLabel(phase.status)}</span>
                </Badge>
              </div>
              {phase.description && (
                <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                  {phase.description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            {onRefresh && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={onRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Rafraîchir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progression globale</span>
            <span className="text-2xl font-bold text-primary">{phase.progress || 0}%</span>
          </div>
          <Progress value={phase.progress || 0} className="h-3" />
          {stepsCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {completedSteps}/{stepsCount} étapes complétées
            </p>
          )}
        </div>

        <Separator className="mb-4" />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Dates */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Période</span>
            </div>
            <p className="text-sm font-medium">
              {formatDate(phase.start_date)} — {formatDate(phase.end_date)}
            </p>
          </div>

          {/* Remaining Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Temps restant</span>
            </div>
            <p className={cn(
              "text-sm font-medium",
              typeof remainingDays === 'number' && remainingDays < 7 
                ? "text-red-600" 
                : "text-foreground"
            )}>
              {typeof remainingDays === 'number' ? `${remainingDays} jours` : remainingDays}
            </p>
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Budget estimé</span>
            </div>
            <p className="text-sm font-medium">
              {formatCurrency(phase.estimated_cost)}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>Étapes</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{stepsCount}</p>
              {completedSteps > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {completedSteps} ✓
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PhaseHeaderCard;
