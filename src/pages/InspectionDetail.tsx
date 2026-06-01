// @ts-nocheck
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, User, FileText, TrendingUp, Edit, Play, ClipboardList, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useInspectionHex } from '@/hooks/hexagonal';
import FieldInspectionExecutor from '@/components/inspections/FieldInspectionExecutor';
import InspectionPVGenerator from '@/components/inspections/InspectionPVGenerator';
import { useQueryClient } from '@tanstack/react-query';

const InspectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = useCurrentUserRoles();
  const [activeTab, setActiveTab] = useState('details');

  const isInspector = hasAnyRole(['inspector', 'engineer', 'consultant', 'engineering_consultant']);
  const canExecute = isInspector;

  const { inspection, isLoading, error } = useInspectionHex(id);

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ['inspection-hex', id] });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Planifiée', variant: 'outline' as const },
      in_progress: { label: 'En cours', variant: 'default' as const },
      approved: { label: 'Approuvée', variant: 'default' as const },
      rejected: { label: 'Rejetée', variant: 'destructive' as const },
      requires_changes: { label: 'Modifications requises', variant: 'secondary' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">Erreur lors du chargement de l'inspection</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const projectTitle = inspection.projectTitle || 'Projet non spécifié';

  // Transform to snake_case for legacy components
  const inspectionData = {
    id: inspection.id,
    project_id: inspection.projectId,
    phase_id: inspection.phaseId,
    date: inspection.date,
    inspector: inspection.inspector,
    status: inspection.status,
    progress_at_inspection: inspection.progressAtInspection,
    comments: inspection.comments,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-2">
              {canExecute && (inspection.status === 'scheduled' || inspection.status === 'in_progress') && (
                <Button variant="outline" onClick={() => setActiveTab('execution')}>
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter
                </Button>
              )}
              <Button onClick={() => navigate(`/inspections/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Détails
              </TabsTrigger>
              {canExecute && (
                <TabsTrigger value="execution" className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Exécution Terrain
                </TabsTrigger>
              )}
              <TabsTrigger value="pv" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Procès-Verbal
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl mb-2">Détail de l'inspection</CardTitle>
                      <CardDescription>{projectTitle}</CardDescription>
                    </div>
                    {getStatusBadge(inspection.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date d'inspection
                      </div>
                      <p className="text-lg font-medium">
                        {format(new Date(inspection.date), 'PPP', { locale: fr })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="h-4 w-4 mr-2" />
                        Inspecteur
                      </div>
                      <p className="text-lg font-medium">{inspection.inspector}</p>
                    </div>

                    {inspection.progressAtInspection !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Progression lors de l'inspection
                        </div>
                        <p className="text-lg font-medium">{inspection.progressAtInspection}%</p>
                      </div>
                    )}
                  </div>

                  {inspection.comments && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <FileText className="h-4 w-4 mr-2" />
                          Commentaires
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {inspection.comments}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Créé le:</span>{' '}
                      {format(new Date(inspection.createdAt), 'PPP à HH:mm', { locale: fr })}
                    </div>
                    <div>
                      <span className="font-medium">Modifié le:</span>{' '}
                      {format(new Date(inspection.updatedAt), 'PPP à HH:mm', { locale: fr })}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap gap-2">
                    {inspection.projectId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/projects/${inspection.projectId}`}>
                          Projet <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                    {inspection.phaseId && inspection.projectId && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/projects/${inspection.projectId}/phases/${inspection.phaseId}`}>
                          Phase <ExternalLink className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {canExecute && (
              <TabsContent value="execution">
                <FieldInspectionExecutor
                  inspection={inspectionData}
                  projectTitle={projectTitle}
                  onComplete={() => {
                    refetch();
                    setActiveTab('pv');
                  }}
                  onSave={() => refetch()}
                />
              </TabsContent>
            )}

            <TabsContent value="pv">
              <InspectionPVGenerator
                inspection={inspectionData}
                projectTitle={projectTitle}
                onGenerated={(pv, url) => {
                  console.log('PV generated:', pv.pv_number);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
