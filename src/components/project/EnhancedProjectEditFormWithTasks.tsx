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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Building, Users, Calendar, MapPin, AlertTriangle, FileText, Package,
  Plus, Edit2, Trash2, Save, Settings, Clock, DollarSign, Upload,
  User, Phone, Mail, Building2, UserCheck, Layers, Target
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
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateFormData = (updates: any) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onFormDataChange?.(newData);
  };

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
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Général
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parties Prenantes
          </TabsTrigger>
          <TabsTrigger value="phases" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="geolocation" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localisation
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Matériaux
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risques
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Conformité
          </TabsTrigger>
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
        </TabsContent>

        {/* Stakeholders */}
        <TabsContent value="stakeholders">
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
                              addStakeholder('team', { id: employeeId, name: 'Team Member', department: 'Department' });
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
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                            {supplier.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">{supplier.type || 'Fournisseur'}</p>
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
        </TabsContent>

        {/* Phases Management */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gestion des Phases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(formData.phases || []).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Aucune phase définie</h3>
                    <p className="text-muted-foreground mb-4">
                      Ajoutez des phases pour structurer votre projet
                    </p>
                    <Button onClick={() => {
                      const newPhase = {
                        id: Date.now().toString(),
                        name: 'Nouvelle Phase',
                        status: 'planning',
                        progress: 0
                      };
                      updateFormData({
                        phases: [...(formData.phases || []), newPhase]
                      });
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer la première phase
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        const newPhase = {
                          id: Date.now().toString(),
                          name: 'Nouvelle Phase',
                          status: 'planning',
                          progress: 0
                        };
                        updateFormData({
                          phases: [...(formData.phases || []), newPhase]
                        });
                      }}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter une Phase
                    </Button>

                    {(formData.phases || []).map((phase: any, index: number) => (
                      <Card key={phase.id || index} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Input
                                value={phase.name || ''}
                                onChange={(e) => {
                                  const updatedPhases = [...(formData.phases || [])];
                                  updatedPhases[index] = { ...phase, name: e.target.value };
                                  updateFormData({ phases: updatedPhases });
                                }}
                                className="font-medium text-lg border-none p-0 h-auto focus-visible:ring-0"
                              />
                              <Badge variant={phase.status === 'completed' ? 'default' : 'secondary'}>
                                {phase.status === 'completed' ? 'Terminée' : 
                                 phase.status === 'active' ? 'En cours' : 'Planifiée'}
                              </Badge>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails de la Phase: {phase.name}</DialogTitle>
                                </DialogHeader>
                                <Tabs defaultValue="materials" className="w-full">
                                  <TabsList>
                                    <TabsTrigger value="materials">Matériaux</TabsTrigger>
                                    <TabsTrigger value="tasks">Tâches</TabsTrigger>
                                    <TabsTrigger value="payments">Paiements</TabsTrigger>
                                    <TabsTrigger value="documents">Documents</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="materials">
                                    <PhaseMaterials
                                      phaseId={phase.id}
                                      projectId={formData.id || ''}
                                    />
                                  </TabsContent>
                                  <TabsContent value="tasks">
                                    <PhaseTasks
                                      phaseId={phase.id}
                                      projectId={formData.id || ''}
                                    />
                                  </TabsContent>
                                  <TabsContent value="payments">
                                    <PhasePayments
                                      phaseId={phase.id}
                                      projectId={formData.id || ''}
                                    />
                                  </TabsContent>
                                  <TabsContent value="documents">
                                    <PhaseDocuments
                                      phaseId={phase.id}
                                      projectId={formData.id || ''}
                                    />
                                  </TabsContent>
                                </Tabs>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources & Materials */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Matériaux du Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    const newMaterial = {
                      id: Date.now().toString(),
                      name: 'Nouveau Matériau',
                      quantity: 1,
                      unit: 'unité'
                    };
                    updateFormData({
                      materials: [...(formData.materials || []), newMaterial]
                    });
                  }}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un Matériau
                </Button>

                <div className="grid gap-4">
                  {(formData.materials || []).map((material: any, index: number) => (
                    <div key={material.id || index} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Nom</Label>
                          <Input
                            value={material.name || ''}
                            onChange={(e) => {
                              const updatedMaterials = [...(formData.materials || [])];
                              updatedMaterials[index] = { ...material, name: e.target.value };
                              updateFormData({ materials: updatedMaterials });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            value={material.quantity || ''}
                            onChange={(e) => {
                              const updatedMaterials = [...(formData.materials || [])];
                              updatedMaterials[index] = { ...material, quantity: e.target.value };
                              updateFormData({ materials: updatedMaterials });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Unité</Label>
                          <Input
                            value={material.unit || ''}
                            onChange={(e) => {
                              const updatedMaterials = [...(formData.materials || [])];
                              updatedMaterials[index] = { ...material, unit: e.target.value };
                              updateFormData({ materials: updatedMaterials });
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedMaterials = [...(formData.materials || [])];
                              updatedMaterials.splice(index, 1);
                              updateFormData({ materials: updatedMaterials });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geolocation & Mapping */}
        <TabsContent value="geolocation">
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
                  value={{
                    latitude: formData.coordinates_latitude,
                    longitude: formData.coordinates_longitude,
                    address: formData.location
                  }}
                  onChange={(location) => updateFormData({
                    coordinates_latitude: location.latitude,
                    coordinates_longitude: location.longitude,
                    location: location.address
                  })}
                />
                
                {formData.coordinates_latitude && formData.coordinates_longitude && (
                  <div className="mt-4">
                    <Label className="text-base font-medium mb-3 block">Délimitation de Zone</Label>
                    <WarehouseShapeTracer
                      value={formData.projectBounds || []}
                      onChange={(bounds) => updateFormData({ projectBounds: bounds })}
                      title="Délimitation du Projet"
                    />
                  </div>
                )}
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

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          Les modifications sont sauvegardées automatiquement
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              // Navigate back without submitting
              window.history.back();
            }}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Finalisation...' : 'Finaliser les Modifications'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProjectEditFormWithTasks;