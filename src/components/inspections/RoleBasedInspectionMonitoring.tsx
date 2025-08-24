import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  Eye,
  Users,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { sendNotification } from '@/services/notificationService';
import AdvancedInspectionScheduler from './AdvancedInspectionScheduler';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { supabase } from '@/integrations/supabase/client';

interface Inspection {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: string;
  progress_at_inspection: number;
  comments?: string | null;
  created_at: string;
  updated_at: string;
  phase_id?: string | null;
  documents?: any;
}

interface Project {
  id: string;
  title: string;
  project_reference?: string | null;
}

const RoleBasedInspectionMonitoring: React.FC = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasAnyRole, userRoles } = useCurrentUserRoles();
  const { toast } = useToast();

  const isProjectManager = hasAnyRole(['admin', 'director', 'project_manager', 'manager']);
  const isInspector = hasAnyRole(['inspector', 'engineer', 'consultant']);
  const isEngineeringConsultant = hasAnyRole(['consultant', 'engineer', 'engineering_consultant']);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch inspections
      const { data: inspectionsData, error: inspectionsError } = await supabase
        .from('inspections')
        .select('*')
        .order('date', { ascending: false });

      if (inspectionsError) throw inspectionsError;

      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, title, project_reference');

      if (projectsError) throw projectsError;

      setInspections(inspectionsData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleInspection = async (projectId: string, inspectorId: string, date: string, additionalData?: any) => {
    try {
      // Get inspector name from employees table
      const { data: inspector, error: inspectorError } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', inspectorId)
        .single();

      if (inspectorError) throw inspectorError;

      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: projectId,
          inspector: inspector.full_name,
          date: date,
          status: 'scheduled',
          progress_at_inspection: additionalData?.target_progress || 0,
          comments: additionalData?.requirements || null
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to engineering consultant
      await supabase
        .from('notifications')
        .insert({
          recipient_id: 'engineering_consultant_id', // Would be dynamic in real app
          title: 'Nouvelle inspection programmée',
          message: `Une inspection a été programmée pour le projet ${projectId} le ${date}`,
          type: 'inspection_scheduled',
          related_id: data.id
        });

      toast({
        title: "Succès",
        description: "Inspection programmée et notification envoyée",
      });

      fetchData();
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de programmer l'inspection",
        variant: "destructive",
      });
    }
  };

  const updateInspectionStatus = async (inspectionId: string, status: string, progress?: number) => {
    try {
      const updateData: any = { status };
      if (progress !== undefined) {
        updateData.progress_at_inspection = progress;
      }

      const { error } = await supabase
        .from('inspections')
        .update(updateData)
        .eq('id', inspectionId);

      if (error) throw error;

      // Send notification to project manager
      await supabase
        .from('notifications')
        .insert({
          recipient_id: 'project_manager_id', // Would be dynamic in real app
          title: 'Statut d\'inspection mis à jour',
          message: `L'inspection ${inspectionId} a été mise à jour: ${status}`,
          type: 'inspection_update',
          related_id: inspectionId
        });

      toast({
        title: "Succès",
        description: "Statut mis à jour et notification envoyée",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'inspection",
        variant: "destructive",
      });
    }
  };

  const sendAlertToHierarchy = async (inspectionId: string, message: string) => {
    try {
      // Send alerts to hierarchy (director, admin)
      const hierarchyRoles = ['director', 'admin'];
      
      for (const role of hierarchyRoles) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: `${role}_user_id`, // Would be dynamic in real app
            title: 'Alerte inspection critique',
            message: message,
            type: 'inspection_alert',
            related_id: inspectionId,
            metadata: { priority: 'urgent' }
          });
      }

      toast({
        title: "Succès",
        description: "Alerte envoyée à la hiérarchie",
      });
    } catch (error) {
      console.error('Error sending alert:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'alerte",
        variant: "destructive",
      });
    }
  };

  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : projectId;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      scheduled: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Programmée" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "En cours" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Terminée" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: AlertTriangle, label: "Annulée" },
      failed: { color: "bg-red-100 text-red-800", icon: AlertTriangle, label: "Échouée" }
    };
    
    const config = configs[status as keyof typeof configs] || configs.scheduled;
    const Icon = config.icon;
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🔍 Surveillance des Inspections</h2>
        <div className="text-sm text-muted-foreground">
          Rôle actuel: {userRoles.join(', ')}
        </div>
      </div>

      {/* Role-based access notice */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          {isProjectManager && "Vous pouvez programmer des inspections et surveiller les progrès."}
          {isEngineeringConsultant && "Vous recevrez les notifications d'inspections programmées."}
          {isInspector && "Vous pouvez mettre à jour le statut des inspections."}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Surveillance
          </TabsTrigger>
          {isProjectManager && (
            <TabsTrigger value="scheduling" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Programmation
            </TabsTrigger>
          )}
          {isInspector && (
            <TabsTrigger value="execution" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Réalisation
            </TabsTrigger>
          )}
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertes
          </TabsTrigger>
        </TabsList>

        {/* Monitoring Tab - Visible to all */}
        <TabsContent value="monitoring" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de Bord des Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Inspecteur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-medium">
                        {getProjectTitle(inspection.project_id)}
                      </TableCell>
                      <TableCell>{inspection.inspector}</TableCell>
                      <TableCell>
                        {new Date(inspection.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inspection.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${inspection.progress_at_inspection}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {inspection.progress_at_inspection}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isProjectManager && inspection.status === 'failed' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => sendAlertToHierarchy(inspection.id, `Inspection échouée pour le projet ${getProjectTitle(inspection.project_id)}`)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling Tab - Project Managers, Directors, Admins only */}
        {(isProjectManager || hasAnyRole(['director', 'admin'])) && (
          <TabsContent value="scheduling" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Programmation d'Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Calendar className="h-4 w-4" />
                  <AlertDescription>
                    Programmez des inspections avec critères spécifiques et notifiez automatiquement l'entrepreneur principal.
                  </AlertDescription>
                </Alert>
                
                <AdvancedInspectionScheduler 
                  projects={projects}
                  onScheduleInspection={scheduleInspection}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Execution Tab - Inspectors only */}
        {isInspector && (
          <TabsContent value="execution" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Réalisation d'Inspections</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    En tant qu'inspecteur, vous pouvez mettre à jour le statut et la progression des inspections.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {inspections
                    .filter(i => i.status === 'scheduled' || i.status === 'in_progress')
                    .map((inspection) => (
                    <Card key={inspection.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">{getProjectTitle(inspection.project_id)}</h4>
                            <p className="text-sm text-muted-foreground">
                              Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          {getStatusBadge(inspection.status)}
                        </div>
                        
                        <div className="flex gap-2">
                          {inspection.status === 'scheduled' && (
                            <Button 
                              size="sm"
                              onClick={() => updateInspectionStatus(inspection.id, 'in_progress')}
                            >
                              Commencer
                            </Button>
                          )}
                          {inspection.status === 'in_progress' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => updateInspectionStatus(inspection.id, 'completed', 100)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Terminer
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateInspectionStatus(inspection.id, 'failed')}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Échec
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Alerts Tab - All roles */}
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertes et Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overdue inspections */}
                {inspections
                  .filter(i => new Date(i.date) < new Date() && i.status === 'scheduled')
                  .map((inspection) => (
                  <Alert key={inspection.id} className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Inspection en retard:</strong> {getProjectTitle(inspection.project_id)} 
                      - Prévue le {new Date(inspection.date).toLocaleDateString('fr-FR')}
                      {isProjectManager && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => sendAlertToHierarchy(inspection.id, `Inspection en retard: ${getProjectTitle(inspection.project_id)}`)}
                        >
                          Alerter la hiérarchie
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
                
                {/* Failed inspections */}
                {inspections
                  .filter(i => i.status === 'failed')
                  .map((inspection) => (
                  <Alert key={inspection.id} className="border-orange-200 bg-orange-50">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      <strong>Inspection échouée:</strong> {getProjectTitle(inspection.project_id)}
                      {isProjectManager && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="ml-2"
                          onClick={() => sendAlertToHierarchy(inspection.id, `Inspection échouée nécessitant une action: ${getProjectTitle(inspection.project_id)}`)}
                        >
                          Escalader
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleBasedInspectionMonitoring;