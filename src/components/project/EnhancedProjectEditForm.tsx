import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building, 
  Users, 
  UserCheck, 
  Shield, 
  MapPin,
  AlertTriangle,
  FileCheck,
  Layers,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Plus,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import MaterialFormSection from '../MaterialFormSection';
import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import InteractiveMapGIS from '../materials/InteractiveMapGIS';
import ConstructionPhaseManager from './ConstructionPhaseManager';

interface SubEmployee {
  id: string;
  name: string;
  role: string;
  dailyRate?: number;
  assignedPhases: string[];
}

interface SubSupplier {
  id: string;
  name: string;
  category: string;
  contactInfo: string;
  estimatedBudget?: number;
  assignedMaterials: string[];
}

interface SubPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  dependencies: string[];
  assignedEmployees: string[];
  requiredMaterials: string[];
}

interface SubRisk {
  id: string;
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation: string;
  status: 'identified' | 'mitigated' | 'resolved';
}

interface ProjectEditData {
  // Basic Info
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: string;
  startDate: string;
  endDate: string;
  priority: string;
  projectType: string;
  
  // Timeline & Payment
  paymentMode: string;
  paymentFrequency: string;
  initialAdvance: number;
  warrantyRetention: number;
  
  // Geolocation
  address: string;
  coordinates: { lat: number; lng: number } | null;
  surface: number;
  shapeData: any;
  
  // Sub-objects
  employees: SubEmployee[];
  suppliers: SubSupplier[];
  phases: SubPhase[];
  risks: SubRisk[];
  materials: Array<{ materialId: string; quantity: number }>;
}

interface EnhancedProjectEditFormProps {
  initialData?: Partial<ProjectEditData>;
  onSubmit: (data: ProjectEditData) => void;
  onSave?: (data: ProjectEditData) => void;
  className?: string;
}

const EnhancedProjectEditForm: React.FC<EnhancedProjectEditFormProps> = ({
  initialData = {},
  onSubmit,
  onSave,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<ProjectEditData>({
    title: '',
    description: '',
    budget: 0,
    currency: 'MRU',
    status: 'planning',
    startDate: '',
    endDate: '',
    priority: 'medium',
    projectType: 'construction',
    paymentMode: 'progressive',
    paymentFrequency: 'monthly',
    initialAdvance: 20,
    warrantyRetention: 5,
    address: '',
    coordinates: null,
    surface: 0,
    shapeData: null,
    employees: [],
    suppliers: [],
    phases: [],
    risks: [],
    materials: [],
    ...initialData
  });

  const [editDialogs, setEditDialogs] = useState({
    employee: false,
    supplier: false,
    phase: false,
    risk: false
  });

  const [editingItem, setEditingItem] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const updateFormData = (field: keyof ProjectEditData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAutoSave = () => {
    if (onSave && hasUnsavedChanges) {
      onSave(formData);
      setHasUnsavedChanges(false);
      toast({
        title: "Sauvegarde automatique",
        description: "Vos modifications ont été sauvegardées",
      });
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(handleAutoSave, 30000);
    return () => clearInterval(interval);
  }, [formData, hasUnsavedChanges]);

  // Sub-object management functions
  const addSubObject = (type: 'employee' | 'supplier' | 'phase' | 'risk', data: any) => {
    const newItem = { ...data, id: `${type}_${Date.now()}` };
    setFormData(prev => ({
      ...prev,
      [`${type}s`]: [...prev[`${type}s` as keyof ProjectEditData] as any[], newItem]
    }));
    setEditDialogs(prev => ({ ...prev, [type]: false }));
    toast({
      title: "Ajouté avec succès",
      description: `${type} ajouté au projet`,
    });
  };

  const updateSubObject = (type: 'employee' | 'supplier' | 'phase' | 'risk', id: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [`${type}s`]: (prev[`${type}s` as keyof ProjectEditData] as any[]).map(item =>
        item.id === id ? { ...item, ...data } : item
      )
    }));
    setEditingItem(null);
    toast({
      title: "Modifié avec succès",
      description: `${type} mis à jour`,
    });
  };

  const removeSubObject = (type: 'employee' | 'supplier' | 'phase' | 'risk', id: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}s`]: (prev[`${type}s` as keyof ProjectEditData] as any[]).filter(item => item.id !== id)
    }));
    toast({
      title: "Supprimé",
      description: `${type} retiré du projet`,
      variant: "destructive"
    });
  };

  const calculateProjectProgress = () => {
    if (formData.phases.length === 0) return 0;
    const totalProgress = formData.phases.reduce((sum, phase) => sum + phase.progress, 0);
    return Math.round(totalProgress / formData.phases.length);
  };

  const calculateTotalBudget = () => {
    const phaseBudget = formData.phases.reduce((sum, phase) => sum + phase.budget, 0);
    const supplierBudget = formData.suppliers.reduce((sum, supplier) => sum + (supplier.estimatedBudget || 0), 0);
    return phaseBudget + supplierBudget;
  };

  const tabs = [
    {
      id: 'basic',
      title: 'Informations de Base',
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      id: 'timeline',
      title: 'Chronologie & Paiements',
      icon: Clock,
      color: 'bg-green-500'
    },
    {
      id: 'geolocation',
      title: 'Géolocalisation',
      icon: MapPin,
      color: 'bg-cyan-500'
    },
    {
      id: 'team',
      title: 'Équipe & Fournisseurs',
      icon: Users,
      color: 'bg-orange-500'
    },
    {
      id: 'phases',
      title: 'Phases & Planification',
      icon: Layers,
      color: 'bg-indigo-500'
    },
    {
      id: 'materials',
      title: 'Matériaux',
      icon: Shield,
      color: 'bg-purple-500'
    },
    {
      id: 'risks',
      title: 'Gestion des Risques',
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with project overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-serif text-primary">
                {formData.title || 'Projet sans titre'}
              </CardTitle>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline">{formData.status}</Badge>
                <Badge variant="secondary">{formData.priority}</Badge>
                <span className="text-sm text-muted-foreground">
                  Progression: {calculateProjectProgress()}%
                </span>
                {hasUnsavedChanges && (
                  <Badge variant="destructive" className="animate-pulse">
                    Modifications non sauvegardées
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleAutoSave}>
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Aperçu
              </Button>
            </div>
          </div>
          {formData.phases.length > 0 && (
            <Progress value={calculateProjectProgress()} className="h-2 mt-4" />
          )}
        </CardHeader>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-muted/50 p-1 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="flex items-center gap-2 rounded-lg transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{tab.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-500" />
                Informations Générales du Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre du projet *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="Nom du projet"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateFormData('description', e.target.value)}
                      placeholder="Description détaillée du projet"
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="budget">Budget *</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => updateFormData('budget', parseFloat(e.target.value) || 0)}
                        placeholder="Budget total"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Devise</Label>
                      <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MRU">MRU (Ouguiya)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="USD">USD (Dollar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status">Statut</Label>
                      <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planification</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="in_progress">En cours</SelectItem>
                          <SelectItem value="completed">Terminé</SelectItem>
                          <SelectItem value="on_hold">En pause</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priorité</Label>
                      <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="projectType">Type de projet</Label>
                    <Select value={formData.projectType} onValueChange={(value) => updateFormData('projectType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="renovation">Rénovation</SelectItem>
                        <SelectItem value="infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Real-time calculations */}
                  <div className="bg-gradient-to-r from-muted/50 to-accent/10 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Calculs en Temps Réel
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Budget calculé:</span>
                        <div className="font-mono font-medium">
                          {calculateTotalBudget().toLocaleString()} {formData.currency}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Progression:</span>
                        <div className="font-mono font-medium">
                          {calculateProjectProgress()}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline & Payments */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                Chronologie et Paramètres de Paiement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Chronologie</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Date de début</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Date de fin</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateFormData('endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {formData.startDate && formData.endDate && (
                    <div className="bg-muted/50 p-3 rounded">
                      <span className="text-sm text-muted-foreground">Durée calculée:</span>
                      <div className="font-medium">
                        {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paramètres de Paiement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMode">Mode de paiement</Label>
                      <Select value={formData.paymentMode} onValueChange={(value) => updateFormData('paymentMode', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="progressive">Progressif</SelectItem>
                          <SelectItem value="milestone">Par jalons</SelectItem>
                          <SelectItem value="completion">À l'achèvement</SelectItem>
                          <SelectItem value="mixed">Mixte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentFrequency">Fréquence</Label>
                      <Select value={formData.paymentFrequency} onValueChange={(value) => updateFormData('paymentFrequency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="quarterly">Trimestrielle</SelectItem>
                          <SelectItem value="phase">Par phase</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="initialAdvance">Avance (%)</Label>
                      <Input
                        id="initialAdvance"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.initialAdvance}
                        onChange={(e) => updateFormData('initialAdvance', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="warrantyRetention">Retenue (%)</Label>
                      <Input
                        id="warrantyRetention"
                        type="number"
                        min="0"
                        max="20"
                        value={formData.warrantyRetention}
                        onChange={(e) => updateFormData('warrantyRetention', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geolocation */}
        <TabsContent value="geolocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-500" />
                Géolocalisation et Cartographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address">Adresse du projet</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="Adresse complète du site"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label>Coordonnées GPS</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Latitude"
                          value={formData.coordinates?.lat || ''}
                          onChange={(e) => updateFormData('coordinates', {
                            ...formData.coordinates,
                            lat: parseFloat(e.target.value) || 0
                          })}
                          step="0.000001"
                        />
                        <Input
                          type="number"
                          placeholder="Longitude"
                          value={formData.coordinates?.lng || ''}
                          onChange={(e) => updateFormData('coordinates', {
                            lat: formData.coordinates?.lat || 0,
                            lng: parseFloat(e.target.value) || 0
                          })}
                          step="0.000001"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="surface">Surface (m²)</Label>
                      <Input
                        id="surface"
                        type="number"
                        value={formData.surface}
                        onChange={(e) => updateFormData('surface', parseFloat(e.target.value) || 0)}
                        placeholder="Surface totale"
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[500px] w-full">
                  <InteractiveMapGIS
                    title="Localisation du Projet"
                    description="Modifiez la position et les zones délimitées"
                    allowPolygon={true}
                    value={{
                      coordinates: formData.coordinates || undefined,
                      address: formData.address,
                      shape: formData.shapeData?.shape,
                      shapeType: formData.shapeData?.shapeType
                    }}
                    onChange={(mapData) => {
                      updateFormData('coordinates', mapData.coordinates);
                      updateFormData('address', mapData.address || formData.address);
                      updateFormData('shapeData', mapData);
                    }}
                    className="h-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team & Suppliers - Enhanced with sub-object management */}
        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employees Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-orange-500" />
                    Équipe Interne
                  </div>
                  <Dialog open={editDialogs.employee} onOpenChange={(open) => setEditDialogs(prev => ({ ...prev, employee: open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un Employé</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Sélection d'employés à implémenter
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {formData.employees.map((employee) => (
                      <motion.div
                        key={employee.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
                      >
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.role}</div>
                          {employee.dailyRate && (
                            <div className="text-xs text-green-600">
                              {employee.dailyRate} {formData.currency}/jour
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(employee)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeSubObject('employee', employee.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {formData.employees.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      Aucun employé assigné
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Suppliers Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Fournisseurs
                  </div>
                  <Dialog open={editDialogs.supplier} onOpenChange={(open) => setEditDialogs(prev => ({ ...prev, supplier: open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Sélection de fournisseurs à implémenter
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {formData.suppliers.map((supplier) => (
                      <motion.div
                        key={supplier.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center justify-between p-3 border rounded-lg bg-background/50"
                      >
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.category}</div>
                          {supplier.estimatedBudget && (
                            <div className="text-xs text-green-600">
                              Budget estimé: {supplier.estimatedBudget} {formData.currency}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem(supplier)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeSubObject('supplier', supplier.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {formData.suppliers.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      Aucun fournisseur assigné
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would continue with similar sub-object management patterns... */}
        
      </Tabs>

      {/* Footer Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.history.back()}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button variant="outline" onClick={handleAutoSave} disabled={!hasUnsavedChanges}>
                <Save className="h-4 w-4 mr-1" />
                Sauvegarder
              </Button>
            </div>
            <Button onClick={() => onSubmit(formData)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />
              Enregistrer les Modifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedProjectEditForm;
