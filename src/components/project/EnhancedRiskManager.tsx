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
import { ConstructionPhase, ConstructionStage } from '@/types/project';

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
}

interface RiskTaskRelation {
  id: string;
  risk_id: string;
  task_id: string;
}

interface TaskAssignment {
  id: string;
  title: string | null;
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
  });

  // Fetch project phases
  const { data: phases } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, description, construction_phase, construction_stage')
        .eq('project_id', projectId)
        .order('phase_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch project tasks for risk relations
  const { data: tasks } = useQuery({
    queryKey: ['project-tasks-for-risks', projectId],
    queryFn: async (): Promise<TaskAssignment[]> => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('id, title, phase_id')
        .eq('project_id', projectId)
        .order('title', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees/stakeholders
  const { data: employees } = useQuery({
    queryKey: ['project-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, position, department')
        .eq('is_active', true)
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch project details for contractor info
  const { data: projectDetails } = useQuery({
    queryKey: ['project-details', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('title, main_contractor')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch risk-task relations
  const { data: riskTaskRelations } = useQuery({
    queryKey: ['risk-task-relations', projectId],
    queryFn: async (): Promise<RiskTaskRelation[]> => {
      if (!risks?.length) return [];
      
      const riskIds = risks.map(r => r.id);
      const { data, error } = await supabase
        .from('risk_task_relations')
        .select('*')
        .in('risk_id', riskIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!risks?.length,
  });

  // Filter risks based on selected risk level
  const filteredRisks = risks?.filter(risk => {
    if (selectedRiskLevel === 'all') return true;
    const riskScore = risk.risk_score || (risk.probability_numeric && risk.impact_numeric ? 
      (risk.probability_numeric * risk.impact_numeric / 100) : 0);
    
    switch (selectedRiskLevel) {
      case 'low': return riskScore < 25;
      case 'medium': return riskScore >= 25 && riskScore < 50;
      case 'high': return riskScore >= 50 && riskScore < 75;
      case 'critical': return riskScore >= 75;
      default: return true;
    }
  }) || [];

  // Calculate risk metrics
  const riskMetrics = React.useMemo(() => {
    if (!filteredRisks.length) return { averageScore: 0, highRisks: 0, mitigatedRisks: 0 };
    
    const scores = filteredRisks.map(risk => 
      risk.risk_score || (risk.probability_numeric && risk.impact_numeric ? 
        (risk.probability_numeric * risk.impact_numeric / 100) : 0)
    );
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highRisks = scores.filter(score => score >= 50).length;
    const mitigatedRisks = filteredRisks.filter(risk => 
      risk.status_new === 'mitigated' || risk.status_new === 'resolved'
    ).length;
    
    return { averageScore, highRisks, mitigatedRisks };
  }, [filteredRisks]);

  const createRiskMutation = useMutation({
    mutationFn: async (riskData: RiskFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_risks')
        .insert({
          project_id: projectId,
          risk_title: riskData.risk_title,
          risk_description: riskData.risk_description,
          probability_numeric: riskData.probability_numeric ? parseInt(riskData.probability_numeric) : null,
          impact_numeric: riskData.impact_numeric ? parseInt(riskData.impact_numeric) : null,
          mitigation_plan: riskData.mitigation_plan,
          status_new: riskData.status_new,
          owner_id: riskData.owner_id || null,
          due_date: riskData.due_date || null,
          identified_by: user.id,
          identified_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      
      if (error) throw error;

      // Create risk-task relations
      if (riskData.related_tasks.length > 0) {
        const relations = riskData.related_tasks.map(taskId => ({
          risk_id: data.id,
          task_id: taskId,
        }));

        const { error: relError } = await supabase
          .from('risk_task_relations')
          .insert(relations);
        
        if (relError) throw relError;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      setIsCreating(false);
      resetForm();
      toast({ title: 'Risque créé avec succès' });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RiskFormData> }) => {
      const updateData: any = { ...data };
      
      if (updateData.probability_numeric) updateData.probability_numeric = parseInt(updateData.probability_numeric);
      if (updateData.impact_numeric) updateData.impact_numeric = parseInt(updateData.impact_numeric);
      
      const { error } = await supabase
        .from('project_risks')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;

      // Update risk-task relations
      if (data.related_tasks !== undefined) {
        // Delete existing relations
        await supabase
          .from('risk_task_relations')
          .delete()
          .eq('risk_id', id);

        // Create new relations
        if (data.related_tasks.length > 0) {
          const relations = data.related_tasks.map(taskId => ({
            risk_id: id,
            task_id: taskId,
          }));

          const { error: relError } = await supabase
            .from('risk_task_relations')
            .insert(relations);
          
          if (relError) throw relError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      setEditingId(null);
      resetForm();
      toast({ title: 'Risque mis à jour avec succès' });
    },
  });

  const deleteRiskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_risks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-project-risks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['risk-task-relations', projectId] });
      toast({ title: 'Risque supprimé avec succès' });
    },
  });

  // Standard construction phase risks
  const STANDARD_PHASE_RISKS = {
    'pre_construction': [
      { title: 'Retard dans les approbations', probability: 30, impact: 70, description: 'Retards possibles dans l\'obtention des permis et approbations' },
      { title: 'Problèmes de financement', probability: 20, impact: 90, description: 'Difficultés d\'obtention ou de déblocage des fonds' },
      { title: 'Modifications du design', probability: 40, impact: 50, description: 'Changements tardifs dans les plans et spécifications' }
    ],
    'site_preparation': [
      { title: 'Conditions du sol imprévues', probability: 25, impact: 80, description: 'Découverte de conditions géotechniques défavorables' },
      { title: 'Services publics non identifiés', probability: 15, impact: 60, description: 'Présence non documentée de services souterrains' },
      { title: 'Problèmes d\'accès au site', probability: 20, impact: 40, description: 'Difficultés d\'accès pour les équipements lourds' }
    ],
    'foundation': [
      { title: 'Problèmes structurels du sol', probability: 30, impact: 90, description: 'Capacité portante insuffisante du sol' },
      { title: 'Infiltration d\'eau', probability: 35, impact: 70, description: 'Présence d\'eau souterraine non anticipée' },
      { title: 'Défauts dans le béton', probability: 10, impact: 80, description: 'Problèmes de qualité du béton coulé' }
    ],
    'structural_work': [
      { title: 'Défauts matériaux', probability: 20, impact: 85, description: 'Matériaux structurels défectueux ou non conformes' },
      { title: 'Erreurs d\'assemblage', probability: 15, impact: 75, description: 'Erreurs dans l\'assemblage des éléments structurels' },
      { title: 'Conditions météorologiques', probability: 40, impact: 50, description: 'Impact des conditions météo sur les travaux' }
    ],
    'finishing': [
      { title: 'Défauts de finition', probability: 30, impact: 40, description: 'Problèmes de qualité des finitions' },
      { title: 'Retard livraison matériaux', probability: 25, impact: 60, description: 'Retards dans la livraison des matériaux de finition' },
      { title: 'Non-conformité aux spécifications', probability: 20, impact: 55, description: 'Finitions non conformes aux spécifications' }
    ]
  };

  const suggestRiskBasedOnPhase = (phase: string) => {
    const phaseRisks = STANDARD_PHASE_RISKS[phase as keyof typeof STANDARD_PHASE_RISKS] || [];
    return phaseRisks;
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateRiskMutation.mutate({ id: editingId, data: formData });
    } else {
      createRiskMutation.mutate(formData);
    }
  };

  const startEdit = (risk: ProjectRisk) => {
    const relatedTasks = riskTaskRelations?.filter(rel => rel.risk_id === risk.id).map(rel => rel.task_id) || [];
    
    setFormData({
      risk_title: risk.risk_title || '',
      risk_description: risk.risk_description || '',
      probability_numeric: risk.probability_numeric?.toString() || '',
      impact_numeric: risk.impact_numeric?.toString() || '',
      mitigation_plan: risk.mitigation_plan || '',
      status_new: risk.status_new || 'identified',
      owner_id: risk.owner_id || '',
      due_date: risk.due_date || '',
      related_tasks: relatedTasks,
      phase_id: '',
      construction_phase: '',
    });
    setEditingId(risk.id);
    setIsCreating(true);
  };

  const handlePhaseChange = (phaseId: string) => {
    setFormData(prev => ({ ...prev, phase_id: phaseId }));
    
    // Find the selected phase and suggest risks
    const selectedPhase = phases?.find(p => p.id === phaseId);
    if (selectedPhase?.construction_phase) {
      setFormData(prev => ({ ...prev, construction_phase: selectedPhase.construction_phase || '' }));
    }
  };

  const applySuggestedRisk = (suggestedRisk: any) => {
    setFormData(prev => ({
      ...prev,
      risk_title: suggestedRisk.title,
      risk_description: suggestedRisk.description,
      probability_numeric: suggestedRisk.probability.toString(),
      impact_numeric: suggestedRisk.impact.toString(),
    }));
  };

  const getFilteredTasks = (phaseId?: string) => {
    if (!phaseId || phaseId === 'all') return tasks || [];
    return tasks?.filter(task => (task as any).phase_id === phaseId) || [];
  };

  const getRiskLevelColor = (riskScore: number) => {
    if (riskScore >= 75) return 'bg-red-100 text-red-800';
    if (riskScore >= 50) return 'bg-orange-100 text-orange-800';
    if (riskScore >= 25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getRiskLevelLabel = (riskScore: number) => {
    if (riskScore >= 75) return 'Critique';
    if (riskScore >= 50) return 'Élevé';
    if (riskScore >= 25) return 'Moyen';
    return 'Faible';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'mitigated': return 'bg-blue-100 text-blue-800';
      case 'monitored': return 'bg-yellow-100 text-yellow-800';
      case 'identified': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRelatedTasks = (riskId: string) => {
    return riskTaskRelations?.filter(rel => rel.risk_id === riskId) || [];
  };

  if (isLoading) {
    return <div className="animate-pulse">Chargement des risques...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Score Moyen</p>
                <p className="text-2xl font-bold">{riskMetrics.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Risques Élevés</p>
                <p className="text-2xl font-bold">{riskMetrics.highRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Risques Maîtrisés</p>
                <p className="text-2xl font-bold">{riskMetrics.mitigatedRisks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gestion des Risques ({filteredRisks.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="low">Faible (0-24)</SelectItem>
                  <SelectItem value="medium">Moyen (25-49)</SelectItem>
                  <SelectItem value="high">Élevé (50-74)</SelectItem>
                  <SelectItem value="critical">Critique (75+)</SelectItem>
                </SelectContent>
              </Select>
              
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setEditingId(null); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau risque
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId ? 'Modifier le risque' : 'Nouveau risque'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Phase Selection */}
                    <div>
                      <Label htmlFor="phase_id">Phase du projet</Label>
                      <Select
                        value={formData.phase_id}
                        onValueChange={handlePhaseChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une phase" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">Phase générale</SelectItem>
                          {phases?.map((phase) => (
                            <SelectItem key={phase.id} value={phase.id}>
                              {phase.phase_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Risk Suggestions based on phase */}
                    {formData.construction_phase && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <Label className="text-sm font-medium text-blue-800">Risques suggérés pour cette phase:</Label>
                        <div className="mt-2 space-y-2">
                          {suggestRiskBasedOnPhase(formData.construction_phase).map((risk, index) => (
                            <div key={index} className="p-2 bg-white rounded border border-blue-200">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{risk.title}</p>
                                  <p className="text-xs text-gray-600">{risk.description}</p>
                                  <p className="text-xs text-blue-600">
                                    Probabilité: {risk.probability}% | Impact: {risk.impact}%
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => applySuggestedRisk(risk)}
                                >
                                  Utiliser
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="risk_title">Titre du risque *</Label>
                      <Input
                        id="risk_title"
                        value={formData.risk_title}
                        onChange={(e) => setFormData({ ...formData, risk_title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="risk_description">Description</Label>
                      <Textarea
                        id="risk_description"
                        value={formData.risk_description}
                        onChange={(e) => setFormData({ ...formData, risk_description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="probability_numeric">Probabilité (0-100)</Label>
                        <Input
                          id="probability_numeric"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.probability_numeric}
                          onChange={(e) => setFormData({ ...formData, probability_numeric: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="impact_numeric">Impact (0-100)</Label>
                        <Input
                          id="impact_numeric"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.impact_numeric}
                          onChange={(e) => setFormData({ ...formData, impact_numeric: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mitigation_plan">Plan d'atténuation</Label>
                      <Textarea
                        id="mitigation_plan"
                        value={formData.mitigation_plan}
                        onChange={(e) => setFormData({ ...formData, mitigation_plan: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="status_new">Statut</Label>
                        <Select
                          value={formData.status_new}
                          onValueChange={(value) => setFormData({ ...formData, status_new: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="identified">Identifié</SelectItem>
                            <SelectItem value="monitored">Surveillé</SelectItem>
                            <SelectItem value="mitigated">Atténué</SelectItem>
                            <SelectItem value="resolved">Résolu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="owner_id">Responsable</Label>
                        <Select
                          value={formData.owner_id}
                          onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un responsable" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Non assigné</SelectItem>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.full_name}
                                {employee.position && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({employee.position})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
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

                    <div>
                      <Label>Tâches liées</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                        {getFilteredTasks(formData.phase_id).map((task) => (
                          <div key={task.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`task-${task.id}`}
                              checked={formData.related_tasks.includes(task.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    related_tasks: [...formData.related_tasks, task.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    related_tasks: formData.related_tasks.filter(id => id !== task.id)
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`task-${task.id}`} className="text-sm cursor-pointer">
                              {task.title}
                            </Label>
                          </div>
                        ))}
                        {getFilteredTasks(formData.phase_id).length === 0 && (
                          <div className="col-span-2 p-2 text-sm text-muted-foreground text-center">
                            {formData.phase_id ? 'Aucune tâche dans cette phase' : 'Sélectionnez d\'abord une phase'}
                          </div>
                        )}
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
        </CardHeader>
        <CardContent>
          {filteredRisks && filteredRisks.length > 0 ? (
            <div className="space-y-4">
              {filteredRisks.map((risk) => {
                const riskScore = risk.risk_score || (risk.probability_numeric && risk.impact_numeric ? 
                  (risk.probability_numeric * risk.impact_numeric / 100) : 0);
                const relatedTasks = getRelatedTasks(risk.id);
                
                return (
                  <div key={risk.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{risk.risk_title}</h3>
                          <Badge className={getRiskLevelColor(riskScore)}>
                            {getRiskLevelLabel(riskScore)} ({riskScore.toFixed(0)})
                          </Badge>
                          <Badge className={getStatusColor(risk.status_new || 'identified')}>
                            {risk.status_new === 'identified' ? 'Identifié' :
                             risk.status_new === 'monitored' ? 'Surveillé' :
                             risk.status_new === 'mitigated' ? 'Atténué' : 'Résolu'}
                          </Badge>
                        </div>
                        
                        {risk.risk_description && (
                          <p className="text-sm text-muted-foreground mb-3">{risk.risk_description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Probabilité</p>
                            <div className="flex items-center gap-2">
                              <Progress value={risk.probability_numeric || 0} className="flex-1 h-2" />
                              <span className="text-sm">{risk.probability_numeric || 0}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Impact</p>
                            <div className="flex items-center gap-2">
                              <Progress value={risk.impact_numeric || 0} className="flex-1 h-2" />
                              <span className="text-sm">{risk.impact_numeric || 0}%</span>
                            </div>
                          </div>
                        </div>
                        
                        {risk.mitigation_plan && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Plan d'atténuation:</p>
                            <p className="text-sm">{risk.mitigation_plan}</p>
                          </div>
                        )}
                        
                        {relatedTasks.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-muted-foreground mb-1">Tâches liées:</p>
                            <div className="flex flex-wrap gap-1">
                              {relatedTasks.map((rel) => {
                                const task = tasks?.find(t => t.id === rel.task_id);
                                return task ? (
                                  <Badge key={rel.id} variant="outline" className="text-xs">
                                    {task.title}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          {risk.owner_id && (
                            <div>Responsable: {risk.owner_id}</div>
                          )}
                          {risk.due_date && (
                            <div>Échéance: {new Date(risk.due_date).toLocaleDateString()}</div>
                          )}
                          {risk.identified_date && (
                            <div>Identifié: {new Date(risk.identified_date).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => startEdit(risk)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRiskMutation.mutate(risk.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun risque identifié pour ce projet.
              {selectedRiskLevel !== 'all' ? ' Essayez de changer le filtre.' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRiskManager;