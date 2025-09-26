import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, Users, Building, Calendar, DollarSign, FileText, 
  Plus, Edit, Trash2, CheckCircle, Clock, AlertTriangle,
  UserCheck, Shield, Layers, Save, Package, Target
} from 'lucide-react';

import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import PhaseMaterials from './PhaseMaterials';
import PhaseTasks from './PhaseTasks';
import PhasePayments from './PhasePayments';
import PhaseDocuments from './PhaseDocuments';

interface EnhancedProjectEditFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

const EnhancedProjectEditFormWithTasks: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    status: 'planning',
    startDate: '',
    endDate: '',
    location: '',
    delegation: {
      projectManager: '',
      technicalManager: '',
      supervisor: '',
      client: ''
    },
    stakeholders: [] as any[],
    phases: [] as any[],
    ...initialData
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        delegation: {
          projectManager: '',
          technicalManager: '',
          supervisor: '',
          client: '',
          ...initialData.delegation
        },
        stakeholders: initialData.stakeholders || [],
        phases: initialData.phases || []
      }));
    }
  }, [initialData]);

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const workflowSteps = [
    { id: 'basic', title: 'Informations Générales', icon: Building },
    { id: 'stakeholders', title: 'Parties Prenantes', icon: Users },
    { id: 'phases', title: 'Phases & Planification', icon: Layers },
    { id: 'geolocation', title: 'Géolocalisation', icon: MapPin },
    { id: 'risks', title: 'Gestion des Risques', icon: AlertTriangle },
    { id: 'compliance', title: 'Conformités', icon: FileText }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modifier le Projet</h1>
          <p className="text-muted-foreground">
            {formData.title || 'Projet sans nom'}
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <TabsTrigger key={step.id} value={step.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{step.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Titre du projet</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateFormData({ title: e.target.value })}
                    placeholder="Nom du projet"
                  />
                </div>
                <div>
                  <Label>Budget (MRU)</Label>
                  <Input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateFormData({ budget: e.target.value })}
                    placeholder="Budget total"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData({ description: e.target.value })}
                  placeholder="Description du projet"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => updateFormData({ status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planification</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvé</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData({ startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData({ endDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders - Distinguish Internal vs External */}
        <TabsContent value="stakeholders">
          <div className="space-y-6">
            {/* Internal Team */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Équipe Interne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Project Manager */}
                <div>
                  <Label>Chef de Projet</Label>
                  {formData.delegation?.projectManager ? (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          PM
                        </div>
                        <div>
                          <p className="font-medium">Chef de Projet</p>
                          <p className="text-sm text-muted-foreground">ID: {formData.delegation.projectManager}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Modifier le Chef de Projet</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <EmployeeSelector
                                value={formData.delegation.projectManager}
                                onChange={(employeeId) => 
                                  updateFormData({ 
                                    delegation: { ...formData.delegation, projectManager: employeeId }
                                  })
                                }
                              />
                              <DialogClose asChild>
                                <Button className="w-full">Confirmer</Button>
                              </DialogClose>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateFormData({ 
                            delegation: { ...formData.delegation, projectManager: '' }
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-dashed">
                          <Plus className="h-4 w-4 mr-2" />
                          Assigner un Chef de Projet
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Sélectionner un Chef de Projet</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <EmployeeSelector
                            value=""
                            onChange={(employeeId) => 
                              updateFormData({ 
                                delegation: { ...formData.delegation, projectManager: employeeId }
                              })
                            }
                          />
                          <DialogClose asChild>
                            <Button className="w-full">Confirmer</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Other Team Members */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Autres Membres d'Équipe</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter Membre
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un Membre d'Équipe</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Rôle</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="technicalManager">Responsable Technique</SelectItem>
                                <SelectItem value="supervisor">Superviseur</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <EmployeeSelector
                            value=""
                            onChange={() => {}}
                          />
                          <DialogClose asChild>
                            <Button className="w-full">Ajouter</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {Object.entries(formData.delegation || {})
                    .filter(([key, value]) => key !== 'projectManager' && value)
                    .map(([role, employeeId]) => (
                      <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {role.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {role === 'technicalManager' ? 'Responsable Technique' : 
                               role === 'supervisor' ? 'Superviseur' : 'Client'}
                            </p>
                            <p className="text-sm text-muted-foreground">ID: {String(employeeId)}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => updateFormData({ 
                            delegation: { ...formData.delegation, [role]: '' }
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                  {(!formData.delegation || Object.entries(formData.delegation)
                    .filter(([key, value]) => key !== 'projectManager' && value).length === 0) && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun autre membre d'équipe</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* External Stakeholders */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-orange-600" />
                  Parties Prenantes Externes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Fournisseurs & Contractants</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Ajouter Fournisseur
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <SimpleSupplierSelector
                            value=""
                            onChange={(supplierId) => {
                              if (supplierId) {
                                const currentStakeholders = formData.stakeholders || [];
                                updateFormData({
                                  stakeholders: [...currentStakeholders, {
                                    id: `stakeholder_${Date.now()}`,
                                    name: 'Nouveau Fournisseur',
                                    type: 'supplier',
                                    stakeholder_entity_type: 'supplier',
                                    stakeholder_id: supplierId
                                  }]
                                });
                              }
                            }}
                          />
                          <DialogClose asChild>
                            <Button className="w-full">Ajouter</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {formData.stakeholders && formData.stakeholders.filter((s: any) => s.stakeholder_entity_type === 'supplier').length > 0 ? (
                    <div className="space-y-2">
                      {formData.stakeholders.filter((s: any) => s.stakeholder_entity_type === 'supplier').map((stakeholder: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              S
                            </div>
                            <div>
                              <p className="font-medium">{stakeholder.name || 'Fournisseur'}</p>
                              <p className="text-sm text-muted-foreground">Type: {stakeholder.type || 'Fournisseur'}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              const updatedStakeholders = formData.stakeholders?.filter((_, i) => i !== index) || [];
                              updateFormData({ stakeholders: updatedStakeholders });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun fournisseur externe ajouté</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Phases with CRUD Management */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Phases de Construction ({formData.phases?.length || 0})
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const newPhase = {
                      id: `phase_${Date.now()}`,
                      title: `Phase ${(formData.phases?.length || 0) + 1}`,
                      description: '',
                      startDate: '',
                      endDate: '',
                      status: 'not_started',
                      budget: 0,
                      progress: 0
                    };
                    updateFormData({
                      phases: [...(formData.phases || []), newPhase]
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Phase
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.phases && formData.phases.length > 0 ? (
                <div className="space-y-4">
                  {formData.phases.map((phase, index) => (
                    <Card key={phase.id || index} className="border-l-4 border-l-indigo-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Input 
                                value={phase.title || `Phase ${index + 1}`}
                                onChange={(e) => {
                                  const updatedPhases = [...(formData.phases || [])];
                                  updatedPhases[index] = { ...phase, title: e.target.value };
                                  updateFormData({ phases: updatedPhases });
                                }}
                                className="font-medium border-none p-0 h-auto text-base focus-visible:ring-0"
                              />
                              <Badge variant={
                                phase.status === 'completed' ? 'default' : 
                                phase.status === 'in_progress' ? 'secondary' : 
                                phase.status === 'delayed' ? 'destructive' : 'outline'
                              }>
                                {phase.status === 'completed' ? 'Terminé' :
                                 phase.status === 'in_progress' ? 'En cours' :
                                 phase.status === 'delayed' ? 'Retardé' : 'Non commencé'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{phase.description || 'Aucune description'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Détails & CRUD
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Gestion Détaillée - {phase.title}</DialogTitle>
                                </DialogHeader>
                                
                                <Tabs defaultValue="info" className="w-full">
                                  <TabsList className="grid w-full grid-cols-6">
                                    <TabsTrigger value="info">Infos</TabsTrigger>
                                    <TabsTrigger value="materials">Matériaux</TabsTrigger>
                                    <TabsTrigger value="tasks">Tâches</TabsTrigger>
                                    <TabsTrigger value="payments">Paiements</TabsTrigger>
                                    <TabsTrigger value="documents">Documents</TabsTrigger>
                                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                                  </TabsList>
                                  
                                  <TabsContent value="info" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Titre de la phase</Label>
                                        <Input 
                                          value={phase.title} 
                                          onChange={(e) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, title: e.target.value };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label>Statut</Label>
                                        <Select 
                                          value={phase.status} 
                                          onValueChange={(value) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, status: value };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="not_started">Non commencé</SelectItem>
                                            <SelectItem value="in_progress">En cours</SelectItem>
                                            <SelectItem value="completed">Terminé</SelectItem>
                                            <SelectItem value="delayed">Retardé</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label>Description</Label>
                                      <Textarea 
                                        value={phase.description} 
                                        onChange={(e) => {
                                          const updatedPhases = [...(formData.phases || [])];
                                          updatedPhases[index] = { ...phase, description: e.target.value };
                                          updateFormData({ phases: updatedPhases });
                                        }}
                                      />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label>Date de début</Label>
                                        <Input 
                                          type="date" 
                                          value={phase.startDate} 
                                          onChange={(e) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, startDate: e.target.value };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label>Date de fin</Label>
                                        <Input 
                                          type="date" 
                                          value={phase.endDate} 
                                          onChange={(e) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, endDate: e.target.value };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label>Budget (MRU)</Label>
                                        <Input 
                                          type="number" 
                                          value={phase.budget} 
                                          onChange={(e) => {
                                            const updatedPhases = [...(formData.phases || [])];
                                            updatedPhases[index] = { ...phase, budget: parseFloat(e.target.value) || 0 };
                                            updateFormData({ phases: updatedPhases });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </TabsContent>
                                  
                                  <TabsContent value="materials">
                                    {phase.id && initialData?.id && (
                                      <PhaseMaterials 
                                        phaseId={phase.id} 
                                        projectId={initialData.id} 
                                      />
                                    )}
                                  </TabsContent>
                                  
                                  <TabsContent value="tasks">
                                    {phase.id && initialData?.id && (
                                      <PhaseTasks 
                                        phaseId={phase.id} 
                                        projectId={initialData.id} 
                                      />
                                    )}
                                  </TabsContent>
                                  
                                  <TabsContent value="payments">
                                    {phase.id && initialData?.id && (
                                      <PhasePayments 
                                        phaseId={phase.id} 
                                        projectId={initialData.id} 
                                      />
                                    )}
                                  </TabsContent>
                                  
                                  <TabsContent value="documents">
                                    {phase.id && initialData?.id && (
                                      <PhaseDocuments 
                                        phaseId={phase.id} 
                                        projectId={initialData.id} 
                                      />
                                    )}
                                  </TabsContent>
                                  
                                  <TabsContent value="notifications">
                                    <div className="space-y-4">
                                      <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-3">Paramètres de Notification</h4>
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <Label>Notifications d'avancement</Label>
                                            <Checkbox />
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <Label>Alertes de retard</Label>
                                            <Checkbox />
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <Label>Rappels de tâches</Label>
                                            <Checkbox />
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <Label>Notifications de paiement</Label>
                                            <Checkbox />
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="p-4 border rounded-lg">
                                        <h4 className="font-medium mb-3">Auto-sauvegarde</h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                          Les modifications sont automatiquement sauvegardées toutes les 30 secondes
                                        </p>
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                          <span className="text-sm text-green-600">Sauvegarde active</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const updatedPhases = formData.phases?.filter((_, i) => i !== index) || [];
                                updateFormData({ phases: updatedPhases });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Dates</p>
                            <p>{phase.startDate || 'Non définie'} → {phase.endDate || 'Non définie'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p>{phase.budget?.toLocaleString() || '0'} MRU</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Progression</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${phase.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-xs">{phase.progress || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Aucune phase définie</h3>
                  <p className="text-sm mb-4">Commencez par ajouter des phases pour structurer votre projet</p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const newPhase = {
                        id: `phase_${Date.now()}`,
                        title: 'Phase 1',
                        description: '',
                        startDate: '',
                        endDate: '',
                        status: 'not_started',
                        budget: 0,
                        progress: 0
                      };
                      updateFormData({ phases: [newPhase] });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter la première phase
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geolocation */}
        <TabsContent value="geolocation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Géolocalisation & Cartographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Adresse du Projet</Label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => updateFormData({ location: e.target.value })}
                    placeholder="Adresse complète du projet"
                  />
                </div>
                <div className="h-64 border rounded-lg flex items-center justify-center text-muted-foreground">
                  Carte interactive (à implémenter)
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Management */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gestion des Risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => {
                    const risk = prompt('Description du risque:');
                    if (risk) {
                      updateFormData({
                        risks: [...(formData.risks || []), {
                          id: Date.now(),
                          description: risk,
                          severity: 'medium',
                          status: 'identified'
                        }]
                      });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Risque
                </Button>
                <div className="space-y-2">
                  {(formData.risks || []).map((risk: any) => (
                    <div key={risk.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{risk.description}</span>
                        <Badge variant={risk.severity === 'high' ? 'destructive' : 'outline'}>
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conformités & Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">Documents de Conformité</Label>
                  <div className="space-y-2">
                    {['Permis de construire', 'Étude d\'impact', 'Validation technique'].map((doc) => (
                      <div key={doc} className="flex items-center space-x-2">
                        <Checkbox />
                        <span>{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Notes de Validation</Label>
                  <Textarea
                    value={formData.validationNotes || ''}
                    onChange={(e) => updateFormData({ validationNotes: e.target.value })}
                    placeholder="Notes et commentaires de validation..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;
