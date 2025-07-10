
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, Package, CreditCard, Plus, Edit, Trash2, Clock, CheckCircle, MapPin, Building } from 'lucide-react';
import { ConstructionPhase, ConstructionStage } from '@/types/project';
import MaterialFormSection from '@/components/MaterialFormSection';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import { MAURITANIA_REGIONS } from '@/types/mauritania';

interface PhaseResource {
  id: string;
  type: 'material' | 'human' | 'equipment';
  resourceId: string;
  resourceName: string;
  quantity: number;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
}

interface PhasePayment {
  id: string;
  description: string;
  plannedAmount: number;
  actualAmount?: number;
  plannedDate: string;
  actualDate?: string;
  status: 'pending' | 'completed' | 'overdue';
  paymentMethod?: string;
}

interface PhaseSupplier {
  id: string;
  supplierId?: string;
  name: string;
  contact: string;
  category: string;
  leadTime: number;
  estimatedCost: number;
  actualCost?: number;
  status: 'selected' | 'contracted' | 'working' | 'completed';
}

interface PhaseHumanResource {
  id: string;
  employeeId?: string;
  name: string;
  role: string;
  dailyRate: number;
  estimatedDays: number;
  actualDays?: number;
  skills: string[];
  startDate?: string;
  endDate?: string;
  status: 'assigned' | 'working' | 'completed';
}

interface ConstructionPhaseData {
  phase: ConstructionPhase;
  stage: ConstructionStage;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  actualCost: number;
  resources: PhaseResource[];
  payments: PhasePayment[];
  suppliers: PhaseSupplier[];
  humanResources: PhaseHumanResource[];
  materials: {materialId: string; quantity: number}[];
  location: {
    region: string;
    coordinates?: {latitude: number; longitude: number};
    address?: string;
    notes?: string;
  };
  progress: number;
  notes?: string;
}

interface ConstructionPhaseManagerProps {
  phases: ConstructionPhaseData[];
  onChange: (phases: ConstructionPhaseData[]) => void;
  projectBudget?: number;
}

const CONSTRUCTION_PHASES: { value: ConstructionPhase; label: string; description: string }[] = [
  { value: 'pre_construction', label: 'Pré-construction', description: 'Planification et conception' },
  { value: 'site_preparation', label: 'Préparation du site', description: 'Nettoyage et terrassement' },
  { value: 'foundation', label: 'Fondation', description: 'Travaux de fondation' },
  { value: 'framing', label: 'Charpente', description: 'Structure principale' },
  { value: 'structural_work', label: 'Gros œuvre', description: 'Travaux structurels' },
  { value: 'finishing', label: 'Finitions', description: 'Travaux de finition' },
  { value: 'post_construction', label: 'Post-construction', description: 'Inspections finales' },
  { value: 'handover', label: 'Livraison', description: 'Remise des clés' }
];

const ConstructionPhaseManager: React.FC<ConstructionPhaseManagerProps> = ({
  phases,
  onChange,
  projectBudget = 0
}) => {
  const [selectedPhase, setSelectedPhase] = useState<ConstructionPhaseData | null>(null);
  const [selectedPhaseIndex, setSelectedPhaseIndex] = useState<number>(-1);

  const handleAddPhase = () => {
    const newPhase: ConstructionPhaseData = {
      phase: 'pre_construction',
      stage: 'planning_design',
      title: 'Nouvelle phase',
      description: '',
      startDate: '',
      endDate: '',
      estimatedDuration: 7,
      status: 'not_started',
      budget: 0,
      actualCost: 0,
      resources: [],
      payments: [],
      suppliers: [],
      humanResources: [],
      materials: [],
      location: {
        region: 'Nouakchott',
        coordinates: undefined,
        address: '',
        notes: ''
      },
      progress: 0,
      notes: ''
    };
    
    onChange([...phases, newPhase]);
  };

  const handleUpdatePhase = (index: number, updatedPhase: ConstructionPhaseData) => {
    const newPhases = [...phases];
    newPhases[index] = updatedPhase;
    onChange(newPhases);
  };

  const handleDeletePhase = (index: number) => {
    const newPhases = phases.filter((_, i) => i !== index);
    onChange(newPhases);
  };

  const addSupplierToPhase = (phaseIndex: number, supplier: PhaseSupplier) => {
    const phase = phases[phaseIndex];
    const updatedPhase = {
      ...phase,
      suppliers: [...phase.suppliers, supplier]
    };
    handleUpdatePhase(phaseIndex, updatedPhase);
  };

  const addHumanResourceToPhase = (phaseIndex: number, resource: PhaseHumanResource) => {
    const phase = phases[phaseIndex];
    const updatedPhase = {
      ...phase,
      humanResources: [...phase.humanResources, resource]
    };
    handleUpdatePhase(phaseIndex, updatedPhase);
  };

  const getTotalBudget = () => {
    return phases.reduce((total, phase) => total + phase.budget, 0);
  };

  const getTotalActualCost = () => {
    return phases.reduce((total, phase) => total + phase.actualCost, 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'delayed':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-800">
            <Calendar className="h-5 w-5" />
            Gestion des phases de construction
          </div>
          <Button onClick={handleAddPhase} size="sm" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une phase
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Budget Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Budget total planifié</p>
            <p className="text-lg font-bold text-orange-600">{getTotalBudget().toLocaleString()} MRO</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Coût réel total</p>
            <p className="text-lg font-bold text-blue-600">{getTotalActualCost().toLocaleString()} MRO</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Budget projet</p>
            <p className="text-lg font-bold text-gray-600">{projectBudget.toLocaleString()} MRO</p>
          </div>
        </div>

        {/* Phases List */}
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <Card key={index} className="border-l-4 border-l-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(phase.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{phase.title}</h3>
                      <p className="text-sm text-gray-600">
                        {CONSTRUCTION_PHASES.find(p => p.value === phase.phase)?.label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{phase.location.region}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(phase.status)}>
                      {phase.status === 'not_started' ? 'Non démarré' :
                       phase.status === 'in_progress' ? 'En cours' :
                       phase.status === 'completed' ? 'Terminé' : 'Retardé'}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedPhase(phase);
                            setSelectedPhaseIndex(index);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Gérer
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Gestion de la phase: {phase.title}</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="general" className="space-y-4">
                          <TabsList className="grid w-full grid-cols-7 gap-1 h-auto p-1">
                            <TabsTrigger value="general" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <Calendar className="h-4 w-4" />
                              Général
                            </TabsTrigger>
                            <TabsTrigger value="location" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <MapPin className="h-4 w-4" />
                              Localisation
                            </TabsTrigger>
                            <TabsTrigger value="materials" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <Package className="h-4 w-4" />
                              Matériaux
                            </TabsTrigger>
                            <TabsTrigger value="suppliers" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <Building className="h-4 w-4" />
                              Fournisseurs
                            </TabsTrigger>
                            <TabsTrigger value="human" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <Users className="h-4 w-4" />
                              Ressources
                            </TabsTrigger>
                            <TabsTrigger value="payments" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <CreditCard className="h-4 w-4" />
                              Paiements
                            </TabsTrigger>
                            <TabsTrigger value="progress" className="flex flex-col items-center gap-1 p-2 text-xs">
                              <CheckCircle className="h-4 w-4" />
                              Suivi
                            </TabsTrigger>
                          </TabsList>

                          {/* General Tab */}
                          <TabsContent value="general" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Titre de la phase</Label>
                                <Input
                                  value={phase.title}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, title: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Statut</Label>
                                <Select
                                  value={phase.status}
                                  onValueChange={(value: any) => handleUpdatePhase(index, { ...phase, status: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="not_started">Non démarré</SelectItem>
                                    <SelectItem value="in_progress">En cours</SelectItem>
                                    <SelectItem value="completed">Terminé</SelectItem>
                                    <SelectItem value="delayed">Retardé</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Date de début</Label>
                                <Input
                                  type="date"
                                  value={phase.startDate}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, startDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Date de fin</Label>
                                <Input
                                  type="date"
                                  value={phase.endDate}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, endDate: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>Budget (MRO)</Label>
                                <Input
                                  type="number"
                                  value={phase.budget}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, budget: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                              <div>
                                <Label>Coût réel (MRO)</Label>
                                <Input
                                  type="number"
                                  value={phase.actualCost}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, actualCost: parseFloat(e.target.value) || 0 })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={phase.description}
                                onChange={(e) => handleUpdatePhase(index, { ...phase, description: e.target.value })}
                                rows={3}
                              />
                            </div>
                          </TabsContent>

                          {/* Location Tab */}
                          <TabsContent value="location" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Région</Label>
                                <Select
                                  value={phase.location.region}
                                  onValueChange={(value) => handleUpdatePhase(index, { 
                                    ...phase, 
                                    location: { ...phase.location, region: value }
                                  })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {MAURITANIA_REGIONS.map((region) => (
                                      <SelectItem key={region.code} value={region.name}>
                                        {region.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Adresse</Label>
                                <Input
                                  value={phase.location.address || ''}
                                  onChange={(e) => handleUpdatePhase(index, { 
                                    ...phase, 
                                    location: { ...phase.location, address: e.target.value }
                                  })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Notes de localisation</Label>
                              <Textarea
                                value={phase.location.notes || ''}
                                onChange={(e) => handleUpdatePhase(index, { 
                                  ...phase, 
                                  location: { ...phase.location, notes: e.target.value }
                                })}
                                rows={3}
                                placeholder="Instructions d'accès, particularités du site, etc."
                              />
                            </div>
                          </TabsContent>

                          {/* Materials Tab */}
                          <TabsContent value="materials" className="space-y-4">
                            <MaterialFormSection
                              selectedMaterials={phase.materials}
                              onChange={(materials) => handleUpdatePhase(index, { ...phase, materials })}
                              projectBudget={phase.budget}
                            />
                          </TabsContent>

                          {/* Suppliers Tab */}
                          <TabsContent value="suppliers" className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Fournisseurs et contractants</h4>
                                <Button
                                  onClick={() => {
                                    const newSupplier: PhaseSupplier = {
                                      id: `supplier_${Date.now()}`,
                                      name: '',
                                      contact: '',
                                      category: '',
                                      leadTime: 7,
                                      estimatedCost: 0,
                                      status: 'selected'
                                    };
                                    addSupplierToPhase(index, newSupplier);
                                  }}
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter un fournisseur
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                {phase.suppliers.map((supplier, supplierIndex) => (
                                  <Card key={supplier.id} className="p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs">Nom du fournisseur</Label>
                                        <Input
                                          value={supplier.name}
                                          onChange={(e) => {
                                            const updatedSuppliers = [...phase.suppliers];
                                            updatedSuppliers[supplierIndex] = { ...supplier, name: e.target.value };
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Contact</Label>
                                        <Input
                                          value={supplier.contact}
                                          onChange={(e) => {
                                            const updatedSuppliers = [...phase.suppliers];
                                            updatedSuppliers[supplierIndex] = { ...supplier, contact: e.target.value };
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Catégorie</Label>
                                        <Input
                                          value={supplier.category}
                                          onChange={(e) => {
                                            const updatedSuppliers = [...phase.suppliers];
                                            updatedSuppliers[supplierIndex] = { ...supplier, category: e.target.value };
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Délai (jours)</Label>
                                        <Input
                                          type="number"
                                          value={supplier.leadTime}
                                          onChange={(e) => {
                                            const updatedSuppliers = [...phase.suppliers];
                                            updatedSuppliers[supplierIndex] = { ...supplier, leadTime: parseInt(e.target.value) || 0 };
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Coût estimé (MRO)</Label>
                                        <Input
                                          type="number"
                                          value={supplier.estimatedCost}
                                          onChange={(e) => {
                                            const updatedSuppliers = [...phase.suppliers];
                                            updatedSuppliers[supplierIndex] = { ...supplier, estimatedCost: parseFloat(e.target.value) || 0 };
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div className="flex items-end">
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            const updatedSuppliers = phase.suppliers.filter((_, idx) => idx !== supplierIndex);
                                            handleUpdatePhase(index, { ...phase, suppliers: updatedSuppliers });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </TabsContent>

                          {/* Human Resources Tab */}
                          <TabsContent value="human" className="space-y-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Ressources humaines</h4>
                                <Button
                                  onClick={() => {
                                    const newResource: PhaseHumanResource = {
                                      id: `human_${Date.now()}`,
                                      name: '',
                                      role: '',
                                      dailyRate: 0,
                                      estimatedDays: 1,
                                      skills: [],
                                      status: 'assigned'
                                    };
                                    addHumanResourceToPhase(index, newResource);
                                  }}
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter une ressource
                                </Button>
                              </div>
                              
                              <div className="space-y-3">
                                {phase.humanResources.map((resource, resourceIndex) => (
                                  <Card key={resource.id} className="p-4 bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div>
                                        <Label className="text-xs">Nom</Label>
                                        <Input
                                          value={resource.name}
                                          onChange={(e) => {
                                            const updatedResources = [...phase.humanResources];
                                            updatedResources[resourceIndex] = { ...resource, name: e.target.value };
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Rôle</Label>
                                        <Input
                                          value={resource.role}
                                          onChange={(e) => {
                                            const updatedResources = [...phase.humanResources];
                                            updatedResources[resourceIndex] = { ...resource, role: e.target.value };
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Tarif journalier (MRO)</Label>
                                        <Input
                                          type="number"
                                          value={resource.dailyRate}
                                          onChange={(e) => {
                                            const updatedResources = [...phase.humanResources];
                                            updatedResources[resourceIndex] = { ...resource, dailyRate: parseFloat(e.target.value) || 0 };
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Jours estimés</Label>
                                        <Input
                                          type="number"
                                          value={resource.estimatedDays}
                                          onChange={(e) => {
                                            const updatedResources = [...phase.humanResources];
                                            updatedResources[resourceIndex] = { ...resource, estimatedDays: parseInt(e.target.value) || 1 };
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs">Date de début</Label>
                                        <Input
                                          type="date"
                                          value={resource.startDate || ''}
                                          onChange={(e) => {
                                            const updatedResources = [...phase.humanResources];
                                            updatedResources[resourceIndex] = { ...resource, startDate: e.target.value };
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div className="flex items-end">
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            const updatedResources = phase.humanResources.filter((_, idx) => idx !== resourceIndex);
                                            handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="mt-3">
                                      <Label className="text-xs">Compétences</Label>
                                      <Input
                                        value={resource.skills.join(', ')}
                                        onChange={(e) => {
                                          const updatedResources = [...phase.humanResources];
                                          updatedResources[resourceIndex] = { 
                                            ...resource, 
                                            skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                                          };
                                          handleUpdatePhase(index, { ...phase, humanResources: updatedResources });
                                        }}
                                        placeholder="Maçonnerie, Plomberie, Électricité..."
                                        className="mt-1"
                                      />
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </TabsContent>

                          {/* Payments Tab */}
                          <TabsContent value="payments" className="space-y-4">
                            <div className="border rounded-lg p-4">
                              <h4 className="font-semibold mb-4">Gestion des paiements</h4>
                              <div className="space-y-4">
                                {phase.payments.map((payment, paymentIndex) => (
                                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <p className="font-medium">{payment.description}</p>
                                      <p className="text-sm text-gray-600">
                                        Planifié: {new Date(payment.plannedDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">{payment.plannedAmount} MRO</p>
                                      <Badge className={
                                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        payment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }>
                                        {payment.status === 'completed' ? 'Payé' :
                                         payment.status === 'overdue' ? 'En retard' : 'En attente'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                                <Button variant="outline" className="w-full">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter un paiement
                                </Button>
                              </div>
                            </div>
                          </TabsContent>

                          {/* Progress Tab */}
                          <TabsContent value="progress" className="space-y-4">
                            <div className="space-y-4">
                              <div>
                                <Label>Progression (%)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={phase.progress}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, progress: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${phase.progress}%` }}
                                ></div>
                              </div>
                              <div>
                                <Label>Notes de suivi</Label>
                                <Textarea
                                  value={phase.notes || ''}
                                  onChange={(e) => handleUpdatePhase(index, { ...phase, notes: e.target.value })}
                                  rows={4}
                                  placeholder="Notes sur l'avancement, obstacles rencontrés, etc."
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePhase(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Phase summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Période</p>
                    <p className="font-medium">
                      {phase.startDate && phase.endDate 
                        ? `${new Date(phase.startDate).toLocaleDateString()} - ${new Date(phase.endDate).toLocaleDateString()}`
                        : 'À définir'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Budget</p>
                    <p className="font-medium">{phase.budget.toLocaleString()} MRO</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ressources</p>
                    <p className="font-medium">
                      {phase.materials.length} matériaux, {phase.humanResources.length} personnes
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Fournisseurs</p>
                    <p className="font-medium">{phase.suppliers.length} contractés</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Progression</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{phase.progress}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {phases.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Aucune phase de construction définie</p>
            <p className="text-sm mb-4">Commencez par ajouter une phase pour organiser votre projet</p>
            <Button onClick={handleAddPhase} className="bg-orange-600 hover:bg-orange-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première phase
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConstructionPhaseManager;
