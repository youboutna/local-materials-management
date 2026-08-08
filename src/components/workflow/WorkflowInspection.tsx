/**
 * WorkflowInspection
 * ------------------
 * Composant d'inspection workflow conforme à l'architecture hexagonale.
 * Aucun import legacy, aucun accès direct aux tables Supabase. Toutes les données
 * proviennent du DTO `ProjectWithPaymentsDTO` et des hooks hexagonaux.
 *
 * Round-trip: UI → DTO (camelCase) → Service → Adapter → DB (snake_case).
 */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { InspectionDialog } from '@/components/project/InspectionDialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  useUpdateProjectStatusHex,
  useProjectWithPaymentsHex,
} from '@/hooks/hexagonal';
import type {
  ProjectWithPaymentsDTO,
  InspectionStatus,
} from '@/dtos/entities/ProjectWithPaymentsDTO';

interface WorkflowInspectionProps {
  project: ProjectWithPaymentsDTO;
  onInspectionUpdate?: () => void;
}

export function WorkflowInspection({ project, onInspectionUpdate }: WorkflowInspectionProps) {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const updateProjectStatus = useUpdateProjectStatusHex();
  // Re-hydrate via service après création (round-trip)
  const { data: hydrated, refetch } = useProjectWithPaymentsHex(project.id);

  const sortedInspections = useMemo(() => {
    const list = (hydrated?.inspections ?? project.inspections) || [];
    return [...list].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [hydrated, project.inspections]);

  const handleInspectionCreated = async () => {
    try {
      const fresh = await refetch();
      const dto = fresh.data;
      if (!dto || !dto.inspections.length) {
        if (onInspectionUpdate) onInspectionUpdate();
        return;
      }

      const latest = dto.inspections[0];
      const reference = dto.inspections.find(
        (i) => i.status === 'approved' || i.status === 'requires_changes',
      );
      const newProgress = reference?.progressAtInspection ?? dto.progress;

      let newStatus: string = dto.status;
      if (latest.status === 'approved') {
        newStatus = newProgress >= 100 ? 'terminé' : 'en cours';
      } else if (latest.status === 'requires_changes' || latest.status === 'pending') {
        newStatus = 'en inspection';
      } else if (latest.status === 'rejected') {
        newStatus = 'suspendu';
      }

      if (newStatus !== dto.status) {
        await updateProjectStatus.mutateAsync({
          projectId: dto.id,
          status: newStatus,
        });
      }

      toast({
        title: t('inspection.dialog.created'),
        description: `${t('projects.progress_done')}: ${newProgress}% — ${newStatus}`,
      });

      if (onInspectionUpdate) onInspectionUpdate();
    } catch (error) {
      console.error('WorkflowInspection.handleInspectionCreated failed:', error);
      toast({
        title: t('inspection.dialog.error'),
        description: t('inspection.dialog.error_description'),
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: InspectionStatus | string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'requires_changes':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: InspectionStatus | string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'requires_changes':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: InspectionStatus | string) => {
    switch (status) {
      case 'approved':
        return t('inspection.dialog.status_approved');
      case 'pending':
        return t('inspection.dialog.status_pending');
      case 'requires_changes':
        return t('inspection.dialog.status_requires_changes');
      case 'rejected':
        return t('inspection.dialog.status_rejected');
      default:
        return String(status);
    }
  };

  const approvedInspections = sortedInspections.filter((i) => i.status === 'approved').length;
  const totalInspections = sortedInspections.length;
  const workflowProgress =
    totalInspections > 0 ? (approvedInspections / totalInspections) * 100 : 0;

  const projectForDialog = hydrated ?? project;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-adrar-600" />
            {t('inspection.dialog.title')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/inspection-monitoring')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Suivi des Inspections
            </Button>
            <InspectionDialog
              project={projectForDialog}
              onInspectionCreated={handleInspectionCreated}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('projects.progress_done')}</span>
            <span>
              {Math.round(workflowProgress)}% {t('inspection.dialog.status_approved')}
            </span>
          </div>
          <Progress value={workflowProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {approvedInspections} {t('inspection.dialog.status_approved')} / {totalInspections}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sortedInspections.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('inspection.dialog.new_inspection')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('inspection.dialog.description').replace('{project}', projectForDialog.title)}
            </p>
            <InspectionDialog
              project={projectForDialog}
              onInspectionCreated={handleInspectionCreated}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {sortedInspections.map((inspection, index) => (
                <div key={inspection.id} className="relative">
                  {index < sortedInspections.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
                  )}

                  <div
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedStep === index
                        ? 'bg-adrar-50 border-adrar-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedStep(selectedStep === index ? null : index)}
                  >
                    <div className="flex-shrink-0 mt-1">{getStatusIcon(inspection.status)}</div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">
                            {t('inspection.dialog.title')} #{totalInspections - index}
                          </h4>
                          <Badge className={getStatusColor(inspection.status)}>
                            {getStatusText(inspection.status)}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(inspection.date), 'dd/MM/yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {inspection.inspector ?? '—'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span>
                            {inspection.progressAtInspection ?? 0}% {t('project.progress')}
                          </span>
                        </div>
                      </div>

                      {selectedStep === index && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2">{t('inspection.dialog.title')}</h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('inspection.dialog.date')}:
                                  </span>
                                  <span className="ml-2">
                                    {format(new Date(inspection.date), 'dd MMMM yyyy')}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('inspection.dialog.inspector')}:
                                  </span>
                                  <span className="ml-2">{inspection.inspector ?? '—'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    {t('inspection.dialog.progress')}:
                                  </span>
                                  <span className="ml-2">
                                    {inspection.progressAtInspection ?? 0}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {inspection.comments && (
                              <div>
                                <h5 className="font-medium mb-2">
                                  {t('inspection.dialog.comments')}
                                </h5>
                                <div className="bg-gray-50 p-3 rounded text-sm">
                                  {inspection.comments}
                                </div>
                              </div>
                            )}
                          </div>

                          {inspection.status === 'requires_changes' && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-center gap-2 text-orange-800">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-medium">
                                  {t('inspection.dialog.status_requires_changes')}
                                </span>
                              </div>
                              <p className="text-sm text-orange-700 mt-1">
                                {t('inspection.dialog.status_requires_changes')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {index < sortedInspections.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3">{t('projects.overview.description')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sortedInspections.filter((i) => i.status === 'approved').length}
                  </div>
                  <div className="text-muted-foreground">
                    {t('inspection.dialog.status_approved')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {sortedInspections.filter((i) => i.status === 'pending').length}
                  </div>
                  <div className="text-muted-foreground">
                    {t('inspection.dialog.status_pending')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {sortedInspections.filter((i) => i.status === 'requires_changes').length}
                  </div>
                  <div className="text-muted-foreground">
                    {t('inspection.dialog.status_requires_changes')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {sortedInspections.filter((i) => i.status === 'rejected').length}
                  </div>
                  <div className="text-muted-foreground">
                    {t('inspection.dialog.status_rejected')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
