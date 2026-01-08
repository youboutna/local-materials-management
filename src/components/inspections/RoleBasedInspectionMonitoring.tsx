import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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
  TrendingUp,
  Settings,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ExternalLink,
  Search,
  Pencil
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { NotificationService } from '@/services/NotificationService';
import { createInspectionAction } from '@/services/inspectionActionService';
import AdvancedInspectionScheduler from './AdvancedInspectionScheduler';
import InspectionExecutionForm from './InspectionExecutionForm';
import { useToast, toast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { usePagination } from '@/hooks/usePagination';
import { supabase } from '@/integrations/supabase/client';
import { ActionsDropdown } from '@/components/actions/ActionsDropdown';
import OrganizationalHierarchyService from '@/services/organizationalHierarchyService';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { hasAnyRole, userRoles } = useCurrentUserRoles();
  const { toast } = useToast();
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [editFormData, setEditFormData] = useState({
    inspector: '',
    date: '',
    status: '',
    progress_at_inspection: 0,
    comments: ''
  });
  const [saving, setSaving] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Helper function to get project title
  const getProjectTitle = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : projectId;
  };

  // Filter inspections based on search query
  const filteredInspections = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return inspections;
    }

    const query = debouncedSearchQuery.toLowerCase();
    return inspections.filter((inspection) => {
      const projectTitle = getProjectTitle(inspection.project_id).toLowerCase();
      const inspector = inspection.inspector?.toLowerCase() || '';
      const comments = inspection.comments?.toLowerCase() || '';
      const status = inspection.status.toLowerCase();
      
      return (
        projectTitle.includes(query) ||
        inspector.includes(query) ||
        comments.includes(query) ||
        status.includes(query)
      );
    });
  }, [inspections, debouncedSearchQuery, projects]);

  const {
    currentData: paginatedInspections,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    goToPage
  } = usePagination({
    data: filteredInspections,
    itemsPerPage: 10
  });

  const isProjectManager = hasAnyRole(['admin', 'director', 'project_manager', 'manager']);
  const isInspector = hasAnyRole(['inspector', 'engineer', 'consultant']);
  const isEngineeringConsultant = hasAnyRole(['consultant', 'engineer', 'engineering_consultant']);

  useEffect(() => {
    fetchData();
  }, []);

  // Handle edit from URL param
  useEffect(() => {
    const inspectionId = searchParams.get('id');
    if (inspectionId && inspections.length > 0) {
      const inspection = inspections.find(i => i.id === inspectionId);
      if (inspection) {
        openEditDialog(inspection);
        // Clear the URL param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, inspections]);

  const openEditDialog = (inspection: Inspection) => {
    setEditingInspection(inspection);
    setEditFormData({
      inspector: inspection.inspector,
      date: new Date(inspection.date).toISOString().split('T')[0],
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection || 0,
      comments: inspection.comments || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInspection) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('inspections')
        .update({
          inspector: editFormData.inspector,
          date: editFormData.date,
          status: editFormData.status,
          progress_at_inspection: editFormData.progress_at_inspection,
          comments: editFormData.comments
        })
        .eq('id', editingInspection.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Inspection mise à jour avec succès"
      });
      
      setIsEditDialogOpen(false);
      setEditingInspection(null);
      fetchData();
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'inspection",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch inspections - filter by inspector if user is inspector
      let inspectionsQuery = supabase
        .from('inspections')
        .select('*');
      
      if (isInspector && !isProjectManager && user) {
        // Get employee/supplier record for current user
        const { data: employee } = await supabase
          .from('employees')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (employee) {
          inspectionsQuery = inspectionsQuery.eq('inspector', employee.full_name);
        } else {
          // Check if user is a supplier
          const { data: supplier } = await supabase
            .from('suppliers')
            .select('name, contact_person')
            .eq('user_id', user.id)
            .single();
          
          if (supplier) {
            const supplierName = supplier.contact_person || supplier.name;
            inspectionsQuery = inspectionsQuery.eq('inspector', supplierName);
          }
        }
      }
      
      const { data: inspectionsData, error: inspectionsError } = await inspectionsQuery
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
      // Get inspector name from employees or suppliers table
      let inspector;
      let inspectorError;

      // First try employees table
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('full_name')
        .eq('id', inspectorId)
        .single();

      if (empError && empError.code !== 'PGRST116') {
        // If it's not a "not found" error, throw it
        throw empError;
      }

      if (employeeData) {
        inspector = employeeData;
      } else {
        // Try suppliers table
        const { data: supplierData, error: suppError } = await supabase
          .from('suppliers')
          .select('name, contact_person')
          .eq('id', inspectorId)
          .single();

        if (suppError) throw suppError;
        inspector = { full_name: supplierData.contact_person || supplierData.name };
      }

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

  const updateInspectionStatus = async (inspectionId: string, status: string, progress?: number, documents?: File[]) => {
    try {
      const inspection = inspections.find(i => i.id === inspectionId);
      if (!inspection) throw new Error('Inspection not found');

      const updateData: any = { status };
      if (progress !== undefined) {
        updateData.progress_at_inspection = progress;
      }

      // Upload validation documents if any
      const uploadedDocs: Array<{ name: string; url: string; uploadedAt: string }> = [];
      if (documents && documents.length > 0) {
        const uploadPromises = documents.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          const filePath = `inspections/${inspection.project_id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-documents')
            .getPublicUrl(filePath);

          return {
            name: file.name,
            url: publicUrl,
            uploadedAt: new Date().toISOString()
          };
        });

        const docs = await Promise.all(uploadPromises);
        uploadedDocs.push(...docs);
        updateData.documents = {
          ...(inspection.documents || {}),
          validation_documents: docs
        };
      }

      const { error } = await supabase
        .from('inspections')
        .update(updateData)
        .eq('id', inspectionId);

      if (error) throw error;

      // Si le statut est "approved", utiliser le service de synchronisation complet
      if (status === 'approved') {
        const { getInspectionApprovalSyncService } = await import('@/services/InspectionApprovalSyncService');
        const syncService = getInspectionApprovalSyncService();
        
        const syncResult = await syncService.synchronizeOnApproval({
          inspectionId,
          projectId: inspection.project_id,
          phaseId: inspection.phase_id,
          status,
          progressAtInspection: progress ?? inspection.progress_at_inspection,
          inspector: inspection.inspector,
          validationDocuments: uploadedDocs.length > 0 ? uploadedDocs : undefined,
        });

        if (syncResult.success) {
          toast({
            title: "Inspection approuvée",
            description: `Synchronisation complète: ${syncResult.actions.length} action(s) effectuée(s)`,
          });
        } else {
          toast({
            title: "Approbation partielle",
            description: `Attention: ${syncResult.errors.join(', ')}`,
            variant: "destructive",
          });
        }
      } else {
        // Synchronisation simple pour les autres statuts
        const { ProjectService } = await import('@/services/ProjectService');
        const projectService = new ProjectService();
        await projectService.synchronizeProjectProgress(inspection.project_id);

        // Send notification to project manager
        await supabase
          .from('notifications')
          .insert([{
            recipient_id: inspection.inspector,
            title: 'Statut d\'inspection mis à jour',
            message: `L'inspection a été mise à jour: ${status}`,
            type: 'inspection_update',
            related_id: inspectionId
          }]);

        toast({
          title: "Succès",
          description: "Statut mis à jour et progression synchronisée",
        });
      }

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
      const inspection = inspections.find(i => i.id === inspectionId);
      if (!inspection) {
        toast({
          title: "Erreur",
          description: "Inspection introuvable",
          variant: "destructive",
        });
        return;
      }

      // Fetch escalation targets from organizational hierarchy
      const escalationTargets = await OrganizationalHierarchyService.getEscalationTargets(
        inspection.project_id,
        'director'
      );

      if (!escalationTargets || escalationTargets.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un destinataire dans la hiérarchie du projet",
          variant: "destructive",
        });
        return;
      }

      // Send notifications to hierarchy
      for (const target of escalationTargets) {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: target.employee_id,
            title: 'Alerte inspection critique',
            message: message,
            type: 'inspection_alert',
            related_id: inspectionId,
            metadata: { priority: 'urgent', escalation_level: 'director' }
          });
      }

      toast({
        title: "Succès",
        description: `Alerte envoyée à ${escalationTargets.length} personne(s) de la hiérarchie`,
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

  const handleInspectionAction = async (inspectionId: string, actionType: string) => {
    try {
      console.log('Creating inspection action:', { inspectionId, actionType });
      
      const inspection = inspections.find(i => i.id === inspectionId);
      if (!inspection) {
        console.error('Inspection not found:', inspectionId);
        toast({
          title: 'Erreur',
          description: 'Inspection introuvable',
          variant: 'destructive'
        });
        return;
      }

      // Get current user or use a fallback
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id || 'system-user';

      let title = '';
      let message = '';
      
      switch (actionType) {
        case 'task_assignment':
          title = 'Suivi inspection';
          message = `Veuillez suivre l'inspection ${inspectionId} pour le projet ${getProjectTitle(inspection.project_id)}`;
          break;
        case 'hierarchy_notification':
          title = 'Alerte inspection';
          message = `L'inspection ${inspectionId} nécessite une attention particulière`;
          break;
        case 'sms':
          title = 'SMS inspection';
          message = `SMS: Inspection ${inspectionId} - Statut: ${inspection.status}`;
          break;
        case 'call':
          title = 'Appel inspection';
          message = `Appel concernant l'inspection ${inspectionId}`;
          break;
        case 'email':
          title = 'Email inspection';
          message = `Email concernant l'inspection ${inspectionId}`;
          break;
        case 'mail':
          title = 'Courrier inspection';
          message = `Courrier concernant l'inspection ${inspectionId}`;
          break;
        default:
          console.error('Unknown action type:', actionType);
          toast({
            title: 'Erreur',
            description: 'Type d\'action non reconnu',
            variant: 'destructive'
          });
          return;
      }

      console.log('Calling createInspectionAction with:', {
        inspectionId,
        projectId: inspection.project_id,
        inspectorId: inspection.inspector,
        actionType,
        title,
        message,
        priority: 'high',
        assigneeId: currentUserId,
        recipientIds: [currentUserId],
        metadata: { inspectionData: inspection }
      });

      const result = await createInspectionAction({
        inspectionId,
        projectId: inspection.project_id,
        inspectorId: inspection.inspector,
        actionType: actionType as any,
        title,
        message,
        priority: 'high',
        assigneeId: currentUserId,
        recipientIds: [currentUserId],
        metadata: { inspectionData: inspection }
      });

      console.log('Action created successfully:', result);

      toast({
        title: 'Action créée',
        description: `${title} créée avec succès`,
      });
    } catch (error: any) {
      console.error('Error creating inspection action:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de créer l'action: ${error?.message || 'Erreur inconnue'}`,
        variant: 'destructive'
      });
    }
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

  function refreshInspections(): void {
    fetchData();
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Chargement des inspections...</p>
                  </div>
                </div>
              ) : inspections.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune inspection trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    Les inspections programmées apparaîtront ici
                  </p>
                  {isProjectManager && (
                    <p className="text-sm text-muted-foreground">
                      Utilisez l'onglet "Programmation" pour planifier une nouvelle inspection
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="relative flex-1 w-full sm:max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher par projet, inspecteur, commentaire..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                      <p className="text-sm text-muted-foreground">
                        {filteredInspections.length} inspection(s) trouvée(s)
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchData}
                        className="gap-2"
                      >
                        <TrendingUp className="h-4 w-4" />
                        Actualiser
                      </Button>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projet</TableHead>
                        <TableHead>Inspecteur</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead>Commentaires</TableHead>
                        <TableHead>Lien</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedInspections.map((inspection) => (
                        <TableRow key={inspection.id}>
                          <TableCell className="font-medium">
                            {getProjectTitle(inspection.project_id)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                              {inspection.inspector}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(inspection.date).toLocaleDateString('fr-FR')}
                            </div>
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
                            <div className="max-w-xs truncate text-sm text-muted-foreground">
                              {inspection.comments || 'Aucun commentaire'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/inspections/${inspection.id}`}>
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Détail
                              </Link>
                            </Button>
                          </TableCell>
                           <TableCell>
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 title="Modifier"
                                 onClick={() => openEditDialog(inspection)}
                               >
                                 <Pencil className="h-4 w-4" />
                               </Button>
                               <Button 
                                 size="sm" 
                                 variant="ghost" 
                                 title="Voir les détails"
                                 onClick={() => window.location.href = `/projects/${inspection.project_id}?tab=inspections&inspection=${inspection.id}`}
                               >
                                 <Eye className="h-4 w-4" />
                               </Button>
                               {isProjectManager && inspection.status === 'failed' && (
                                 <Button 
                                   size="sm" 
                                   variant="destructive"
                                   title="Alerter la hiérarchie"
                                   onClick={() => sendAlertToHierarchy(inspection.id, `Inspection échouée pour le projet ${getProjectTitle(inspection.project_id)}`)}
                                 >
                                   <Send className="h-4 w-4" />
                                 </Button>
                               )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="gap-2">
                                      <Settings className="h-4 w-4" />
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <ActionsDropdown
                                    entityType="inspection"
                                    entityId={inspection.id}
                                    projectId={inspection.project_id}
                                    onActionComplete={refreshInspections} 
                                    />
                                  </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                     </TableBody>
                   </Table>
                   
                   {/* Pagination */}
                   {inspections.length > 10 && (
                     <PaginationControls
                       currentPage={currentPage}
                       totalPages={totalPages}
                       totalItems={totalItems}
                       itemsPerPage={itemsPerPage}
                       onPageChange={goToPage}
                       showItemsPerPage={false}
                     />
                   )}
                 </div>
              )}
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
                    <InspectionExecutionForm
                      key={inspection.id}
                      inspection={inspection}
                      projectTitle={getProjectTitle(inspection.project_id)}
                      onUpdate={updateInspectionStatus}
                    />
                  ))}
                  {inspections.filter(i => i.status === 'scheduled' || i.status === 'in_progress').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Aucune inspection à réaliser</h3>
                      <p className="text-muted-foreground">
                        Toutes les inspections programmées ont été traitées
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Alerts Tab - All roles */}
        <TabsContent value="alerts" className="mt-6">
          <div className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Centre de gestion des alertes et notifications pour le suivi des inspections critiques
              </AlertDescription>
            </Alert>

            {/* Alert Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inspections en retard</p>
                      <p className="text-2xl font-bold text-red-600">
                        {inspections.filter(i => 
                          new Date(i.date) < new Date() && 
                          !['completed', 'approved'].includes(i.status)
                        ).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Inspections échouées</p>
                      <p className="text-2xl font-bold text-red-600">
                        {inspections.filter(i => i.status === 'failed').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Corrections requises</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {inspections.filter(i => i.status === 'requires_changes').length}
                      </p>
                    </div>
                    <Send className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {inspections.filter(i => i.status === 'pending').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical Alerts Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Alertes Critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overdue Inspections */}
                  {inspections.filter(i => 
                    new Date(i.date) < new Date() && 
                    !['completed', 'approved'].includes(i.status)
                  ).length > 0 ? (
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-red-700 mb-2">🚨 Inspections en retard</h4>
                      <div className="space-y-2">
                        {inspections
                          .filter(i => 
                            new Date(i.date) < new Date() && 
                            !['completed', 'approved'].includes(i.status)
                          )
                          .map(inspection => (
                            <div key={inspection.id} className="flex items-center justify-between bg-red-50 p-3 rounded">
                              <div>
                                <p className="font-medium">{getProjectTitle(inspection.project_id)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Inspecteur: {inspection.inspector} • 
                                  Date prévue: {new Date(inspection.date).toLocaleDateString('fr-FR')} • 
                                  Retard: {Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(inspection.status)}
                                {isProjectManager && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => sendAlertToHierarchy(
                                      inspection.id, 
                                      `🚨 URGENT: Inspection en retard de ${Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24))} jour(s) pour le projet "${getProjectTitle(inspection.project_id)}" (Inspecteur: ${inspection.inspector})`
                                    )}
                                  >
                                    <Send className="h-4 w-4" />
                                    Alerter
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-600">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p>Aucune inspection en retard ✅</p>
                    </div>
                  )}

                  {/* Failed Inspections */}
                  {inspections.filter(i => i.status === 'failed').length > 0 && (
                    <div className="border-l-4 border-red-500 pl-4">
                      <h4 className="font-semibold text-red-700 mb-2">❌ Inspections échouées</h4>
                      <div className="space-y-2">
                        {inspections
                          .filter(i => i.status === 'failed')
                          .map(inspection => (
                            <div key={inspection.id} className="flex items-center justify-between bg-red-50 p-3 rounded">
                              <div>
                                <p className="font-medium">{getProjectTitle(inspection.project_id)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Inspecteur: {inspection.inspector} • 
                                  Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
                                  {inspection.comments && ` • ${inspection.comments}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(inspection.status)}
                                {isProjectManager && (
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => sendAlertToHierarchy(
                                      inspection.id, 
                                      `❌ CRITIQUE: Inspection échouée pour le projet "${getProjectTitle(inspection.project_id)}" (Inspecteur: ${inspection.inspector}). ${inspection.comments ? `Commentaires: ${inspection.comments}` : ''}`
                                    )}
                                  >
                                    <Send className="h-4 w-4" />
                                    Escalader
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Inspections Requiring Changes */}
                  {inspections.filter(i => i.status === 'requires_changes').length > 0 && (
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-700 mb-2">⚠️ Corrections requises</h4>
                      <div className="space-y-2">
                        {inspections
                          .filter(i => i.status === 'requires_changes')
                          .map(inspection => (
                            <div key={inspection.id} className="flex items-center justify-between bg-orange-50 p-3 rounded">
                              <div>
                                <p className="font-medium">{getProjectTitle(inspection.project_id)}</p>
                                <p className="text-sm text-muted-foreground">
                                  Inspecteur: {inspection.inspector} • 
                                  Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
                                  {inspection.comments && ` • ${inspection.comments}`}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {getStatusBadge(inspection.status)}
                                {isProjectManager && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => sendAlertToHierarchy(
                                      inspection.id, 
                                      `⚠️ ATTENTION: Corrections requises pour le projet "${getProjectTitle(inspection.project_id)}" suite à l'inspection de ${inspection.inspector}. ${inspection.comments ? `Détails: ${inspection.comments}` : ''}`
                                    )}
                                  >
                                    <Bell className="h-4 w-4" />
                                    Notifier
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification Actions */}
            {isProjectManager && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Actions de Notification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="justify-start gap-2"
                      onClick={() => {
                        const overdueCount = inspections.filter(i => 
                          new Date(i.date) < new Date() && 
                          !['completed', 'approved'].includes(i.status)
                        ).length;
                        if (overdueCount > 0) {
                          sendAlertToHierarchy(
                            'summary', 
                            `📊 RAPPORT QUOTIDIEN: ${overdueCount} inspection(s) en retard nécessitent une attention immédiate. Consultez le tableau de bord pour plus de détails.`
                          );
                        } else {
                          toast({
                            title: "Information",
                            description: "Aucune inspection en retard à signaler",
                          });
                        }
                      }}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Rapport quotidien
                    </Button>

                    <Button 
                      variant="outline" 
                      className="justify-start gap-2"
                      onClick={() => {
                        const criticalCount = inspections.filter(i => 
                          i.status === 'failed' || 
                          (new Date(i.date) < new Date() && !['completed', 'approved'].includes(i.status))
                        ).length;
                        if (criticalCount > 0) {
                          sendAlertToHierarchy(
                            'critical', 
                            `🚨 ALERTE CRITIQUE: ${criticalCount} inspection(s) nécessitent une intervention urgente (échecs ou retards). Action immédiate requise.`
                          );
                        } else {
                          toast({
                            title: "Information",
                            description: "Aucune situation critique détectée",
                          });
                        }
                      }}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Alerte critique
                    </Button>

                    <Button 
                      variant="outline" 
                      className="justify-start gap-2"
                      onClick={() => {
                        const upcomingCount = inspections.filter(i => {
                          const inspectionDate = new Date(i.date);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return inspectionDate.toDateString() === tomorrow.toDateString() && 
                                 i.status === 'scheduled';
                        }).length;
                        if (upcomingCount > 0) {
                          sendAlertToHierarchy(
                            'reminder', 
                            `📅 RAPPEL: ${upcomingCount} inspection(s) programmée(s) pour demain. Vérifiez la disponibilité des inspecteurs.`
                          );
                        } else {
                          toast({
                            title: "Information",
                            description: "Aucune inspection programmée pour demain",
                          });
                        }
                      }}
                    >
                      <Calendar className="h-4 w-4" />
                      Rappel quotidien
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Résumé des Performances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {inspections.filter(i => ['completed', 'approved'].includes(i.status)).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Terminées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {inspections.filter(i => i.status === 'in_progress').length}
                    </p>
                    <p className="text-sm text-muted-foreground">En cours</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {inspections.filter(i => i.status === 'scheduled').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Programmées</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((inspections.filter(i => ['completed', 'approved'].includes(i.status)).length / (inspections.length || 1)) * 100)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux de réussite</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Inspection Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Modifier l'inspection</span>
              {editingInspection && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/inspections/${editingInspection.id}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Consulter
                  </Link>
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-inspector">Inspecteur *</Label>
              <Input
                id="edit-inspector"
                value={editFormData.inspector}
                onChange={(e) => setEditFormData(prev => ({ ...prev, inspector: e.target.value }))}
                placeholder="Nom de l'inspecteur"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-status">Statut</Label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Programmée
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        En cours
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Terminée
                      </div>
                    </SelectItem>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approuvée
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Échouée
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-progress">Progression (%)</Label>
              <Input
                id="edit-progress"
                type="number"
                min="0"
                max="100"
                value={editFormData.progress_at_inspection}
                onChange={(e) => setEditFormData(prev => ({ ...prev, progress_at_inspection: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-comments">Commentaires</Label>
              <Textarea
                id="edit-comments"
                value={editFormData.comments}
                onChange={(e) => setEditFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={3}
                placeholder="Observations, remarques..."
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editFormData.inspector || !editFormData.date}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleBasedInspectionMonitoring;