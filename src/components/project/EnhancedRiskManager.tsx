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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, AlertTriangle, Shield, Target, TrendingUp, User, Calendar, Building, AlertCircle } from 'lucide-react';

interface EnhancedRiskManagerProps {
  projectId: string;
  risks?: any[];
  setRisks?: (risks: any[]) => void;
  phases?: any[];
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
  applyToAllPhases: boolean;
  selectedPhases?: string[];
}

const EnhancedRiskManager: React.FC<EnhancedRiskManagerProps> = ({ 
  projectId, 
  risks: propRisks, 
  setRisks: propSetRisks,
  phases: propPhases 
}) => {
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
    applyToAllPhases: false,
    selectedPhases: [],
  });
  
  const queryClient = useQueryClient();

  // Use provided risks or fetch from database
  const { data: fetchedRisks, isLoading } = useQuery({
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
    enabled: !!projectId && !propRisks,
  });

  // Use props or fallback to fetched data
  const currentRisks = propRisks || fetchedRisks || [];

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
      console.log('🔍 Fetching phases for project (RiskManager):', projectId);
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching phases (RiskManager):', error);
        throw error;
      }
      
      console.log('✅ Phases fetched (RiskManager):', data);
      return data?.map(phase => ({
        ...phase,
        construction_phase: phase.construction_phase || undefined
      })) || [];
    },
    enabled: !!projectId && !propPhases,
  });

  // Use props or fallback to fetched data
  const currentPhases = propPhases || phases || [];
  console.log('📋 Current phases in RiskManager:', currentPhases);

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
        .in('risk_id', (currentRisks || []).map(r => r.id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentRisks && currentRisks.length > 0,
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
      applyToAllPhases: false,
      selectedPhases: [],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.risk_title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre du risque est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.applyToAllPhases && !formData.phase_id) {
      toast({
        title: "Erreur",
        description: "Vous devez sélectionner une phase ou appliquer à toutes les phases.",
        variant: "destructive",
      });
      return;
    }

    try {
      const risksToCreate: any[] = [];
      const probability = parseFloat(formData.probability_numeric) || 0;
      const impact = parseFloat(formData.impact_numeric) || 0;
      const riskScore = probability * impact;

      if (formData.applyToAllPhases) {
        // Create risk for each phase
        currentPhases.forEach(phase => {
          risksToCreate.push({
            project_id: projectId,
            risk_title: `${formData.risk_title} - ${phase.phase_name}`,
            risk_description: formData.risk_description || null,
            probability_numeric: probability,
            impact_numeric: impact,
            risk_score: riskScore,
            mitigation_plan: formData.mitigation_plan || null,
            status_new: formData.status_new,
            owner_id: formData.owner_id || null,
            due_date: formData.due_date || null,
          });
        });
      } else {
        // Create single risk for selected phase
        risksToCreate.push({
          project_id: projectId,
          risk_title: formData.risk_title,
          risk_description: formData.risk_description || null,
          probability_numeric: probability,
          impact_numeric: impact,
          risk_score: riskScore,
          mitigation_plan: formData.mitigation_plan || null,
          status_new: formData.status_new,
          owner_id: formData.owner_id || null,
          due_date: formData.due_date || null,
        });
      }

      if (risksToCreate.length > 0) {
        const { data, error } = await supabase
          .from('project_risks')
          .insert(risksToCreate)
          .select();

        if (error) throw error;

        // Refresh risks
        queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks'] });
        setIsCreating(false);
        resetForm();

        toast({
          title: "Risque créé",
          description: `${risksToCreate.length} risque(s) créé(s) avec succès.`,
        });
      }
    } catch (error) {
      console.error('Error creating risk:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le risque.",
        variant: "destructive",
      });
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
      applyToAllPhases: false,
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

  const filteredRisks = currentRisks?.filter(risk => {
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

  if (currentPhases.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucune phase trouvée</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vous devez d'abord créer des phases pour ce projet avant de pouvoir ajouter des risques.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Gestion des risques</h3>
          <p className="text-sm text-muted-foreground">
            {filteredRisks.length} risque(s) • {currentPhases.length} phase(s)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tous niveaux" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="Faible">Faible</SelectItem>
              <SelectItem value="Moyen">Moyen</SelectItem>
              <SelectItem value="Élevé">Élevé</SelectItem>
              <SelectItem value="Très élevé">Très élevé</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau risque
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Modifier le risque' : 'Créer un nouveau risque'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk_title">Titre du risque</Label>
                    <Input
                      id="risk_title"
                      value={formData.risk_title}
                      onChange={(e) => setFormData({ ...formData, risk_title: e.target.value })}
                      placeholder="Nom du risque"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status_new">Statut</Label>
                    <Select value={formData.status_new} onValueChange={(value) => setFormData({ ...formData, status_new: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="identified">Identifié</SelectItem>
                        <SelectItem value="monitoring">Surveillance</SelectItem>
                        <SelectItem value="mitigated">Atténué</SelectItem>
                        <SelectItem value="occurred">Survenu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="risk_description">Description</Label>
                  <Textarea
                    id="risk_description"
                    value={formData.risk_description}
                    onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                    placeholder="Description détaillée du risque"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="applyToAllPhases"
                      checked={formData.applyToAllPhases}
                      onCheckedChange={(checked) => setFormData({ ...formData, applyToAllPhases: checked as boolean })}
                    />
                    <Label htmlFor="applyToAllPhases">Appliquer à toutes les phases</Label>
                  </div>

                  {!formData.applyToAllPhases && (
                    <div>
                      <Label htmlFor="phaseSelect">Sélectionner une ou plusieurs phases</Label>
                      <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-background">
                        {currentPhases.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune phase disponible</p>
                        ) : (
                          <div className="space-y-2">
                            {currentPhases.map((phase) => (
                              <div key={phase.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`phase-${phase.id}`}
                                  checked={formData.selectedPhases?.includes(phase.id) || false}
                                  onChange={(e) => {
                                    const selectedPhases = formData.selectedPhases || [];
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        selectedPhases: [...selectedPhases, phase.id],
                                        phase_id: phase.id // Keep single selection for backward compatibility
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        selectedPhases: selectedPhases.filter(id => id !== phase.id),
                                        phase_id: selectedPhases.filter(id => id !== phase.id)[0] || ''
                                      });
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <label htmlFor={`phase-${phase.id}`} className="text-sm font-medium cursor-pointer flex-1">
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {phase.phase_name || `Phase ${phase.id}`}
                                  </span>
                                  {phase.construction_phase && (
                                    <span className="text-xs text-muted-foreground ml-2 block">
                                      ({phase.construction_phase})
                                    </span>
                                  )}
                                  {phase.status && (
                                    <span className="text-xs text-green-600 ml-2">
                                      [{phase.status}]
                                    </span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {currentPhases.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Aucune phase trouvée. Créez d'abord des phases dans l'onglet Phases.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="probability_numeric">Probabilité (1-5)</Label>
                    <Input
                      id="probability_numeric"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.probability_numeric}
                      onChange={(e) => setFormData({ ...formData, probability_numeric: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="impact_numeric">Impact (1-5)</Label>
                    <Input
                      id="impact_numeric"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.impact_numeric}
                      onChange={(e) => setFormData({ ...formData, impact_numeric: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mitigation_plan">Plan d'atténuation</Label>
                  <Textarea
                    id="mitigation_plan"
                    value={formData.mitigation_plan}
                    onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                    placeholder="Stratégies pour atténuer ce risque"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="owner_id">Responsable</Label>
                    <Select value={formData.owner_id} onValueChange={(value) => setFormData({ ...formData, owner_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employees">Employees (Internal Staff)</SelectItem>
                        <SelectItem value="consulting_firms">Consulting Firms</SelectItem>
                        <SelectItem value="main_contractor">Main Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="due_date">Date d'échéance</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Risks grid */}
      <div className="grid gap-4">
        {filteredRisks.map((risk) => {
          const probability = risk.probability_numeric || 0;
          const impact = risk.impact_numeric || 0;
          const riskLevel = getRiskLevel(probability, impact);
          const riskColor = getRiskColor(probability, impact);
          
          return (
            <Card key={risk.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{risk.risk_title}</h4>
                      <Badge className={riskColor}>
                        {riskLevel}
                      </Badge>
                      <Badge className={getStatusColor(risk.status_new || 'identified')}>
                        {risk.status_new || 'Identified'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{risk.risk_description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {getPhaseName(risk.phase_id || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {getOwnerName(risk.owner_id || '')}
                      </span>
                      {risk.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(risk.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Probabilité:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={probability * 20} className="h-2 flex-1" />
                          <span className="text-xs">{probability}/5</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Impact:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={impact * 20} className="h-2 flex-1" />
                          <span className="text-xs">{impact}/5</span>
                        </div>
                      </div>
                    </div>
                    
                    {risk.mitigation_plan && (
                      <div className="mt-3">
                        <span className="text-xs text-muted-foreground">Plan d'atténuation:</span>
                        <p className="text-sm mt-1">{risk.mitigation_plan}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(risk)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRiskMutation.mutate(risk.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {filteredRisks.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun risque trouvé</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Commencez par créer un nouveau risque pour ce projet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EnhancedRiskManager;