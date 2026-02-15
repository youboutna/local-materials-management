import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, DollarSign, Save, X, Plus } from 'lucide-react';
import { ProjectData, ConstructionPhase, ProjectStatus } from '@/dtos/entities/ProjectDTO';
import { ProjectReportDTO, EnhancedPhaseDTO, ConstructionMilestoneDTO } from '@/dtos/entities/ReportDTO';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ProjectCreateByDTOProps {
  onSave: (project: ProjectData) => void;
  onCancel: () => void;
}

export function ProjectCreateByDTO({ onSave, onCancel }: ProjectCreateByDTOProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  const [projectData, setProjectData] = useState<Partial<ProjectData>>({
    title: '',
    description: '',
    location: '',
    status: ProjectStatus.EN_COURS_LEGACY,
    progress: 0,
    budget: 0,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    teamSize: 1,
    financingSource: '',
    marketType: '',
    selectionMode: '',
    methodology: 'waterfall'
  });

  const [phases, setPhases] = useState<Partial<EnhancedPhaseDTO>[]>([
    {
      name: 'Études préliminaires',
      plannedProgress: 0,
      actualProgress: 0,
      budget: 0,
      actualCost: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'planned',
      procurementStep: 'ETUDES_PRELIMINAIRES',
      riskLevel: 'low',
      dependencies: [],
      assignedTeam: []
    }
  ]);

  const [milestones, setMilestones] = useState<Partial<ConstructionMilestoneDTO>[]>([
    {
      title: 'Validation des études',
      description: 'Validation des études de faisabilité',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending',
      stage: 'conception',
      priority: 'high',
      completionPercentage: 0,
      blockers: [],
      dependencies: []
    }
  ]);

  const handleBasicInfoChange = (field: keyof ProjectData, value: string | number | boolean) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const addPhase = () => {
    const newPhase: Partial<EnhancedPhaseDTO> = {
      name: `Phase ${phases.length + 1}`,
      plannedProgress: 0,
      actualProgress: 0,
      budget: 0,
      actualCost: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'planned',
      procurementStep: '',
      riskLevel: 'low',
      dependencies: [],
      assignedTeam: []
    };
    setPhases(prev => [...prev, newPhase]);
  };

  const updatePhase = (index: number, field: keyof EnhancedPhaseDTO, value: string | number | Date | undefined) => {
    setPhases(prev => prev.map((phase, i) => 
      i === index ? { ...phase, [field]: value } : phase
    ));
  };

  const removePhase = (index: number) => {
    if (phases.length > 1) {
      setPhases(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addMilestone = () => {
    const newMilestone: Partial<ConstructionMilestoneDTO> = {
      title: `Jalon ${milestones.length + 1}`,
      description: '',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'pending',
      stage: 'conception',
      priority: 'medium',
      completionPercentage: 0,
      blockers: [],
      dependencies: []
    };
    setMilestones(prev => [...prev, newMilestone]);
  };

  const updateMilestone = (index: number, field: keyof ConstructionMilestoneDTO, value: string | number | Date | undefined) => {
    setMilestones(prev => prev.map((milestone, i) => 
      i === index ? { ...milestone, [field]: value } : milestone
    ));
  };

  const removeMilestone = (index: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateProject = (): string[] => {
    const errors: string[] = [];
    
    if (!projectData.title?.trim()) {
      errors.push('Le titre du projet est obligatoire');
    }
    
    if (!projectData.description?.trim()) {
      errors.push('La description du projet est obligatoire');
    }
    
    if (!projectData.location?.trim()) {
      errors.push('La localisation du projet est obligatoire');
    }
    
    if (!projectData.budget || projectData.budget <= 0) {
      errors.push('Le budget doit être supérieur à 0');
    }
    
    if (phases.some(phase => !phase.name?.trim())) {
      errors.push('Toutes les phases doivent avoir un nom');
    }
    
    if (milestones.some(milestone => !milestone.title?.trim())) {
      errors.push('Tous les jalons doivent avoir un titre');
    }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const errors = validateProject();
      if (errors.length > 0) {
        toast({
          title: 'Erreurs de validation',
          description: errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Create the full project data
      const fullProjectData: ProjectData = {
        id: `project-${Date.now()}`,
        title: projectData.title!,
        description: projectData.description!,
        location: projectData.location!,
        status: projectData.status || ProjectStatus.EN_COURS_LEGACY,
        progress: projectData.progress || 0,
        budget: projectData.budget || 0,
        startDate: projectData.startDate!,
        endDate: projectData.endDate!,
        thumbnail: '',
        teamSize: projectData.teamSize || 1,
        coordinates: undefined,
        financingSource: projectData.financingSource,
        marketType: projectData.marketType,
        selectionMode: projectData.selectionMode,
        launchDate: projectData.startDate!,
        attributionDate: projectData.startDate!,
        currentPhase: 'pre_construction' as ConstructionPhase,
        currentStage: 'planningDesign',
        methodology: projectData.methodology || 'waterfall'
      };

      // TODO: Save phases and milestones to database
      // For now, we'll include them in the project data structure

      toast({
        title: 'Projet créé',
        description: 'Le projet a été créé avec succès'
      });

      onSave(fullProjectData);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le projet',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Créer un nouveau projet</h1>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Informations de base</TabsTrigger>
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="milestones">Jalons</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Titre du projet *</Label>
                <Input
                  id="title"
                  value={projectData.title || ''}
                  onChange={(e) => handleBasicInfoChange('title', e.target.value)}
                  placeholder="Entrez le titre du projet"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={projectData.description || ''}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  placeholder="Décrivez le projet"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={projectData.location || ''}
                    onChange={(e) => handleBasicInfoChange('location', e.target.value)}
                    placeholder="Ville, Région"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget (€) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={projectData.budget || ''}
                    onChange={(e) => handleBasicInfoChange('budget', Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectData.startDate ? format(new Date(projectData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleBasicInfoChange('startDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Date de fin prévue</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={projectData.endDate ? format(new Date(projectData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={(e) => handleBasicInfoChange('endDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="teamSize">Taille de l'équipe</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    value={projectData.teamSize || ''}
                    onChange={(e) => handleBasicInfoChange('teamSize', Number(e.target.value))}
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="financingSource">Source de financement</Label>
                  <Input
                    id="financingSource"
                    value={projectData.financingSource || ''}
                    onChange={(e) => handleBasicInfoChange('financingSource', e.target.value)}
                    placeholder="Budget national, privé..."
                  />
                </div>

                <div>
                  <Label htmlFor="marketType">Type de marché</Label>
                  <Select value={projectData.marketType || ''} onValueChange={(value) => handleBasicInfoChange('marketType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Privé</SelectItem>
                      <SelectItem value="mixed">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Phases du projet</h2>
            <Button onClick={addPhase} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une phase
            </Button>
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Phase {index + 1}</CardTitle>
                    {phases.length > 1 && (
                      <Button
                        onClick={() => removePhase(index)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nom de la phase</Label>
                    <Input
                      value={phase.name || ''}
                      onChange={(e) => updatePhase(index, 'name', e.target.value)}
                      placeholder="Nom de la phase"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date de début</Label>
                      <Input
                        type="date"
                        value={phase.startDate ? format(new Date(phase.startDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updatePhase(index, 'startDate', e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </div>

                    <div>
                      <Label>Date de fin</Label>
                      <Input
                        type="date"
                        value={phase.endDate ? format(new Date(phase.endDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updatePhase(index, 'endDate', e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Budget (€)</Label>
                      <Input
                        type="number"
                        value={phase.budget || ''}
                        onChange={(e) => updatePhase(index, 'budget', Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Niveau de risque</Label>
                      <Select 
                        value={phase.riskLevel || 'low'} 
                        onValueChange={(value) => updatePhase(index, 'riskLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyen</SelectItem>
                          <SelectItem value="high">Élevé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Jalons du projet</h2>
            <Button onClick={addMilestone} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un jalon
            </Button>
          </div>

          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Jalon {index + 1}</CardTitle>
                    {milestones.length > 1 && (
                      <Button
                        onClick={() => removeMilestone(index)}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Titre du jalon</Label>
                    <Input
                      value={milestone.title || ''}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      placeholder="Titre du jalon"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={milestone.description || ''}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      placeholder="Description du jalon"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Date cible</Label>
                      <Input
                        type="date"
                        value={milestone.targetDate ? format(new Date(milestone.targetDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateMilestone(index, 'targetDate', e.target.value ? new Date(e.target.value) : new Date())}
                      />
                    </div>

                    <div>
                      <Label>Priorité</Label>
                      <Select 
                        value={milestone.priority || 'medium'} 
                        onValueChange={(value) => updateMilestone(index, 'priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Faible</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Élevée</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Étape</Label>
                      <Select 
                        value={milestone.stage || 'conception'} 
                        onValueChange={(value) => updateMilestone(index, 'stage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conception">Conception</SelectItem>
                          <SelectItem value="preparation">Préparation</SelectItem>
                          <SelectItem value="execution">Exécution</SelectItem>
                          <SelectItem value="validation">Validation</SelectItem>
                          <SelectItem value="livraison">Livraison</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aperçu du projet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{projectData.title || 'Titre du projet'}</h3>
                  <p className="text-muted-foreground">{projectData.description || 'Description du projet'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{projectData.location || 'Localisation'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">{(projectData.budget || 0).toLocaleString()} €</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{projectData.teamSize} membres</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Phases ({phases.length})</h4>
                  <div className="space-y-2">
                    {phases.map((phase, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{phase.name}</span>
                        <Badge variant="outline">{phase.riskLevel}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Jalons ({milestones.length})</h4>
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span>{milestone.title}</span>
                        <Badge variant="outline">{milestone.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}