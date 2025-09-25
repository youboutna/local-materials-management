import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Target
} from 'lucide-react';
import MaterialFormSection from '../MaterialFormSection';
import UserSelector from '../selectors/UserSelector';
import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import OrganizationalHierarchyManager from '../admin/OrganizationalHierarchyManager';
import EnhancedInteractiveMap from '../projects/EnhancedInteractiveMap';
import WarehouseShapeTracer from '../materials/WarehouseShapeTracer';
import InteractiveMapGIS from '../materials/InteractiveMapGIS';
import ConstructionPhaseManager from './ConstructionPhaseManager';

// Helper function to calculate polygon area in square meters
const calculatePolygonArea = (coordinates: Array<{lat: number, lng: number}>): number => {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i].lat * coordinates[j].lng;
    area -= coordinates[j].lat * coordinates[i].lng;
  }
  
  // Convert to square meters (approximate)
  area = Math.abs(area) / 2;
  const metersPerDegree = 111320; // Approximate meters per degree at equator
  return area * metersPerDegree * metersPerDegree;
};

interface ProjectCreationWorkflowProps {
  onSubmit: (data: any) => void;
  selectedMaterials: Array<{ materialId: string; quantity: number }>;
  onMaterialsChange: (materials: Array<{ materialId: string; quantity: number }>) => void;
  initialData?: any;
}

const ProjectCreationWorkflow: React.FC<ProjectCreationWorkflowProps> = ({
  onSubmit,
  selectedMaterials,
  onMaterialsChange,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stakeholders, setStakeholders] = useState<any[]>([]);
  const [delegation, setDelegation] = useState<any>({});
  const [risks, setRisks] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [phases, setPhases] = useState<any[]>([]);
  const [shapeData, setShapeData] = useState<any>(null);

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

  const getStepProgress = () => {
    return (completedSteps.length / workflowSteps.length) * 100;
  };

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isStepCompleted = (stepId: string) => completedSteps.includes(stepId);

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-serif text-primary">
              Processus de Création de Projet
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {completedSteps.length}/{workflowSteps.length} étapes
            </Badge>
          </div>
          <Progress value={getStepProgress()} className="h-2" />
        </CardHeader>
      </Card>

      {/* Workflow Steps Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                onClick={() => setActiveTab(step.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full ${step.color} text-white relative`}>
                      <Icon className="h-5 w-5" />
                      {isCompleted && (
                        <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 text-white rounded-full" />
                      )}
                    </div>
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="hidden" />

        {/* Basic Project Information */}
        <TabsContent value="basic">
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
                    <label className="block text-sm font-medium mb-2">Titre du projet *</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Nom du projet de construction"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Référence du projet</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="REF-2025-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description détaillée *</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                    placeholder="Description complète du projet, objectifs et spécifications techniques"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget total *</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="1000000"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Devise *</label>
                    <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="MRU">MRU (Ouguiya)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="USD">USD (Dollar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut initial</label>
                    <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="planning">Planification</option>
                      <option value="pending">En attente</option>
                      <option value="approved">Approuvé</option>
                    </select>
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
                      <label className="block text-sm font-medium mb-2">Date de début prévue *</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Date de fin prévue *</label>
                      <input 
                        type="date" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Durée estimée (jours)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="365"
                        readOnly
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
                      <label className="block text-sm font-medium mb-2">Mode de paiement principal</label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="progressive">Paiement progressif</option>
                        <option value="milestone">Par jalons</option>
                        <option value="completion">À l'achèvement</option>
                        <option value="mixed">Mixte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fréquence des paiements</label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="monthly">Mensuelle</option>
                        <option value="quarterly">Trimestrielle</option>
                        <option value="phase">Par phase</option>
                        <option value="custom">Personnalisée</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Avance initiale (%)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Retenue de garantie (%)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                      <label className="block text-sm font-medium mb-2">Priorité du projet</label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="low">Basse</option>
                        <option value="medium">Moyenne</option>
                        <option value="high">Haute</option>
                        <option value="critical">Critique</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type de projet</label>
                      <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="construction">Construction</option>
                        <option value="renovation">Rénovation</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Secteur d'activité</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Bâtiment, Routes, Ponts..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Numéro de permis</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="PERM-2025-001"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button variant="outline" disabled>
                    Précédent
                  </Button>
                  <Button onClick={() => {
                    handleStepComplete('basic');
                    setActiveTab('stakeholders');
                  }}>
                    Suivant: Parties Prenantes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stakeholders */}
        <TabsContent value="stakeholders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Configuration des Parties Prenantes Externes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-info/10 p-4 rounded-lg border border-info/20">
                  <p className="text-sm text-info-foreground">
                    Cette étape concerne les entités externes (entreprises, organismes) impliquées dans le projet.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Entités Externes & Organismes
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Maître d'Ouvrage *</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId: string) => {
                          setStakeholders(prev => [...prev, { type: 'maitre_ouvrage', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner l'entité commanditaire"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Entrepreneur Principal *</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId) => {
                          setStakeholders(prev => [...prev, { type: 'entrepreneur', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner l'entrepreneur principal"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Bureau d'Études</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId) => {
                          setStakeholders(prev => [...prev, { type: 'bureau_etudes', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner le bureau d'études"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Bureau de Contrôle</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId) => {
                          setStakeholders(prev => [...prev, { type: 'bureau_controle', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner le bureau de contrôle"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Organisme de Certification</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId) => {
                          setStakeholders(prev => [...prev, { type: 'organisme_certification', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner l'organisme de certification"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Autorité de Régulation</label>
                      <SimpleSupplierSelector
                        value=""
                        onChange={(supplierId) => {
                          setStakeholders(prev => [...prev, { type: 'autorite_regulation', id: supplierId, source: 'supplier' }]);
                        }}
                        placeholder="Sélectionner l'autorité de régulation"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Selected Stakeholders Summary */}
                {stakeholders.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Parties Prenantes Externes Sélectionnées:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {stakeholders.map((stakeholder, index) => (
                        <div key={index} className="flex items-center justify-between bg-background p-2 rounded text-sm">
                          <span>
                            {String(stakeholder.type).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setStakeholders(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('stakeholders')}>
                    Valider les Parties Prenantes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team & Delegation */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-500" />
                Équipe Interne & Délégation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-warning/10 p-4 rounded-lg border border-warning/20">
                  <p className="text-sm text-warning-foreground">
                    Cette étape concerne l'équipe interne (employés de l'organisation) et les contractants directs.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Internal Team - Employees */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Équipe Interne (Employés)
                    </h3>
                    
                     <div className="space-y-4">
                       <EmployeeSelector
                         value={delegation.maitre_oeuvre || ""}
                         onChange={(employeeId) => setDelegation(prev => ({...prev, maitre_oeuvre: employeeId}))}
                         label="Maître d'Œuvre *"
                         placeholder="Sélectionner le maître d'œuvre"
                         positionFilter={['Manager', 'Director', 'Engineer', 'Project Manager']}
                         required
                       />
                       
                       <EmployeeSelector
                         value={delegation.chef_projet || ""}
                         onChange={(employeeId) => setDelegation(prev => ({...prev, chef_projet: employeeId}))}
                         label="Chef de Projet *"
                         placeholder="Sélectionner le chef de projet"
                         positionFilter={['Project Manager', 'Engineer', 'Team Lead']}
                         required
                       />
                       
                       <EmployeeSelector
                         value={delegation.responsable_qualite || ""}
                         onChange={(employeeId) => setDelegation(prev => ({...prev, responsable_qualite: employeeId}))}
                         label="Responsable Qualité"
                         placeholder="Sélectionner le responsable qualité"
                         positionFilter={['Quality Manager', 'Inspector', 'Engineer']}
                       />
                       
                       <EmployeeSelector
                         value={delegation.coordinateur_hse || ""}
                         onChange={(employeeId) => setDelegation(prev => ({...prev, coordinateur_hse: employeeId}))}
                         label="Coordinateur HSE"
                         placeholder="Sélectionner le coordinateur HSE"
                         positionFilter={['HSE Coordinator', 'Safety Manager', 'Inspector']}
                       />
                     </div>
                  </div>
                  
                  {/* External Team - Suppliers/Contractors */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Contractants & Fournisseurs Directs
                    </h3>
                    
                    <div className="space-y-4">
                      <SimpleSupplierSelector
                        value={delegation.contractant_principal || ""}
                        onChange={(supplierId) => setDelegation(prev => ({...prev, contractant_principal: supplierId}))}
                        placeholder="Sélectionner un contractant principal"
                        label="Contractant Principal *"
                      />
                      
                      <SimpleSupplierSelector
                        value={delegation.sous_traitant || ""}
                        onChange={(supplierId) => setDelegation(prev => ({...prev, sous_traitant: supplierId}))}
                        placeholder="Sélectionner un sous-traitant"
                        label="Sous-traitant Principal"
                      />
                      
                      <SimpleSupplierSelector
                        value={delegation.fournisseur_materiaux || ""}
                        onChange={(supplierId) => setDelegation(prev => ({...prev, fournisseur_materiaux: supplierId}))}
                        placeholder="Sélectionner un fournisseur"
                        label="Fournisseur Matériaux *"
                      />
                      
                      <SimpleSupplierSelector
                        value={delegation.transporteur || ""}
                        onChange={(supplierId) => setDelegation(prev => ({...prev, transporteur: supplierId}))}
                        placeholder="Sélectionner un transporteur"
                        label="Transporteur/Logistique"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Organizational Template */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Hiérarchie Organisationnelle du Projet</h3>
                  <div className="border rounded-lg p-4">
                    <OrganizationalHierarchyManager />
                  </div>
                </div>
                
                {/* Delegation Summary */}
                {Object.keys(delegation).length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Résumé des Assignations:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(delegation).map(([role, id]) => (
                        <div key={role} className="flex justify-between">
                          <span className="capitalize">{role.replace('_', ' ')}:</span>
                          <span className="text-muted-foreground">{String(id)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('team')}>
                    Valider l'Équipe & Délégation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases & Planning */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Phases & Planification - Méthodologie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Méthodologies de Phase Disponibles:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-background rounded border">
                      <div className="font-medium text-blue-600">Standards Mauritaniens</div>
                      <div className="text-muted-foreground">Normes nationales de construction</div>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <div className="font-medium text-green-600">Cascade/Waterfall</div>
                      <div className="text-muted-foreground">Approche séquentielle classique</div>
                    </div>
                    <div className="p-3 bg-background rounded border">
                      <div className="font-medium text-purple-600">Phases Personnalisées</div>
                      <div className="text-muted-foreground">Configuration sur mesure</div>
                    </div>
                  </div>
                </div>
                
                {/* Use the existing ConstructionPhaseManager component */}
                <div className="border rounded-lg">
                  <ConstructionPhaseManager 
                    phases={phases}
                    onChange={setPhases}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('phases')}>
                    Valider les Phases & Planification
                  </Button>
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
                <MapPin className="h-5 w-5 text-cyan-500" />
                Géolocalisation & Cartographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Coordonnées GPS et adresse */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse du projet *</label>
                    <textarea 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      placeholder="Adresse complète du site de construction..."
                      required
                      value={shapeData?.address || ''}
                      onChange={(e) => setShapeData({...shapeData, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Coordonnées GPS</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Latitude"
                          step="0.000001"
                          value={shapeData?.coordinates?.lat || ''}
                          onChange={(e) => setShapeData({
                            ...shapeData, 
                            coordinates: {
                              ...shapeData?.coordinates,
                              lat: parseFloat(e.target.value) || 0,
                              lng: shapeData?.coordinates?.lng || 0
                            }
                          })}
                        />
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Longitude"
                          step="0.000001"
                          value={shapeData?.coordinates?.lng || ''}
                          onChange={(e) => setShapeData({
                            ...shapeData, 
                            coordinates: {
                              lat: shapeData?.coordinates?.lat || 0,
                              lng: parseFloat(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Surface estimée (m²)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Surface totale du projet"
                        min="0"
                        value={shapeData?.surface || ''}
                        onChange={(e) => setShapeData({...shapeData, surface: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Système GIS Interactif intégré */}
                <div className="border rounded-lg p-4 bg-gradient-to-br from-muted/20 to-accent/5">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-cyan-500" />
                    Géolocalisation Interactive & Délimitation des Zones
                  </h4>
                  <div className="bg-muted/30 p-3 rounded mb-4 text-sm">
                    <strong>Instructions:</strong> 
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Cliquez sur la carte pour définir la position GPS (onglet Localisation)</li>
                      <li>Utilisez l'onglet Forme pour délimiter les zones de travail</li>
                      <li>Les coordonnées GPS se mettront à jour automatiquement</li>
                    </ul>
                  </div>
                  <div className="h-[500px] w-full">
                    <InteractiveMapGIS 
                      title="Carte de Géolocalisation du Projet"
                      description="Définissez la position et délimitez les zones de construction"
                      allowPolygon={true}
                      value={{
                        coordinates: shapeData?.coordinates,
                        address: shapeData?.address,
                        shape: shapeData?.shape,
                        shapeType: shapeData?.shapeType
                      }}
                      onChange={(mapData) => {
                        console.log('Map data updated:', mapData);
                        setShapeData({
                          ...shapeData,
                          ...mapData,
                          // Calculate surface if shape is provided
                          surface: mapData.shape && mapData.shape.length > 2 
                            ? calculatePolygonArea(mapData.shape) 
                            : shapeData?.surface
                        });
                      }}
                      className="h-full"
                    />
                  </div>
                </div>

                {/* Informations calculées */}
                {shapeData?.coordinates && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Informations de Géolocalisation
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Position GPS:</span>
                        <div className="font-mono text-green-600">
                          {shapeData.coordinates.lat.toFixed(6)}, {shapeData.coordinates.lng.toFixed(6)}
                        </div>
                      </div>
                      {shapeData.surface && (
                        <div>
                          <span className="font-medium text-green-700">Surface calculée:</span>
                          <div className="font-mono text-green-600">
                            {shapeData.surface.toLocaleString()} m²
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('phases')}>
                    Précédent: Phases
                  </Button>
                  <Button onClick={() => {
                    handleStepComplete('geolocation');
                    setActiveTab('resources');
                  }}>
                    Suivant: Ressources
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources & Materials */}
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Ressources & Matériaux
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sélection des Matériaux</h3>
                  <MaterialFormSection
                    selectedMaterials={selectedMaterials}
                    onChange={onMaterialsChange}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Organisation des Ressources</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Entrepôt Principal</label>
                      <input 
                        type="text" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Adresse de l'entrepôt"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Capacité de Stockage (m³)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="1000"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Équipements Disponibles</label>
                      <textarea 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <Button onClick={() => {
                  handleStepComplete('resources');
                  setActiveTab('risks');
                }}>
                  Suivant: Gestion des Risques
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Management */}
        <TabsContent value="risks">
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
                            <Button variant="outline" size="sm">
                              Ajouter Risque
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Stratégies de Mitigation</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Plan de Contingence</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          placeholder="Décrivez le plan de contingence..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Budget Risques (%)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="5"
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-6">
                  <Button variant="outline" onClick={() => setActiveTab('resources')}>
                    Précédent: Ressources
                  </Button>
                  <Button onClick={() => {
                    handleStepComplete('risks');
                    setActiveTab('compliance');
                  }}>
                    Suivant: Conformités
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance & Validation */}
        <TabsContent value="compliance">
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
                        <label className="block text-sm font-medium mb-2">Notes de Validation</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('risks')}>
                      Précédent: Risques
                    </Button>
                    <Button variant="outline">
                      Sauvegarder comme Brouillon
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      handleStepComplete('compliance');
                      onSubmit({
                        stakeholders,
                        delegation,
                        phases,
                        risks,
                        compliance,
                        selectedMaterials,
                        shapeData
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Créer le Projet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectCreationWorkflow;