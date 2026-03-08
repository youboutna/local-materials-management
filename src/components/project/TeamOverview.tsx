import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Plus, Users, Clock, DollarSign, Settings, User, Wrench, Package, AlertCircle } from 'lucide-react';

interface TeamOverviewProps {
  resources?: any[];
  setResources?: (resources: any[]) => void;
  projectId: string;
  phases?: any[];
}

interface ProjectResource {
  id: string;
  project_id: string;
  name: string;
  type: string;
  allocation_date: string | null;
  cost_per_unit: number | null;
  quantity: number | null;
  total_cost: number | null;
  unit: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectPhase {
  id: string;
  phase_name: string;
  status: string;
  construction_phase?: string;
}

interface ResourceFormData {
  name: string;
  type: string;
  notes: string;
  costPerUnit: string;
  quantity: string;
  unit: string;
  phaseId: string;
  applyToAllPhases: boolean;
  selectedPhases?: string[];
}

const TeamOverview: React.FC<TeamOverviewProps> = ({ 
  resources: propResources, 
  setResources: propSetResources, 
  projectId, 
  phases: propPhases 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>({
    name: '',
    type: '',
    notes: '',
    costPerUnit: '',
    quantity: '1',
    unit: '',
    phaseId: '',
    applyToAllPhases: false,
    selectedPhases: [],
  });
  
  const queryClient = useQueryClient();

  // Use provided resources or fetch from database
  const { data: fetchedResources, isLoading } = useQuery({
    queryKey: ['project-resources', projectId],
    queryFn: async (): Promise<ProjectResource[]> => {
      const { data, error } = await supabase
        .from('project_resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !propResources,
  });

  // Use props or fallback to fetched data
  const currentResources = propResources || fetchedResources || [];

  // Fetch project phases (required for resource creation)
  const { data: phases = [] } = useQuery({
    queryKey: ['project-phases', projectId],
    queryFn: async (): Promise<ProjectPhase[]> => {
      console.log('🔍 Fetching phases for project (TeamOverview):', projectId);
      const { data, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, status, construction_phase, description, start_date, end_date')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching phases (TeamOverview):', error);
        throw error;
      }
      
      console.log('✅ Phases fetched (TeamOverview):', data);
      return (data || []).filter(p => p.id).map(phase => ({
        ...phase,
        id: phase.id!,
        phase_name: phase.phase_name || '',
        status: phase.status || 'planned',
        construction_phase: phase.construction_phase || undefined
      })) as any[];
    },
    enabled: !!projectId && !propPhases,
  });

  // Use props or fallback to fetched data
  const currentPhases = propPhases || phases || [];
  console.log('📋 Current phases in TeamOverview:', currentPhases);

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (data: { name: string; project_id: string; type: string; notes?: string | null; cost_per_unit?: number | null; quantity?: number | null; unit?: string | null; }) => {
      const { error } = await supabase
        .from('project_resources')
        .insert([{
          name: data.name || 'Untitled Resource',
          project_id: data.project_id,
          type: data.type,
          notes: data.notes,
          cost_per_unit: data.cost_per_unit,
          quantity: data.quantity,
          unit: data.unit
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-resources'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "Ressource créée",
        description: "La ressource a été créée avec succès.",
      });
    },
    onError: (error) => {
      console.error('Error creating resource:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la ressource.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      notes: '',
      costPerUnit: '',
      quantity: '1',
      unit: '',
      phaseId: '',
      applyToAllPhases: false,
      selectedPhases: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de la ressource est requis.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.applyToAllPhases && !formData.phaseId) {
      toast({
        title: "Erreur", 
        description: "Vous devez sélectionner une phase ou appliquer à toutes les phases.",
        variant: "destructive",
      });
      return;
    }

    try {
      const resourcesToCreate: any[] = [];

      if (formData.applyToAllPhases) {
        // Create resource for each phase
        currentPhases.forEach(phase => {
          resourcesToCreate.push({
            project_id: projectId,
            name: `${formData.name} - ${phase.phase_name}`,
            type: formData.type,
            notes: formData.notes,
            cost_per_unit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
            quantity: formData.quantity ? parseInt(formData.quantity) : 1,
            unit: formData.unit
          });
        });
      } else {
        // Create single resource for selected phase
        resourcesToCreate.push({
          project_id: projectId,
          name: formData.name,
          type: formData.type,
          notes: formData.notes,
          cost_per_unit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null,
          quantity: formData.quantity ? parseInt(formData.quantity) : 1,
          unit: formData.unit
        });
      }

      if (resourcesToCreate.length > 0) {
        const { data, error } = await supabase
          .from('project_resources')
          .insert(resourcesToCreate)
          .select();

        if (error) throw error;

        // Refresh resources
        queryClient.invalidateQueries({ queryKey: ['project-resources'] });
        setIsCreating(false);
        resetForm();

        toast({
          title: "Ressource créée",
          description: `${resourcesToCreate.length} ressource(s) créée(s) avec succès.`,
        });
      }
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la ressource.",
        variant: "destructive",
      });
    }
  };

  // Group resources by type
  const humanResources = currentResources.filter(r => r.type === 'human');
  const equipmentResources = currentResources.filter(r => r.type === 'equipment');
  const materialResources = currentResources.filter(r => r.type === 'material');

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
              Vous devez d'abord créer des phases pour ce projet avant de pouvoir ajouter des ressources.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Équipe et ressources (délégation publique)</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {humanResources.length} Employés
            </span>
            <span className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              {equipmentResources.length} Équipements
            </span>
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {materialResources.length} Matériaux
            </span>
          </div>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle ressource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Modifier la ressource' : 'Créer une nouvelle ressource'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resourceName">Nom de la ressource</Label>
                  <Input
                    id="resourceName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom de la ressource"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="resourceType">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="human">Ressource humaine</SelectItem>
                      <SelectItem value="equipment">Équipement</SelectItem>
                      <SelectItem value="material">Matériel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                                      phaseId: phase.id // Keep single selection for backward compatibility
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedPhases: selectedPhases.filter(id => id !== phase.id),
                                      phaseId: selectedPhases.filter(id => id !== phase.id)[0] || ''
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

              <div>
                <Label htmlFor="notes">Notes/Description</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes ou description"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="costPerUnit">Coût par unité (MRU)</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unité</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pièce, m2, kg..."
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

      {/* Human Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ressources humaines ({humanResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {humanResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {resource.notes || 'Aucune description'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">
                    {resource.cost_per_unit || 0} MRU/{resource.unit || 'unité'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Qté: {resource.quantity || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {humanResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucune ressource humaine assignée
            </p>
          )}
        </CardContent>
      </Card>

      {/* Equipment Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Équipements ({equipmentResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equipmentResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {resource.notes || 'Aucune description'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">
                    {resource.cost_per_unit || 0} MRU/{resource.unit || 'unité'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Qté: {resource.quantity || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {equipmentResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun équipement assigné
            </p>
          )}
        </CardContent>
      </Card>

      {/* Material Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Matériaux ({materialResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materialResources.map((resource, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <h4 className="font-medium">{resource.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {resource.notes || 'Aucune description'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <Badge variant="outline">
                    {resource.cost_per_unit || 0} MRU/{resource.unit || 'unité'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Qté: {resource.quantity || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {materialResources.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Aucun matériau assigné
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamOverview;