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
  const [activeTab, setActiveTab] = useState('basic');
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

      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="w-64 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeTab === "basic" ? "default" : "outline"}
              onClick={() => handleTabChange("basic")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Building className="h-6 w-6 text-blue-500" />
              <div className="text-center">
                <div className="font-medium">Informations</div>
                <div className="font-medium">Générales</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "stakeholders" ? "default" : "outline"}
              onClick={() => handleTabChange("stakeholders")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Users className="h-6 w-6 text-green-500" />
              <div className="text-center">
                <div className="font-medium">Parties</div>
                <div className="font-medium">Prenantes</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "geolocation" ? "default" : "outline"}
              onClick={() => handleTabChange("geolocation")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <MapPin className="h-6 w-6 text-cyan-500" />
              <div className="text-center">
                <div className="font-medium">Géolocalisation</div>
                <div className="font-medium">& Cartographie</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "resources" ? "default" : "outline"}
              onClick={() => handleTabChange("resources")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Package className="h-6 w-6 text-purple-500" />
              <div className="text-center">
                <div className="font-medium">Resources</div>
                <div className="font-medium">& Matériaux</div>
              </div>
            </Button>
          </div>
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
                    onShapeComplete={(shape) => updateFormData({ shapes: [...(formData.shapes || []), shape] })}
                  />
                  <MaterialLocationMap
                    materials={formData.materials || []}
                    onMaterialUpdate={(materials) => updateFormData({ materials })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resources */}
          {activeTab === "resources" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Ressources & Matériaux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhaseMaterials
                  phaseId={selectedPhaseId || 'default'}
                  materials={formData.materials || []}
                  onMaterialsChange={(materials) => updateFormData({ materials })}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-64 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={activeTab === "phases" ? "default" : "outline"}
              onClick={() => handleTabChange("phases")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Calendar className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <div className="font-medium">Équipe</div>
                <div className="font-medium">& Contractants</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "risks" ? "default" : "outline"}
              onClick={() => handleTabChange("risks")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div className="text-center">
                <div className="font-medium">Gestion</div>
                <div className="font-medium">des Risques</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "planning" ? "default" : "outline"}
              onClick={() => handleTabChange("planning")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <Layers className="h-6 w-6 text-indigo-500" />
              <div className="text-center">
                <div className="font-medium">Phases</div>
                <div className="font-medium">& Planification</div>
              </div>
            </Button>
            <Button
              variant={activeTab === "compliance" ? "default" : "outline"}
              onClick={() => handleTabChange("compliance")}
              className="h-20 flex flex-col items-center justify-center gap-2 text-xs"
            >
              <FileText className="h-6 w-6 text-teal-500" />
              <div className="text-center">
                <div className="font-medium">Conformités</div>
                <div className="font-medium">& Validation</div>
              </div>
            </Button>
          </div>
        </div>
      </div>

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