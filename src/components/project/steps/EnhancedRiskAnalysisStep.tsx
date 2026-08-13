import { Loader2, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../ui/alert-dialog';

// Hexagonal architecture: services + DTOs only
import { getRiskService } from '@/application/services/RiskService';
import { getEmployeeService } from '@/application/services/EmployeeService';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { RiskDTO } from '@/dtos/entities/RiskDTO';

interface EnhancedRiskAnalysisStepProps {
  formData: ProjectDTO & { risks?: RiskDTO[] };
  onUpdate: (data: Partial<ProjectDTO>) => void;
  isEditing?: boolean;
}

type RiskCategoryUI =
  | 'technical' | 'financial' | 'environmental' | 'regulatory' | 'operational'
  | 'security' | 'health_safety' | 'quality' | 'schedule' | 'resource' | 'stakeholder' | 'strategic' | 'compliance' | 'safety';

type RiskStatusUI = 'identified' | 'monitored' | 'mitigated' | 'resolved';

interface RiskFormState {
  id?: string;
  title: string;
  description: string;
  category: RiskCategoryUI;
  probability: number; // 1-10
  impact: number; // 1-10
  status: RiskStatusUI;
  owner: string;
  mitigationPlan: string;
  contingencyPlan: string;
  costs: number;
  timelineImpact: number;
  reviewDate: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technique',
  financial: 'Financier',
  environmental: 'Environnemental',
  regulatory: 'Réglementaire',
  operational: 'Opérationnel',
  security: 'Sécurité',
  health_safety: 'Santé & Sécurité',
  quality: 'Qualité',
  schedule: 'Planning',
  resource: 'Ressource',
  stakeholder: 'Partie prenante',
  strategic: 'Stratégique',
  compliance: 'Conformité',
  safety: 'Sécurité',
};

const STATUS_LABELS: Record<string, string> = {
  identified: 'Identifié',
  monitored: 'Sous surveillance',
  mitigated: 'Atténué',
  resolved: 'Clôturé',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  technical: 1.2, financial: 1.5, environmental: 1.3, regulatory: 1.4, operational: 1.1,
  security: 1.6, health_safety: 1.7, quality: 1.2, schedule: 1.3, resource: 1.1,
  stakeholder: 1.2, strategic: 1.3, compliance: 1.4, safety: 1.6,
};

const emptyForm = (): RiskFormState => ({
  title: '',
  description: '',
  category: 'technical',
  probability: 5,
  impact: 5,
  status: 'identified',
  owner: '',
  mitigationPlan: '',
  contingencyPlan: '',
  costs: 0,
  timelineImpact: 0,
  reviewDate: new Date().toISOString().split('T')[0],
});

/** DTO (0-1) → formulaire (1-10) */
const toForm = (risk: RiskDTO): RiskFormState => ({
  id: risk.id,
  title: risk.title || '',
  description: risk.description || '',
  category: ((risk.category as unknown as RiskCategoryUI) || 'technical'),
  probability: Math.max(1, Math.round((risk.probability ?? 0.5) * 10)),
  impact: Math.max(1, Math.round((risk.impact ?? 0.5) * 10)),
  status: ((risk.status as unknown as RiskStatusUI) || 'identified'),
  owner: risk.ownerId || risk.owner || '',
  mitigationPlan: risk.mitigationPlan || risk.mitigationStrategy || '',
  contingencyPlan: risk.contingencyPlan || '',
  costs: risk.costs ?? 0,
  timelineImpact: risk.timelineImpact ?? 0,
  reviewDate: (risk.reviewDate || '').slice(0, 10) || new Date().toISOString().split('T')[0],
});

const weightOf = (category: string) => CATEGORY_WEIGHTS[category] || 1;
const scoreOf = (risk: RiskDTO) =>
  Math.round(
    Math.max(1, Math.round((risk.probability ?? 0.5) * 10)) *
    Math.max(1, Math.round((risk.impact ?? 0.5) * 10)) *
    weightOf(String(risk.category))
  );
const priorityOf = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (score <= 25) return 'low';
  if (score <= 50) return 'medium';
  if (score <= 75) return 'high';
  return 'critical';
};

const EnhancedRiskAnalysisStep: React.FC<EnhancedRiskAnalysisStepProps> = ({
  formData,
  onUpdate,
}) => {
  const { toast } = useToast();
  const riskService = getRiskService();
  const projectId = formData?.id || '';

  const [risks, setRisks] = useState<RiskDTO[]>(formData.risks || []);
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RiskFormState>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // onUpdate identity changes at each parent render: keep it in a ref
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const propagate = useCallback((next: RiskDTO[]) => {
    setRisks(next);
    onUpdateRef.current?.({ risks: next } as unknown as Partial<ProjectDTO>);
  }, []);

  // Load risks from database (source of truth) when project exists
  useEffect(() => {
    let cancelled = false;
    if (!projectId) return;
    setLoading(true);
    riskService
      .getProjectRisks(projectId)
      .then(data => {
        if (cancelled) return;
        setRisks(data);
        onUpdateRef.current?.({ risks: data } as unknown as Partial<ProjectDTO>);
      })
      .catch(error => {
        console.error('Failed to load project risks:', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    getEmployeeService()
      .getAllEmployees()
      .then(list => {
        if (cancelled) return;
        setEmployees(list.map(e => ({ id: e.id, name: e.fullName || e.id })));
      })
      .catch(() => setEmployees([]));
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (risk: RiskDTO) => {
    setForm(toForm(risk));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Erreur', description: 'Le titre du risque est obligatoire', variant: 'destructive' });
      return;
    }
    if (!projectId) {
      toast({
        title: 'Projet non enregistré',
        description: "Enregistrez d'abord le projet pour pouvoir ajouter des risques",
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (form.id) {
        const updated = await riskService.updateRisk(form.id, {
          title: form.title,
          description: form.description,
          category: form.category,
          probability: form.probability,
          impact: form.impact,
          status: form.status,
          mitigation_strategy: form.mitigationPlan,
          mitigation_plan: form.mitigationPlan,
          contingency_plan: form.contingencyPlan,
          costs: form.costs,
          timeline_impact: form.timelineImpact,
          review_date: form.reviewDate,
          owner_id: form.owner || undefined,
        });
        propagate(risks.map(r => (r.id === updated.id ? updated : r)));
        toast({ title: 'Risque mis à jour', description: 'Les modifications ont été enregistrées' });
      } else {
        const created = await riskService.createRisk({
          project_id: projectId,
          title: form.title,
          description: form.description,
          category: form.category,
          probability: form.probability,
          impact: form.impact,
          status: form.status,
          mitigation_strategy: form.mitigationPlan,
          mitigation_plan: form.mitigationPlan,
          contingency_plan: form.contingencyPlan,
          costs: form.costs,
          timeline_impact: form.timelineImpact,
          review_date: form.reviewDate,
          owner_id: form.owner || undefined,
        });
        propagate([...risks, created]);
        toast({ title: 'Risque ajouté', description: 'Le risque a été enregistré' });
      }
      setShowForm(false);
      setForm(emptyForm());
    } catch (error) {
      console.error('Failed to save risk:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l'enregistrement du risque",
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await riskService.deleteRisk(deleteId);
      propagate(risks.filter(r => r.id !== deleteId));
      toast({ title: 'Risque supprimé', description: 'Le risque a été supprimé' });
    } catch (error) {
      console.error('Failed to delete risk:', error);
      toast({ title: 'Erreur', description: 'Échec de la suppression du risque', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleQuickStatus = async (risk: RiskDTO, status: RiskStatusUI) => {
    try {
      const updated = await riskService.updateRisk(risk.id, { status });
      propagate(risks.map(r => (r.id === updated.id ? updated : r)));
    } catch (error) {
      console.error('Failed to update risk status:', error);
      toast({ title: 'Erreur', description: 'Échec de la mise à jour du statut', variant: 'destructive' });
    }
  };

  // Statistics
  const scores = risks.map(scoreOf);
  const totalRisks = risks.length;
  const criticalRisks = scores.filter(s => priorityOf(s) === 'critical').length;
  const highRisks = scores.filter(s => priorityOf(s) === 'high').length;
  const averageRiskScore = totalRisks ? Math.round(scores.reduce((a, b) => a + b, 0) / totalRisks) : 0;
  const totalRiskCost = risks.reduce((sum, r) => sum + (r.costs || 0), 0);

  const priorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive' as const;
      case 'high': return 'default' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Analyse des Risques
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRisks}</div>
              <div className="text-sm text-muted-foreground">Total Risques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{criticalRisks}</div>
              <div className="text-sm text-muted-foreground">Critiques</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{highRisks}</div>
              <div className="text-sm text-muted-foreground">Élevés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{averageRiskScore}</div>
              <div className="text-sm text-muted-foreground">Score Moyen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRiskCost.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Coût Total (MRU)</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Liste des Risques</h3>
            <Button onClick={openCreate} disabled={saving}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un Risque
            </Button>
          </div>

          {!projectId && (
            <p className="text-sm text-muted-foreground mb-4">
              Enregistrez le projet pour activer la gestion des risques.
            </p>
          )}

          {showForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">{form.id ? 'Modifier le risque' : 'Nouveau risque'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk-title">Titre du Risque *</Label>
                    <Input
                      id="risk-title"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder="Titre du risque"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-category">Catégorie</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v as RiskCategoryUI })}>
                      <SelectTrigger id="risk-category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {['technical', 'financial', 'environmental', 'regulatory', 'operational', 'security', 'health_safety', 'quality', 'schedule', 'resource', 'stakeholder'].map(c => (
                          <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="risk-description">Description</Label>
                  <Textarea
                    id="risk-description"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Description détaillée du risque"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="risk-probability">Probabilité (1-10)</Label>
                    <Input
                      id="risk-probability"
                      type="number"
                      min={1}
                      max={10}
                      value={form.probability}
                      onChange={e => setForm({ ...form, probability: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-impact">Impact (1-10)</Label>
                    <Input
                      id="risk-impact"
                      type="number"
                      min={1}
                      max={10}
                      value={form.impact}
                      onChange={e => setForm({ ...form, impact: Number(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-status">Statut</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as RiskStatusUI })}>
                      <SelectTrigger id="risk-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="risk-owner">Responsable</Label>
                    <Select value={form.owner} onValueChange={v => setForm({ ...form, owner: v })}>
                      <SelectTrigger id="risk-owner">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="risk-costs">Coût estimé (MRU)</Label>
                    <Input
                      id="risk-costs"
                      type="number"
                      min={0}
                      value={form.costs}
                      onChange={e => setForm({ ...form, costs: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-timeline">Impact délai (jours)</Label>
                    <Input
                      id="risk-timeline"
                      type="number"
                      min={0}
                      value={form.timelineImpact}
                      onChange={e => setForm({ ...form, timelineImpact: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-review">Date de revue</Label>
                    <Input
                      id="risk-review"
                      type="date"
                      value={form.reviewDate}
                      onChange={e => setForm({ ...form, reviewDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="risk-mitigation">Plan de Mitigation</Label>
                    <Textarea
                      id="risk-mitigation"
                      value={form.mitigationPlan}
                      onChange={e => setForm({ ...form, mitigationPlan: e.target.value })}
                      placeholder="Stratégies pour réduire le risque"
                      className="min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="risk-contingency">Plan de Contingence</Label>
                    <Textarea
                      id="risk-contingency"
                      value={form.contingencyPlan}
                      onChange={e => setForm({ ...form, contingencyPlan: e.target.value })}
                      placeholder="Actions si le risque se matérialise"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    {form.id ? 'Enregistrer les modifications' : 'Ajouter le risque'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm()); }} disabled={saving}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement des risques...
            </div>
          )}

          {!loading && risks.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun risque enregistré pour ce projet.</p>
          )}

          <div className="space-y-4">
            {risks.map(risk => {
              const score = scoreOf(risk);
              const priority = priorityOf(score);
              const probability = Math.max(1, Math.round((risk.probability ?? 0.5) * 10));
              const impact = Math.max(1, Math.round((risk.impact ?? 0.5) * 10));
              return (
                <Card key={risk.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4 gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{risk.title}</h4>
                        {risk.description && (
                          <p className="text-muted-foreground text-sm">{risk.description}</p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant={priorityVariant(priority)}>{priority.toUpperCase()}</Badge>
                          <Badge variant="outline">{STATUS_LABELS[String(risk.status)] || String(risk.status)}</Badge>
                          <Badge variant="outline">{CATEGORY_LABELS[String(risk.category)] || String(risk.category)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={String(risk.status)} onValueChange={v => handleQuickStatus(risk, v as RiskStatusUI)}>
                          <SelectTrigger className="w-[170px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => openEdit(risk)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(risk.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Score de Risque</div>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(100, (score / 170) * 100)} className="h-2 flex-1" />
                          <span className="font-bold">{score}</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Probabilité</div>
                        <div className="flex items-center gap-2">
                          <Progress value={probability * 10} className="h-2 flex-1" />
                          <span>{probability}/10</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Impact</div>
                        <div className="flex items-center gap-2">
                          <Progress value={impact * 10} className="h-2 flex-1" />
                          <span>{impact}/10</span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Coût / Délai</div>
                        <div>{(risk.costs || 0).toLocaleString()} MRU · {risk.timelineImpact || 0} j</div>
                      </div>
                    </div>

                    {(risk.mitigationPlan || risk.mitigationStrategy) && (
                      <div className="mt-4">
                        <div className="font-medium text-sm">Plan de Mitigation</div>
                        <p className="text-sm text-muted-foreground">{risk.mitigationPlan || risk.mitigationStrategy}</p>
                      </div>
                    )}

                    {risk.contingencyPlan && (
                      <div className="mt-2">
                        <div className="font-medium text-sm">Plan de Contingence</div>
                        <p className="text-sm text-muted-foreground">{risk.contingencyPlan}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce risque ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et supprime le risque du projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedRiskAnalysisStep;
