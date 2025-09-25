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
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  budget: number;
  actualCost: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  materials: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers: Array<{ supplierId: string; name?: string; contact?: string }>;
  location: string;
  notes: string;
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
  projectReference?: string;
  
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
      id: 'materials',
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

      {/* Workflow Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.div
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  isActive ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full ${tab.color} text-white relative`}>
                      <Icon className="h-5 w-5" />
                      {hasUnsavedChanges && isActive && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{tab.title}</h3>
                    <p className="text-xs text-muted-foreground">{tab.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8 bg-muted/50 p-1 rounded-xl">
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="projectReference">Référence du projet</Label>
                    <Input
                      id="projectReference"
                      value={formData.projectReference || ''}
                      onChange={(e) => updateFormData('projectReference', e.target.value)}
                      placeholder="REF-2025-001"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Description complète du projet, objectifs et spécifications techniques"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget total *</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => updateFormData('budget', parseFloat(e.target.value) || 0)}
                      placeholder="1000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Devise *</Label>
                    <Select value={formData.currency} onValueChange={(value) => updateFormData('currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="MRU">MRU (Ouguiya)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Statut initial</Label>
                    <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="planning">Planification</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chronologie Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Chronologie du Projet
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="startDate">Date de début prévue *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateFormData('startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Date de fin prévue *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => updateFormData('endDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Durée estimée (jours)</Label>
                      <Input
                        type="number"
                        value={formData.startDate && formData.endDate ? 
                          Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
                          : 0}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Paramètres de paiement Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Paramètres de Paiement
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentMode">Mode de paiement principal</Label>
                      <Select value={formData.paymentMode} onValueChange={(value) => updateFormData('paymentMode', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="progressive">Paiement progressif</SelectItem>
                          <SelectItem value="milestone">Par jalons</SelectItem>
                          <SelectItem value="completion">À l'achèvement</SelectItem>
                          <SelectItem value="mixed">Mixte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="paymentFrequency">Fréquence des paiements</Label>
                      <Select value={formData.paymentFrequency} onValueChange={(value) => updateFormData('paymentFrequency', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="quarterly">Trimestrielle</SelectItem>
                          <SelectItem value="phase">Par phase</SelectItem>
                          <SelectItem value="custom">Personnalisée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="initialAdvance">Avance initiale (%)</Label>
                      <Input
                        id="initialAdvance"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.initialAdvance}
                        onChange={(e) => updateFormData('initialAdvance', parseFloat(e.target.value) || 0)}
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="warrantyRetention">Retenue de garantie (%)</Label>
                      <Input
                        id="warrantyRetention"
                        type="number"
                        min="0"
                        max="20"
                        value={formData.warrantyRetention}
                        onChange={(e) => updateFormData('warrantyRetention', parseFloat(e.target.value) || 0)}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </div>

                {/* Informations administratives */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Informations Administratives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priorité du projet</Label>
                      <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="low">Basse</SelectItem>
                          <SelectItem value="medium">Moyenne</SelectItem>
                          <SelectItem value="high">Haute</SelectItem>
                          <SelectItem value="critical">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="projectType">Type de projet</Label>
                      <Select value={formData.projectType} onValueChange={(value) => updateFormData('projectType', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="construction">Construction</SelectItem>
                          <SelectItem value="renovation">Rénovation</SelectItem>
                          <SelectItem value="infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" disabled>
                    Précédent
                  </Button>
                  <Button onClick={() => setActiveTab('stakeholders')}>
                    Suivant: Parties Prenantes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders - Enhanced */}
        <TabsContent value="stakeholders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Configuration des Parties Prenantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-muted/30 to-accent/10 border border-border/50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Gestion avancée des parties prenantes externes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Maître d'Ouvrage</h5>
                      <Input placeholder="Nom de l'organisation" className="mb-2" />
                      <Input placeholder="Contact principal" />
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Maître d'Œuvre</h5>
                      <Input placeholder="Bureau d'études" className="mb-2" />
                      <Input placeholder="Responsable technique" />
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Autorités</h5>
                      <Input placeholder="Organisme de contrôle" className="mb-2" />
                      <Input placeholder="Référent réglementaire" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4">Responsabilités et Rôles</h4>
                  <div className="space-y-3">
                    {[
                      { role: 'Coordination générale', responsible: '' },
                      { role: 'Validation technique', responsible: '' },
                      { role: 'Contrôle qualité', responsible: '' },
                      { role: 'Gestion financière', responsible: '' }
                    ].map((item, index) => (
                      <div key={index} className="grid grid-cols-2 gap-4 items-center p-3 border rounded-lg">
                        <span className="font-medium text-sm">{item.role}</span>
                        <Input placeholder="Assigné à..." />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('basic')}>
                    Précédent: Informations
                  </Button>
                  <Button onClick={() => setActiveTab('team')}>
                    Suivant: Équipe
                  </Button>
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
                    Équipe Interne (Employés)
                  </div>
                  <Dialog open={editDialogs.employee} onOpenChange={(open) => setEditDialogs(prev => ({ ...prev, employee: open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border shadow-lg z-50">
                      <DialogHeader>
                        <DialogTitle>Ajouter un Employé</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Sélection d'employés depuis la base de données
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
                    Fournisseurs & Contractants
                  </div>
                  <Dialog open={editDialogs.supplier} onOpenChange={(open) => setEditDialogs(prev => ({ ...prev, supplier: open }))}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-background border shadow-lg z-50">
                      <DialogHeader>
                        <DialogTitle>Ajouter un Fournisseur</DialogTitle>
                      </DialogHeader>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground">
                          Sélection de fournisseurs depuis la base de données
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
          
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => setActiveTab('stakeholders')}>
              Précédent: Parties Prenantes
            </Button>
            <Button onClick={() => setActiveTab('phases')}>
              Suivant: Phases & Planification
            </Button>
          </div>
        </TabsContent>

        {/* Phases & Planning */}
        <TabsContent value="phases" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Phases & Planification du Projet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-muted/30 to-accent/10 border border-border/50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-foreground mb-3">
                    Méthodologies de Construction & Phases
                  </h4>
                  <ConstructionPhaseManager
                    phases={formData.phases}
                    onChange={(phases) => updateFormData('phases', phases)}
                  />
                </div>

                {formData.phases.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Résumé de la Planification</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-700">Nombre de phases:</span>
                        <div className="font-mono text-blue-600">{formData.phases.length}</div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Budget total phases:</span>
                        <div className="font-mono text-blue-600">
                          {formData.phases.reduce((sum, phase) => sum + phase.budget, 0).toLocaleString()} {formData.currency}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Progression moyenne:</span>
                        <div className="font-mono text-blue-600">
                          {Math.round(formData.phases.reduce((sum, phase) => sum + phase.progress, 0) / formData.phases.length || 0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('team')}>
                    Précédent: Équipe
                  </Button>
                  <Button onClick={() => setActiveTab('geolocation')}>
                    Suivant: Géolocalisation
                  </Button>
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
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('phases')}>
                    Précédent: Phases
                  </Button>
                  <Button onClick={() => setActiveTab('materials')}>
                    Suivant: Matériaux
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials */}
        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Ressources & Matériaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Sélection des Matériaux</h3>
                    <MaterialFormSection
                      selectedMaterials={formData.materials}
                      onChange={(materials) => updateFormData('materials', materials)}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Organisation des Ressources</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Entrepôt Principal</Label>
                        <Input 
                          placeholder="Adresse de l'entrepôt"
                        />
                      </div>
                      
                      <div>
                        <Label>Capacité de Stockage (m³)</Label>
                        <Input 
                          type="number"
                          placeholder="1000"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <Label>Équipements Disponibles</Label>
                        <Textarea 
                          rows={3}
                          placeholder="Liste des équipements disponibles..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('geolocation')}>
                    Précédent: Géolocalisation
                  </Button>
                  <Button onClick={() => setActiveTab('risks')}>
                    Suivant: Gestion des Risques
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Management */}
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Gestion des Risques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Identification des Risques</h3>
                    
                    <div className="space-y-3">
                      {['Technique', 'Financier', 'Climatique', 'Sécurité', 'Réglementaire'].map((category) => (
                        <div key={category} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category}</span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => addSubObject('risk', {
                                category,
                                description: '',
                                impact: 'medium',
                                probability: 'medium',
                                mitigation: '',
                                status: 'identified'
                              })}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Risques Identifiés</h3>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      <AnimatePresence>
                        {formData.risks.map((risk) => (
                          <motion.div
                            key={risk.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="p-3 border rounded-lg bg-background/50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{risk.category}</div>
                                <div className="text-xs text-muted-foreground">{risk.description}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant={risk.impact === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
                                    {risk.impact}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {risk.status}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeSubObject('risk', risk.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {formData.risks.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          Aucun risque identifié
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('materials')}>
                    Précédent: Matériaux
                  </Button>
                  <Button onClick={() => setActiveTab('compliance')}>
                    Suivant: Conformités
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance & Validation */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal-500" />
                Conformités & Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Conformités Réglementaires</h3>
                    
                    <div className="space-y-3">
                      {[
                        'Permis de construire',
                        'Étude d\'impact environnemental',
                        'Normes de sécurité',
                        'Normes mauritaniennes',
                        'Certification qualité'
                      ].map((item) => (
                        <div key={item} className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <label className="text-sm">{item}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Validation Finale</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Notes de Validation</Label>
                        <Textarea 
                          rows={4}
                          placeholder="Notes et observations finales..."
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" className="rounded" />
                        <label className="text-sm">
                          Je confirme que toutes les informations sont exactes et complètes
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('risks')}>
                    Précédent: Risques
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleAutoSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Sauvegarder comme Brouillon
                    </Button>
                    <Button 
                      onClick={() => onSubmit(formData)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Enregistrer les Modifications
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
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
