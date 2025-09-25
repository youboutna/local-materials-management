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
  DollarSign
} from 'lucide-react';
import MaterialFormSection from '../MaterialFormSection';
import UserSelector from '../selectors/UserSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import OrganizationalHierarchyManager from '../admin/OrganizationalHierarchyManager';
import EnhancedInteractiveMap from '../projects/EnhancedInteractiveMap';
import WarehouseShapeTracer from '../materials/WarehouseShapeTracer';
import ConstructionPhaseManager from './ConstructionPhaseManager';

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
                    <label className="block text-sm font-medium mb-2">Référence projet</label>
                    <input 
                      type="text" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="PRJ-2024-001"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={4}
                    placeholder="Description détaillée du projet..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget (MRU) *</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Statut</label>
                    <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option value="Planning">Planification</option>
                      <option value="InProgress">En cours</option>
                      <option value="OnHold">En pause</option>
                      <option value="Completed">Terminé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Taille équipe</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="5"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('basic')}>
                    Valider les Informations
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
                Configuration des Parties Prenantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Stakeholders from Suppliers */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Fournisseurs & Entreprises
                    </h3>
                    
                    <div className="space-y-4">
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
                    </div>
                  </div>
                  
                  {/* Stakeholders from Employees */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Équipe Interne & Délégation
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Maître d'Œuvre *</label>
                        <UserSelector
                          value=""
                          onChange={(userId) => {
                            setStakeholders(prev => [...prev, { type: 'maitre_oeuvre', id: userId, source: 'employee' }]);
                          }}
                          label=""
                          placeholder="Sélectionner le maître d'œuvre"
                          roleFilter={['manager', 'director', 'engineer']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Chef de Projet</label>
                        <UserSelector
                          value=""
                          onChange={(userId) => {
                            setStakeholders(prev => [...prev, { type: 'chef_projet', id: userId, source: 'employee' }]);
                          }}
                          label=""
                          placeholder="Sélectionner le chef de projet"
                          roleFilter={['manager', 'engineer']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Responsable Qualité</label>
                        <UserSelector
                          value=""
                          onChange={(userId) => {
                            setStakeholders(prev => [...prev, { type: 'responsable_qualite', id: userId, source: 'employee' }]);
                          }}
                          label=""
                          placeholder="Sélectionner le responsable qualité"
                          roleFilter={['inspector', 'engineer']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Coordinateur HSE</label>
                        <UserSelector
                          value=""
                          onChange={(userId) => {
                            setStakeholders(prev => [...prev, { type: 'coordinateur_hse', id: userId, source: 'employee' }]);
                          }}
                          label=""
                          placeholder="Sélectionner le coordinateur HSE"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Selected Stakeholders Summary */}
                {stakeholders.length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Parties Prenantes Sélectionnées:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {stakeholders.map((stakeholder, index) => (
                        <div key={index} className="flex items-center justify-between bg-background p-2 rounded text-sm">
                          <span>
                            {String(stakeholder.type).replace('_', ' ')} - {stakeholder.source === 'supplier' ? 'Fournisseur' : 'Employé'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Internal Team - Employees */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Équipe Interne (Employés)
                    </h3>
                    
                    <div className="space-y-4">
                      <UserSelector
                        value={delegation.chef_equipe || ""}
                        onChange={(userId) => setDelegation(prev => ({...prev, chef_equipe: userId}))}
                        label="Chef d'équipe *"
                        placeholder="Sélectionner un chef d'équipe"
                        roleFilter={['manager', 'director']}
                        required
                      />
                      
                      <UserSelector
                        value={delegation.ingenieur || ""}
                        onChange={(userId) => setDelegation(prev => ({...prev, ingenieur: userId}))}
                        label="Ingénieur responsable *"
                        placeholder="Sélectionner un ingénieur"
                        roleFilter={['engineer']}
                        required
                      />
                      
                      <UserSelector
                        value={delegation.inspecteur || ""}
                        onChange={(userId) => setDelegation(prev => ({...prev, inspecteur: userId}))}
                        label="Inspecteur qualité"
                        placeholder="Sélectionner un inspecteur"
                        roleFilter={['inspector', 'engineer']}
                      />
                      
                      <UserSelector
                        value={delegation.coordinateur_hse || ""}
                        onChange={(userId) => setDelegation(prev => ({...prev, coordinateur_hse: userId}))}
                        label="Coordinateur HSE"
                        placeholder="Sélectionner un coordinateur HSE"
                        roleFilter={['inspector', 'manager']}
                      />
                    </div>
                  </div>
                  
                  {/* External Team - Suppliers/Contractors */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Contractants & Fournisseurs
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
                  <h3 className="text-lg font-semibold mb-4">Organogramme Temporel du Projet</h3>
                  <div className="border rounded-lg p-4">
                    <OrganizationalHierarchyManager />
                  </div>
                </div>
                
                {/* Delegation Summary */}
                {Object.keys(delegation).length > 0 && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h4 className="font-medium mb-3">Résumé des Délégations:</h4>
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
                  <h4 className="font-medium mb-2">Méthodologies Disponibles:</h4>
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
                <div className="border rounded-lg p-4">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Gestionnaire de phases sera intégré ici</p>
                    <Button variant="outline" className="mt-2">Configurer les Phases</Button>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse du projet *</label>
                    <textarea 
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows={3}
                      placeholder="Adresse complète du site de construction..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Coordonnées GPS</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg"
                          placeholder="Latitude"
                          step="0.000001"
                        />
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg"
                          placeholder="Longitude"
                          step="0.000001"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Surface (m²)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg"
                        placeholder="Surface totale du projet"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Interactive Map - Use existing component */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Carte Interactive & Localisation</h4>
                  <div className="h-96 bg-muted rounded border flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Carte interactive sera affichée ici</p>
                    </div>
                  </div>
                </div>
                
                {/* Shape Tracing - Use existing component */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Délimitation des Zones de Travail</h4>
                  <div className="bg-muted/50 p-3 rounded mb-3 text-sm">
                    <strong>Instructions:</strong> Utilisez les outils de traçage pour délimiter les zones de construction, stockage, et accès.
                  </div>
                  <div className="h-64 bg-background rounded border flex items-center justify-center">
                    <div className="text-center">
                      <Building className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground text-sm">Outils de traçage seront disponibles ici</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('geolocation')}>
                    Valider la Géolocalisation
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
              
              <div className="flex justify-end">
                <Button onClick={() => handleStepComplete('resources')}>
                  Valider les Ressources
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
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('risks')}>
                    Valider la Gestion des Risques
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
                
                <div className="flex justify-between">
                  <Button variant="outline">
                    Sauvegarder comme Brouillon
                  </Button>
                  <Button 
                    onClick={() => {
                      handleStepComplete('compliance');
                      onSubmit({
                        stakeholders,
                        delegation,
                        risks,
                        compliance,
                        selectedMaterials
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