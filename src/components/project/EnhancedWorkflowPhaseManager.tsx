import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  CreditCard, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  Settings, 
  User, 
  Building, 
  Map,
  Edit,
  Save,
  X,
  Phone,
  Mail
} from 'lucide-react';
import DocumentsList from '@/components/documents/DocumentsList';
import TaskList from '@/components/project/TaskList';
import PhaseEmployees from '@/components/project/PhaseEmployees';
import PhasePayments from '@/components/project/PhasePayments';
import PhaseInspections from '@/components/project/PhaseInspections';
import EmployeeSelector from '@/components/selectors/EmployeeSelector';

import { ProjectStakeholderService } from '@/application/services/ProjectStakeholderService';
import { useProjectHierarchy } from '@/hooks/useProjectHierarchy';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Phase {
  id: string;
  phase_name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
  progress?: number | null;
  budget_allocated?: number | null;
  actual_cost?: number | null;
  documents_count?: number;
  tasks_count?: number;
  inspections_count?: number;
  payments_count?: number;
  location?: any;
  stakeholders?: any[];
  team_delegation?: any;
}

interface Stakeholder {
  id?: string;
  stakeholder_type: string;
  stakeholder_entity_type: string;
  stakeholder_id: string;
  role_description?: string | null;
  is_primary?: boolean | null;
  employee?: any;
  supplier?: any;
}

interface TeamDelegation {
  projectManager?: string;
  technicalManager?: string;
  supervisor?: string;
  client?: string;
}

interface EnhancedWorkflowPhaseManagerProps {
  projectId: string;
}

const EnhancedWorkflowPhaseManager: React.FC<EnhancedWorkflowPhaseManagerProps> = ({ 
  projectId 
}) => {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [teamDelegation, setTeamDelegation] = useState<TeamDelegation>({});
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [isDelegationDialogOpen, setIsDelegationDialogOpen] = useState(false);
  const [phaseLocation, setPhaseLocation] = useState<any>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  
  const { hierarchy, loading: hierarchyLoading } = useProjectHierarchy(projectId);

  // Load phases data
  const { data: phases, isLoading, refetch } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<Phase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select(`
          *,
          documents_count:documents(count),
          tasks_count:tasks(count),
          inspections_count:inspections(count),
          payments_count:payments(count)
        `)
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      return (data || []).filter(phase => phase.id).map(phase => ({
        ...phase,
        id: phase.id!,
        name: phase.phase_name || '',
        status: phase.status || 'planned',
        documents_count: Array.isArray(phase.documents_count) ? phase.documents_count?.[0]?.count || 0 : 0,
        tasks_count: Array.isArray(phase.tasks_count) ? phase.tasks_count?.[0]?.count || 0 : 0,
        inspections_count: Array.isArray(phase.inspections_count) ? phase.inspections_count?.[0]?.count || 0 : 0,
        payments_count: Array.isArray(phase.payments_count) ? phase.payments_count?.[0]?.count || 0 : 0,
        location: (phase as any).location || null,
        stakeholders: [],
        team_delegation: (phase as any).team_delegation || {},
      })) as Phase[];
    },
    enabled: !!projectId && projectId !== 'new-project',
  });

  // Load stakeholders for the project
  const stakeholderService = React.useMemo(() => new ProjectStakeholderService(), []);
  const { data: projectStakeholders } = useQuery({
    queryKey: ['project-stakeholders', projectId],
    queryFn: async () => {
      return await stakeholderService.getProjectStakeholders(projectId);
    },
    enabled: !!projectId && projectId !== 'new-project',
  });

  // Load employees for selectors
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Load stakeholders when selected phase changes
  useEffect(() => {
    if (selectedPhase && projectStakeholders) {
      setStakeholders(projectStakeholders as any[]);
    }
  }, [selectedPhase, projectStakeholders]);

  // Load team delegation and location when phase changes
  useEffect(() => {
    if (selectedPhase) {
      setTeamDelegation(selectedPhase.team_delegation || {});
      setPhaseLocation(selectedPhase.location || null);
    }
  }, [selectedPhase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'planned': return <Calendar className="h-4 w-4 text-gray-600" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSaveTeamDelegation = async () => {
    if (!selectedPhase) return;

    try {
      const { error } = await supabase
        .from('project_phases')
        .update({ custom_phase_data: { team_delegation: teamDelegation } } as any)
        .eq('id', selectedPhase.id);

      if (error) throw error;

      // Update stakeholders using service instance
      for (const s of stakeholders.filter(s => s.stakeholder_entity_type === 'supplier')) {
        if (s.id) {
          await stakeholderService.updateProjectStakeholder(s.id, {
            stakeholderType: s.stakeholder_type,
            stakeholderEntityType: s.stakeholder_entity_type as 'employee' | 'supplier',
            roleDescription: s.role_description ?? undefined
          });
        }
      }

      toast({
        title: "Délégation sauvegardée",
        description: "L'équipe a été assignée avec succès.",
      });

      setIsDelegationDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving team delegation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la délégation.",
        variant: "destructive",
      });
    }
  };

  const handleSaveLocation = async () => {
    if (!selectedPhase) return;

    try {
      const { error } = await supabase
        .from('project_phases')
        .update({ custom_phase_data: { location: phaseLocation } } as any)
        .eq('id', selectedPhase.id);

      if (error) throw error;

      toast({
        title: "Localisation sauvegardée",
        description: "La localisation de la phase a été mise à jour.",
      });

      setIsLocationDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la localisation.",
        variant: "destructive",
      });
    }
  };

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees?.find(emp => emp.id === employeeId);
    return employee?.full_name || 'Non assigné';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phases Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Phases du projet ({phases?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[70vh]">
              <div className="space-y-3">
                {phases?.map((phase) => (
                  <Card 
                    key={phase.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPhase?.id === phase.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    <div 
                      className="p-4"
                      onClick={() => setSelectedPhase(phase)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(phase.status)}
                          <h4 className="font-medium text-sm">{phase.phase_name}</h4>
                        </div>
                        <Badge className={getStatusColor(phase.status)} variant="outline">
                          {phase.status}
                        </Badge>
                      </div>
                      
                      {phase.progress !== undefined && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progression</span>
                            <span>{phase.progress}%</span>
                          </div>
                          <Progress value={phase.progress} className="h-2" />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span>{phase.documents_count} docs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClipboardCheck className="h-3 w-3" />
                          <span>{phase.tasks_count} tâches</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{phase.inspections_count} insp.</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{phase.payments_count} paiem.</span>
                        </div>
                      </div>
                      
                      {phase.start_date && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Début: {new Date(phase.start_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {phase.description && (
                        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {phase.description}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Phase Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedPhase ? selectedPhase.phase_name : 'Sélectionner une phase'}
              </span>
              {selectedPhase && (
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedPhase.status)}>
                    {selectedPhase.status}
                  </Badge>
                  
                  <Dialog open={isDelegationDialogOpen} onOpenChange={setIsDelegationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <User className="h-4 w-4 mr-1" />
                        Équipe
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MapPin className="h-4 w-4 mr-1" />
                        Localisation
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedPhase ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une phase pour voir les détails</p>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <ScrollArea>
                  <TabsList className="grid w-full grid-cols-6 h-auto mb-6">
                    <TabsTrigger value="overview" className="flex flex-col items-center gap-1 p-3">
                      <Settings className="h-4 w-4" />
                      <span className="text-xs">Vue d'ensemble</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex flex-col items-center gap-1 p-3">
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Documents</span>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="flex flex-col items-center gap-1 p-3">
                      <ClipboardCheck className="h-4 w-4" />
                      <span className="text-xs">Tâches</span>
                    </TabsTrigger>
                    <TabsTrigger value="team" className="flex flex-col items-center gap-1 p-3">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Équipe</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex flex-col items-center gap-1 p-3">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs">Paiements</span>
                    </TabsTrigger>
                    <TabsTrigger value="inspections" className="flex flex-col items-center gap-1 p-3">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Inspections</span>
                    </TabsTrigger>
                  </TabsList>
                </ScrollArea>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedPhase.documents_count}</p>
                            <p className="text-sm text-muted-foreground">Documents</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedPhase.tasks_count}</p>
                            <p className="text-sm text-muted-foreground">Tâches</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-purple-500" />
                          <div>
                            <p className="text-2xl font-bold">{stakeholders.length}</p>
                            <p className="text-sm text-muted-foreground">Parties prenantes</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="text-2xl font-bold">{selectedPhase.payments_count}</p>
                            <p className="text-sm text-muted-foreground">Paiements</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Délégation d'équipe
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(teamDelegation).map(([role, employeeId]) => {
                          const employee = employees?.find(emp => emp.id === employeeId);
                          return (
                            <div key={role} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <span className="font-medium capitalize">
                                  {role.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                {employee && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {(employee.full_name || '').split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">
                                      {employee.full_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {!employee && (
                                <span className="text-sm text-muted-foreground">Non assigné</span>
                              )}
                            </div>
                          );
                        })}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setIsDelegationDialogOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier l'équipe
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Localisation de la phase
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {phaseLocation ? (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Coordonnées: {phaseLocation.center?.lat.toFixed(4)}, {phaseLocation.center?.lng.toFixed(4)}
                            </p>
                            {phaseLocation.address && (
                              <p className="text-sm">{phaseLocation.address}</p>
                            )}
                            <div className="mt-3 h-32 bg-muted rounded-lg flex items-center justify-center">
                              <Map className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Aucune localisation définie</p>
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => setIsLocationDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Définir la localisation
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Parties prenantes */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Parties prenantes du projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stakeholders.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {stakeholders.map((stakeholder, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {stakeholder.stakeholder_entity_type === 'employee' ? 'E' : 'S'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {stakeholder.employee?.full_name || stakeholder.supplier?.name || 'N/A'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {stakeholder.role_description || stakeholder.stakeholder_type}
                                    </p>
                                  </div>
                                </div>
                                {stakeholder.is_primary && (
                                  <Badge variant="secondary">Principal</Badge>
                                )}
                              </div>
                              {stakeholder.employee?.email && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {stakeholder.employee.email}
                                </div>
                              )}
                              {stakeholder.employee?.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {stakeholder.employee.phone}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2" />
                          <p>Aucune partie prenante définie</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <DocumentsList />
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4">
                  <TaskList tasks={[]} projectId={projectId} />
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                  <PhaseEmployees
                    phaseId={selectedPhase.id}
                  />
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <PhasePayments
                    projectId={projectId}
                    phaseId={selectedPhase.id}
                  />
                </TabsContent>

                <TabsContent value="inspections" className="space-y-4">
                  <PhaseInspections
                    projectId={projectId}
                    phaseId={selectedPhase.id}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Team Delegation Dialog */}
      <Dialog open={isDelegationDialogOpen} onOpenChange={setIsDelegationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Délégation d'équipe - {selectedPhase?.phase_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Chef de projet</Label>
                <EmployeeSelector
                  value={teamDelegation.projectManager}
                  onChange={(value) => setTeamDelegation(prev => ({ ...prev, projectManager: value }))}
                  placeholder="Sélectionner un chef de projet"
                  positionFilter={['manager', 'chef', 'directeur']}
                />
              </div>
              
              <div>
                <Label>Manager technique</Label>
                <EmployeeSelector
                  value={teamDelegation.technicalManager}
                  onChange={(value) => setTeamDelegation(prev => ({ ...prev, technicalManager: value }))}
                  placeholder="Sélectionner un manager technique"
                  departmentFilter={['Engineering', 'Technical']}
                />
              </div>
              
              <div>
                <Label>Superviseur</Label>
                <EmployeeSelector
                  value={teamDelegation.supervisor}
                  onChange={(value) => setTeamDelegation(prev => ({ ...prev, supervisor: value }))}
                  placeholder="Sélectionner un superviseur"
                  positionFilter={['supervisor', 'chef d\'équipe']}
                />
              </div>
              
              <div>
                <Label>Client</Label>
                <EmployeeSelector
                  value={teamDelegation.client}
                  onChange={(value) => setTeamDelegation(prev => ({ ...prev, client: value }))}
                  placeholder="Sélectionner un représentant client"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDelegationDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSaveTeamDelegation}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Localisation - {selectedPhase?.phase_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Map className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Carte interactive - En développement</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSaveLocation}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedWorkflowPhaseManager;