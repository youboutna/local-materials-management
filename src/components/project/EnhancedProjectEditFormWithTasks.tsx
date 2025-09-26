import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Building, Users, Calendar, MapPin, AlertTriangle, FileText, Package,
  Plus, Edit2, Trash2, Save, Settings, Clock, DollarSign, Upload,
  User, Phone, Mail, Building2, UserCheck, Layers, Target, Shield,
  FileCheck, CheckCircle
} from 'lucide-react';

// Import existing components
import LocationSelector from '@/components/location/LocationSelector';
import WarehouseShapeTracer from '@/components/materials/WarehouseShapeTracer';
import MaterialLocationMap from '@/components/materials/MaterialLocationMap';
import UserSelector from '@/components/selectors/UserSelector';
import EmployeeSelector from '@/components/selectors/EmployeeSelector';
import SimpleSupplierSelector from '@/components/selectors/SimpleSupplierSelector';
import PhaseMaterials from './PhaseMaterials';
import PhaseTasks from './PhaseTasks';
import PhasePayments from './PhasePayments';
import PhaseDocuments from './PhaseDocuments';

interface EnhancedProjectEditFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onFormDataChange?: (data: any) => void;
}

const EnhancedProjectEditFormWithTasks: React.FC<EnhancedProjectEditFormProps> = ({
  initialData,
  onSubmit,
  onFormDataChange
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Dialog states
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Define workflow steps
  const workflowSteps = [
    {
      id: 'basic',
      title: 'Informations Générales',
      icon: Building,
      description: 'Données de base du projet (titre, description, budget)',
      color: 'bg-blue-500'
    },
    {
      id: 'stakeholders',
      title: 'Parties Prenantes',
      icon: Users,
      description: 'Configuration des acteurs et responsabilités',
      color: 'bg-green-500'
    },
    {
      id: 'team',
      title: 'Équipe & Contractants',
      icon: UserCheck,
      description: 'Assignment des ressources humaines et fournisseurs',
      color: 'bg-orange-500'
    },
    {
      id: 'phases',
      title: 'Phases & Planification',
      icon: Layers,
      description: 'Structure des phases et chronologie',
      color: 'bg-indigo-500'
    },
    {
      id: 'geolocation',
      title: 'Géolocalisation & Cartographie',
      icon: MapPin,
      description: 'Localisation précise et délimitation des zones',
      color: 'bg-cyan-500'
    },
    {
      id: 'resources',
      title: 'Ressources & Matériaux',
      icon: Shield,
      description: 'Sélection des matériaux et organisation',
      color: 'bg-purple-500'
    },
    {
      id: 'risks',
      title: 'Gestion des Risques',
      icon: AlertTriangle,
      description: 'Analyse et mitigation des risques projet',
      color: 'bg-red-500'
    },
    {
      id: 'compliance',
      title: 'Conformités & Validation',
      icon: FileCheck,
      description: 'Respect des normes et validation finale',
      color: 'bg-teal-500'
    }
  ];

  const updateFormData = (updates: any) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onFormDataChange?.(newData);
  };

  const getStepProgress = () => {
    return (completedSteps.length / workflowSteps.length) * 100;
  };

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

  // Save current step data before switching
  const saveCurrentStep = () => {
    if (formData && Object.keys(formData).length > 0) {
      onFormDataChange?.(formData);
      toast({
        title: "Données sauvegardées",
        description: "Les modifications ont été sauvegardées automatiquement.",
      });
    }
  };

  // Handle tab change with auto-save
  const handleTabChange = (newTab: string) => {
    saveCurrentStep();
    setActiveTab(newTab);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast({
        title: "Projet mis à jour",
        description: "Le projet a été mis à jour avec succès",
      });
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back or reset form
    window.history.back();
  };

  const addStakeholder = (type: 'manager' | 'team' | 'supplier', stakeholder: any) => {
    const currentStakeholders = formData.stakeholders || { managers: [], team: [], suppliers: [] };
    updateFormData({
      stakeholders: {
        ...currentStakeholders,
        [type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers']: [
          ...currentStakeholders[type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers'],
          stakeholder
        ]
      }
    });
  };

  const removeStakeholder = (type: 'manager' | 'team' | 'supplier', index: number) => {
    const currentStakeholders = formData.stakeholders || { managers: [], team: [], suppliers: [] };
    const typeKey = type === 'manager' ? 'managers' : type === 'team' ? 'team' : 'suppliers';
    const updated = [...currentStakeholders[typeKey]];
    updated.splice(index, 1);
    updateFormData({
      stakeholders: {
        ...currentStakeholders,
        [typeKey]: updated
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Édition du Projet</h2>
          <p className="text-muted-foreground">
            Modifiez les détails et paramètres du projet
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveCurrentStep} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">
              Édition du Projet
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedSteps.length}/{workflowSteps.length} étapes
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </CardHeader>
      </Card>

      <div className="flex gap-6">
        {/* Left Sidebar Steps */}
        <div className="w-80 space-y-3">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = isStepCompleted(step.id);
            const isActive = activeTab === step.id;
            
            return (
              <motion.div
                key={step.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all duration-200 ${
                    isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                  } ${isCompleted ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => handleTabChange(step.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${step.color} text-white relative flex-shrink-0`}>
                        <Icon className="h-5 w-5" />
                        {isCompleted && (
                          <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{step.title}</h3>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Basic Information */}
          {activeTab === "basic" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom du Projet *</Label>
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => updateFormData({ name: e.target.value })}
                        placeholder="Nom du projet"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ''}
                        onChange={(e) => updateFormData({ description: e.target.value })}
                        placeholder="Description du projet"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status || ''}
                        onValueChange={(value) => updateFormData({ status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planification</SelectItem>
                          <SelectItem value="active">En cours</SelectItem>
                          <SelectItem value="on_hold">En attente</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="budget">Budget (€)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget || ''}
                        onChange={(e) => updateFormData({ budget: e.target.value })}
                        placeholder="Budget total"
                      />
                    </div>

                    <div>
                      <Label htmlFor="start_date">Date de Début</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date || ''}
                        onChange={(e) => updateFormData({ start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="end_date">Date de Fin Prévue</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date || ''}
                        onChange={(e) => updateFormData({ end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stakeholders */}
          {activeTab === "stakeholders" && (
            <div className="space-y-6">
              {/* Internal Stakeholders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Parties Prenantes Internes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Project Managers */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">Chefs de Projet</Label>
                        <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajouter un Chef de Projet</DialogTitle>
                            </DialogHeader>
                            <EmployeeSelector
                              value=""
                              onChange={(employeeId) => {
                                // Find employee details and add to stakeholders
                                addStakeholder('manager', { id: employeeId, name: 'Manager', role: 'Project Manager' });
                                setIsManagerDialogOpen(false);
                              }}
                              placeholder="Sélectionner un employé"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="grid gap-3">
                        {(formData.stakeholders?.managers || []).map((manager: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{manager.name?.charAt(0) || 'M'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{manager.name}</p>
                                <p className="text-sm text-muted-foreground">{manager.role}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder('manager', index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Team Members */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">Équipe Interne</Label>
                        <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Ajouter
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajouter un Membre d'Équipe</DialogTitle>
                            </DialogHeader>
                            <EmployeeSelector
                              value=""
                              onChange={(employeeId) => {
                                // Find employee details and add to stakeholders
                                addStakeholder('team', { id: employeeId as string, name: 'Team Member', department: 'Department' });
                                setIsTeamDialogOpen(false);
                              }}
                              placeholder="Sélectionner un employé"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="grid gap-3">
                        {(formData.stakeholders?.team || []).map((member: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{member.name?.charAt(0) || 'T'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.department}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeStakeholder('team', index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* External Stakeholders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Parties Prenantes Externes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Fournisseurs / Contractants</Label>
                      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                          </DialogHeader>
                          <SimpleSupplierSelector
                            value=""
                            onChange={(supplierId) => {
                              // Find supplier details and add to stakeholders
                              addStakeholder('supplier', { id: supplierId, name: 'Supplier', type: 'Fournisseur' });
                              setIsSupplierDialogOpen(false);
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid gap-3">
                      {(formData.stakeholders?.suppliers || []).map((supplier: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{supplier.name?.charAt(0) || 'S'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{supplier.name}</p>
                              <p className="text-sm text-muted-foreground">{supplier.type}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStakeholder('supplier', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Geolocation */}
          {activeTab === "geolocation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Géolocalisation & Cartographie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <LocationSelector
                    value={formData.location || {}}
                    onChange={(location) => updateFormData({ location })}
                  />
                  <WarehouseShapeTracer
                    value={formData.shapes || []}
                    onChange={(shapes) => updateFormData({ shapes })}
                  />
                  {formData.selectedMaterial && (
                    <MaterialLocationMap
                      material={formData.selectedMaterial}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Ressources & Matériaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhaseMaterials
                  phaseId={selectedPhaseId || 'default'}
                  projectId={formData.id || 'default'}
                />
              </CardContent>
            </Card>
          )}

          {/* Team Management */}
          {activeTab === "team" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Équipe & Contractants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Équipe de Projet</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Gérez les membres de l'équipe et leurs rôles
                    </p>
                    {/* Team management content */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Phases */}
          {activeTab === "phases" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Phases & Planification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Phases du Projet</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Structure des phases et chronologie
                    </p>
                    {/* Phases management content */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk Management */}
          {activeTab === "risks" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Gestion des Risques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Analyse des Risques</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Identification et mitigation des risques projet
                    </p>
                    {/* Risk management content */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance */}
          {activeTab === "compliance" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5" />
                  Conformités & Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium">Conformité Réglementaire</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Respect des normes et validation finale
                    </p>
                    {/* Compliance content */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Les modifications sont sauvegardées automatiquement
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                <Target className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Sauvegarde en cours...' : 'Sauvegarder les Modifications'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;