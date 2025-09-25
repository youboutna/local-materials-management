import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, AlertTriangle, Shield, Target, TrendingUp, User, Calendar, Building } from 'lucide-react';

interface EnhancedRiskManagerProps {
  projectId: string;
}

interface ProjectRisk {
  id: string;
  project_id: string;
  risk_title: string;
  risk_description: string | null;
  probability: string | null;
  impact: string | null;
  risk_level: string | null;
  mitigation_strategy: string | null;
  status: string | null;
  identified_by: string | null;
  identified_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Enhanced fields
  probability_numeric: number | null;
  impact_numeric: number | null;
  risk_score: number | null;
  mitigation_plan: string | null;
  status_new: string | null;
  owner_id: string | null;
  due_date: string | null;
  phase_id?: string | null;
}

interface RiskTaskRelation {
  id: string;
  risk_id: string;
  task_id: string;
}

interface TaskAssignment {
  id: string;
  title: string | null;
  phase_id?: string | null;
}

interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
  construction_phase?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  type?: string;
}

interface Employee {
  id: string;
  full_name: string;
  position?: string;
}

interface RiskFormData {
  risk_title: string;
  risk_description: string;
  probability_numeric: string;
  impact_numeric: string;
  mitigation_plan: string;
  status_new: string;
  owner_id: string;
  due_date: string;
  related_tasks: string[];
  phase_id: string;
  construction_phase: string;
}

const EnhancedRiskManager: React.FC<EnhancedRiskManagerProps> = ({ projectId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('all');
  const [formData, setFormData] = useState<RiskFormData>({
    risk_title: '',
    risk_description: '',
    probability_numeric: '',
    impact_numeric: '',
    mitigation_plan: '',
    status_new: 'identified',
    owner_id: '',
    due_date: '',
    related_tasks: [],
    phase_id: '',
    construction_phase: '',
  });
  
  const queryClient = useQueryClient();

  // Fetch project risks
  const { data: risks, isLoading } = useQuery({
    queryKey: ['enhanced-project-risks', projectId],
    queryFn: async (): Promise<ProjectRisk[]> => {
      const { data, error } = await supabase
        .from('project_risks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch task assignments for this project (filtered by phase when selected)
  const { data: tasks = [] } = useQuery({
    queryKey: ['project-task-assignments', projectId, formData.phase_id],
    queryFn: async (): Promise<TaskAssignment[]> => {
      let query = supabase
        .from('task_assignments')
        .select('id, title, phase_id')
        .eq('project_id', projectId);
      
      // Filter by phase if selected
      if (formData.phase_id) {
        query = query.eq('phase_id', formData.phase_id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Fetch project phases (required for risk creation)
  const { data: phases = [] } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });
      
      if (error) throw error;
      return data?.map(phase => ({
        ...phase,
        construction_phase: phase.construction_phase || undefined
      })) || [];
    },
    enabled: !!projectId,
  });

  // Fetch employees for risk ownership
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-active'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position')
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(emp => ({
        ...emp,
        position: emp.position || undefined
      })) || [];
    },
  });

  // Fetch suppliers for contractor/consulting assignment  
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, contact_person')
        .eq('is_active', true);
      
      if (error) throw error;
      return data?.map(supplier => ({
        ...supplier,
        contact_person: supplier.contact_person || undefined
      })) || [];
    },
  });

  // Fetch risk-task relations
  const { data: riskTaskRelations = [] } = useQuery({
    queryKey: ['risk-task-relations', projectId],
    queryFn: async (): Promise<RiskTaskRelation[]> => {
      const { data, error } = await supabase
        .from('risk_task_relations')
        .select('*')
        .in('risk_id', (risks || []).map(r => r.id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!risks && risks.length > 0,
  });

  // Create risk mutation
  const createRiskMutation = useMutation({
    mutationFn: async (data: Partial<ProjectRisk>) => {
      const { error } = await supabase
        .from('project_risks')
        .insert([{
          ...data,
          project_id: data.project_id || '',
          risk_title: data.risk_title || 'Untitled Risk'
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Risque créé",
        description: "Le risque a été créé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating risk:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le risque.",
        variant: "destructive",
      });
    },
  });

  // Update risk mutation
  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProjectRisk> & { id: string }) => {
      const { error } = await supabase
        .from('project_risks')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks'] });
      setEditingId(null);
      resetForm();
      toast({
        title: "Risque mis à jour",
        description: "Le risque a été mis à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error updating risk:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le risque.",
        variant: "destructive",
      });
    },
  });

  // Delete risk mutation
  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_risks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks'] });
      toast({
        title: "Risque supprimé",
        description: "Le risque a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error deleting risk:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le risque.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      risk_title: '',
      risk_description: '',
      probability_numeric: '',
      impact_numeric: '',
      mitigation_plan: '',
      status_new: 'identified',
      owner_id: '',
      due_date: '',
      related_tasks: [],
      phase_id: '',
      construction_phase: '',
    });
  };

  // Get context-aware assignment options based on phase
  const getOwnershipOptions = () => {
    const selectedPhaseData = phases.find(p => p.id === formData.phase_id);
    const isConstructionPhase = selectedPhaseData?.construction_phase && 
      ['foundation', 'structure', 'finishing', 'utilities'].includes(selectedPhaseData.construction_phase);
    
    const options = [
      { category: 'Employés internes', items: employees.map(emp => ({ 
        id: emp.id, 
        name: emp.full_name, 
        subtitle: emp.position,
        type: 'employee'
      })) },
      { category: 'Bureaux d\'études / Consultants', items: suppliers
        .filter(s => s.type === 'consultant' || !s.type)
        .map(supplier => ({ 
          id: supplier.id, 
          name: supplier.name, 
          subtitle: supplier.contact_person || 'Consultant',
          type: 'consultant'
        })) 
      },
      { category: 'Contractants principaux', items: suppliers
        .filter(s => s.type === 'contractor' || !s.type)
        .map(supplier => ({ 
          id: supplier.id, 
          name: supplier.name, 
          subtitle: supplier.contact_person || 'Contractant',
          type: 'contractor'
        })) 
      }
    ];

    return { options, isConstructionPhase };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.risk_title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du risque est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phase_id) {
      toast({
        title: "Erreur",
        description: "Vous devez sélectionner une phase du projet.",
        variant: "destructive",
      });
      return;
    }

    const probability = parseFloat(formData.probability_numeric);
    const impact = parseFloat(formData.impact_numeric);
    const riskScore = probability * impact;

    const riskData: Partial<ProjectRisk> = {
      project_id: projectId,
      risk_title: formData.risk_title,
      risk_description: formData.risk_description || null,
      probability_numeric: probability || null,
      impact_numeric: impact || null,
      risk_score: riskScore || null,
      mitigation_plan: formData.mitigation_plan || null,
      status_new: formData.status_new,
      owner_id: formData.owner_id || null,
      due_date: formData.due_date || null,
      phase_id: formData.phase_id,
    };

    if (editingId) {
      updateRiskMutation.mutate({ id: editingId, ...riskData });
    } else {
      createRiskMutation.mutate(riskData);
    }
  };

  const handleEdit = (risk: ProjectRisk) => {
    setFormData({
      risk_title: risk.risk_title || '',
      risk_description: risk.risk_description || '',
      probability_numeric: risk.probability_numeric?.toString() || '',
      impact_numeric: risk.impact_numeric?.toString() || '',
      mitigation_plan: risk.mitigation_plan || '',
      status_new: risk.status_new || 'identified',
      owner_id: risk.owner_id || '',
      due_date: risk.due_date || '',
      related_tasks: riskTaskRelations
        .filter(rel => rel.risk_id === risk.id)
        .map(rel => rel.task_id),
      phase_id: risk.phase_id || '',
      construction_phase: '',
    });
    setEditingId(risk.id);
    setIsCreating(true);
  };

  const getRiskLevel = (probability: number, impact: number) => {
    const score = probability * impact;
    if (score >= 15) return 'Très élevé';
    if (score >= 10) return 'Élevé';
    if (score >= 5) return 'Moyen';
    return 'Faible';
  };

  const getRiskColor = (probability: number, impact: number) => {
    const score = probability * impact;
    if (score >= 15) return 'bg-red-100 text-red-800';
    if (score >= 10) return 'bg-orange-100 text-orange-800';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mitigated': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-blue-100 text-blue-800';
      case 'identified': return 'bg-yellow-100 text-yellow-800';
      case 'occurred': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOwnerName = (ownerId: string) => {
    const employee = employees.find(emp => emp.id === ownerId);
    if (employee) return employee.full_name;
    
    const supplier = suppliers.find(sup => sup.id === ownerId);
    if (supplier) return supplier.name;
    
    return 'Non assigné';
  };

  const getPhaseName = (phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    return phase?.phase_name || 'Phase inconnue';
  };

  const filteredRisks = risks?.filter(risk => {
    if (selectedRiskLevel === 'all') return true;
    
    const probability = risk.probability_numeric || 0;
    const impact = risk.impact_numeric || 0;
    const level = getRiskLevel(probability, impact);
    
    return level === selectedRiskLevel;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Gestion des risques</h3>
          <p className="text-sm text-muted-foreground">
            Les risques sont systématiquement liés aux phases et tâches du projet
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              resetForm();
              setEditingId(null);
            }} disabled={phases.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau risque
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifier le risque' : 'Créer un nouveau risque'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="risk_title">Titre du risque *</Label>
                  <Input
                    id="risk_title"
                    value={formData.risk_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, risk_title: e.target.value }))}
                    placeholder="Nom du risque"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="risk_description">Description</Label>
                  <Textarea
                    id="risk_description"
                    value={formData.risk_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, risk_description: e.target.value }))}
                    placeholder="Description détaillée du risque"
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phase_id">Phase du projet *</Label>
                  <Select 
                    value={formData.phase_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value, owner_id: '', related_tasks: [] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une phase existante" />
                    </SelectTrigger>
                    <SelectContent>
                      {phases.length === 0 && (
                        <SelectItem value="no_phases" disabled>
                          Aucune phase créée - Créez d'abord des phases
                        </SelectItem>
                      )}
                      {phases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.phase_name} {phase.construction_phase && `(${phase.construction_phase})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {phases.length === 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Vous devez créer des phases dans l'onglet "Phases" avant de pouvoir créer des risques
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="owner_id">Responsable du risque (délégation publique)</Label>
                  <Select 
                    value={formData.owner_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, owner_id: value }))}
                    disabled={!formData.phase_id || phases.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner selon le contexte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {(() => {
                        const { options } = getOwnershipOptions();
                        return options.map((category) => (
                          <React.Fragment key={category.category}>
                            <div className="px-2 py-1 text-xs font-medium text-muted-foreground border-b">
                              {category.category}
                            </div>
                            {category.items.map((item) => (
                              <SelectItem key={`${item.type}-${item.id}`} value={item.id}>
                                {item.name} {item.subtitle && `- ${item.subtitle}`}
                              </SelectItem>
                            ))}
                          </React.Fragment>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const { isConstructionPhase } = getOwnershipOptions();
                      return isConstructionPhase 
                        ? "Phase construction → Privilégier contractants principaux"
                        : "Phase pré-construction → Privilégier employés/consultants";
                    })()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="probability_numeric">Probabilité (1-5)</Label>
                  <Select value={formData.probability_numeric} onValueChange={(value) => setFormData(prev => ({ ...prev, probability_numeric: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Très faible</SelectItem>
                      <SelectItem value="2">2 - Faible</SelectItem>
                      <SelectItem value="3">3 - Moyen</SelectItem>
                      <SelectItem value="4">4 - Élevé</SelectItem>
                      <SelectItem value="5">5 - Très élevé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="impact_numeric">Impact (1-5)</Label>
                  <Select value={formData.impact_numeric} onValueChange={(value) => setFormData(prev => ({ ...prev, impact_numeric: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Très faible</SelectItem>
                      <SelectItem value="2">2 - Faible</SelectItem>
                      <SelectItem value="3">3 - Moyen</SelectItem>
                      <SelectItem value="4">4 - Élevé</SelectItem>
                      <SelectItem value="5">5 - Très élevé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status_new">Statut</Label>
                  <Select value={formData.status_new} onValueChange={(value) => setFormData(prev => ({ ...prev, status_new: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identified">Identifié</SelectItem>
                      <SelectItem value="monitoring">Surveillé</SelectItem>
                      <SelectItem value="mitigated">Atténué</SelectItem>
                      <SelectItem value="occurred">Survenu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="mitigation_plan">Plan d'atténuation</Label>
                <Textarea
                  id="mitigation_plan"
                  value={formData.mitigation_plan}
                  onChange={(e) => setFormData(prev => ({ ...prev, mitigation_plan: e.target.value }))}
                  placeholder="Stratégie pour atténuer ce risque"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="related_tasks">Tâches associées (phase sélectionnée)</Label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                  {!formData.phase_id ? (
                    <p className="text-sm text-muted-foreground">Sélectionnez d'abord une phase</p>
                  ) : tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucune tâche dans cette phase - Créez des tâches d'abord
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`task-${task.id}`}
                          checked={formData.related_tasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                related_tasks: [...prev.related_tasks, task.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                related_tasks: prev.related_tasks.filter(id => id !== task.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`task-${task.id}`} className="text-sm">
                          {task.title || 'Tâche sans titre'}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Les risques sont systématiquement liés aux tâches de la phase sélectionnée
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRiskMutation.isPending || updateRiskMutation.isPending || !formData.phase_id}
                >
                  {editingId ? 'Mettre à jour' : 'Créer le risque'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Phase validation warning */}
      {phases.length === 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <p className="font-medium">Aucune phase créée</p>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Vous devez créer des phases dans l'onglet "Phases" avant de pouvoir gérer les risques.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {phases.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div>
            <Label>Filtrer par niveau de risque</Label>
            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="Faible">Faible</SelectItem>
                <SelectItem value="Moyen">Moyen</SelectItem>
                <SelectItem value="Élevé">Élevé</SelectItem>
                <SelectItem value="Très élevé">Très élevé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Risks list */}
      <div className="grid gap-4">
        {filteredRisks.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Aucun risque</h3>
              <p className="text-muted-foreground mb-4">
                {phases.length === 0 
                  ? "Créez d'abord des phases dans l'onglet 'Phases'"
                  : "Commencez par identifier vos premiers risques"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRisks.map((risk) => (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{risk.risk_title}</h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      {risk.risk_description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {risk.phase_id && (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {getPhaseName(risk.phase_id)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {getOwnerName(risk.owner_id || '')}
                      </span>
                      {risk.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(risk.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {risk.probability_numeric && risk.impact_numeric && (
                      <Badge className={getRiskColor(risk.probability_numeric, risk.impact_numeric)}>
                        {getRiskLevel(risk.probability_numeric, risk.impact_numeric)}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(risk.status_new || 'identified')}>
                      {risk.status_new === 'identified' ? 'Identifié' :
                       risk.status_new === 'monitoring' ? 'Surveillé' :
                       risk.status_new === 'mitigated' ? 'Atténué' : 'Survenu'}
                    </Badge>
                  </div>
                </div>

                {risk.probability_numeric && risk.impact_numeric && (
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Probabilité:</span>
                        <div className="font-medium">{risk.probability_numeric}/5</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Impact:</span>
                        <div className="font-medium">{risk.impact_numeric}/5</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Score:</span>
                        <div className="font-medium">{risk.risk_score || (risk.probability_numeric * risk.impact_numeric)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {risk.mitigation_plan && (
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <h5 className="font-medium text-sm mb-1">Plan d'atténuation:</h5>
                    <p className="text-sm text-muted-foreground">{risk.mitigation_plan}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(risk)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRiskMutation.mutate(risk.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default EnhancedRiskManager;