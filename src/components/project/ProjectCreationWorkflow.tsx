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
                          onChange={(supplierId) => {
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
                            {stakeholder.type.replace('_', ' ')} - {stakeholder.source === 'supplier' ? 'Fournisseur' : 'Employé'}
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

        {/* Team & Organizational Template */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-500" />
                Organogramme & Délégation de Réalisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Organizational Template */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Modèle Organisationnel
                    </h3>
                    
                    <OrganizationalHierarchyManager />
                  </div>
                  
                  {/* Delegation Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Délégation de Réalisation
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Délégué Maître d'Ouvrage</label>
                        <UserSelector
                          value={delegation.maitre_ouvrage || ""}
                          onChange={(userId) => setDelegation(prev => ({ ...prev, maitre_ouvrage: userId }))}
                          label=""
                          placeholder="Sélectionner le délégué"
                          roleFilter={['director', 'manager']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Délégué Technique</label>
                        <UserSelector
                          value={delegation.technique || ""}
                          onChange={(userId) => setDelegation(prev => ({ ...prev, technique: userId }))}
                          label=""
                          placeholder="Sélectionner le délégué technique"
                          roleFilter={['engineer', 'manager']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Délégué Financier</label>
                        <UserSelector
                          value={delegation.financier || ""}
                          onChange={(userId) => setDelegation(prev => ({ ...prev, financier: userId }))}
                          label=""
                          placeholder="Sélectionner le délégué financier"
                          roleFilter={['admin', 'manager']}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Délégué Sécurité</label>
                        <UserSelector
                          value={delegation.securite || ""}
                          onChange={(userId) => setDelegation(prev => ({ ...prev, securite: userId }))}
                          label=""
                          placeholder="Sélectionner le délégué sécurité"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Niveau de Délégation</label>
                        <select 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={delegation.niveau || ""}
                          onChange={(e) => setDelegation(prev => ({ ...prev, niveau: e.target.value }))}
                        >
                          <option value="">Sélectionner le niveau</option>
                          <option value="operationnel">Opérationnel</option>
                          <option value="strategique">Stratégique</option>
                          <option value="total">Délégation Totale</option>
                          <option value="partiel">Délégation Partielle</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Durée de Délégation</label>
                        <input 
                          type="date"
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          value={delegation.duree || ""}
                          onChange={(e) => setDelegation(prev => ({ ...prev, duree: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('team')}>
                    Valider l'Organisation
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

        {/* Phases & Planning */}
        <TabsContent value="phases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-500" />
                Phases & Planification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Chronologie du Projet</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de Début *</label>
                        <input 
                          type="date" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Date de Fin Prévue *</label>
                        <input 
                          type="date" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Durée Estimée (mois)</label>
                        <input 
                          type="number" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="12"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Phases Principales</h3>
                    
                    <div className="space-y-3">
                      {[
                        { name: 'Études & Conception', duration: '2 mois', status: 'planned' },
                        { name: 'Préparation du Site', duration: '1 mois', status: 'planned' },
                        { name: 'Fondations & Gros Œuvre', duration: '4 mois', status: 'planned' },
                        { name: 'Second Œuvre', duration: '3 mois', status: 'planned' },
                        { name: 'Finitions & Livraison', duration: '2 mois', status: 'planned' }
                      ].map((phase, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{phase.name}</h4>
                              <p className="text-sm text-gray-600">Durée: {phase.duration}</p>
                            </div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              Planifiée
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('phases')}>
                    Valider la Planification
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Localisation du Projet</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Adresse Complète *</label>
                        <input 
                          type="text" 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Adresse du site de construction"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Latitude</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="18.0735"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Longitude</label>
                          <input 
                            type="text" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="-15.9582"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Zone Administrative</label>
                        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="">Sélectionner une zone</option>
                          <option value="nouakchott">Nouakchott</option>
                          <option value="nouadhibou">Nouadhibou</option>
                          <option value="atar">Atar</option>
                          <option value="zouerate">Zouérate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Zones d'Intervention</h3>
                    
                    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Carte Interactive</p>
                      <p className="text-sm text-gray-500">
                        Cliquez pour définir les zones de travail et délimiter le périmètre du projet
                      </p>
                      <Button variant="outline" className="mt-3">
                        Ouvrir la Carte
                      </Button>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Surface du Terrain (m²)</label>
                      <input 
                        type="number" 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="1000"
                        min="0"
                      />
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
                      {[
                        { type: 'Technique', risk: 'Difficultés géotechniques', level: 'Moyen' },
                        { type: 'Financier', risk: 'Dépassement de budget', level: 'Élevé' },
                        { type: 'Planning', risk: 'Retards de livraison', level: 'Moyen' },
                        { type: 'Climatique', risk: 'Conditions météorologiques', level: 'Faible' }
                      ].map((risk, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Badge variant="outline">{risk.type}</Badge>
                            <Badge variant={risk.level === 'Élevé' ? 'destructive' : risk.level === 'Moyen' ? 'default' : 'secondary'}>
                              {risk.level}
                            </Badge>
                          </div>
                          <p className="text-sm">{risk.risk}</p>
                          <textarea 
                            className="w-full mt-2 p-2 text-xs border rounded focus:ring-1 focus:ring-primary"
                            placeholder="Plan de mitigation..."
                            rows={2}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Nouveau Risque</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Type de Risque</label>
                        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="">Sélectionner un type</option>
                          <option value="technique">Technique</option>
                          <option value="financier">Financier</option>
                          <option value="planning">Planning</option>
                          <option value="climatique">Climatique</option>
                          <option value="reglementaire">Réglementaire</option>
                          <option value="humain">Ressources Humaines</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Description du Risque</label>
                        <textarea 
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          placeholder="Décrivez le risque identifié..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Niveau de Criticité</label>
                        <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="faible">Faible</option>
                          <option value="moyen">Moyen</option>
                          <option value="eleve">Élevé</option>
                          <option value="critique">Critique</option>
                        </select>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        Ajouter le Risque
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={() => handleStepComplete('risks')}>
                    Valider l'Analyse des Risques
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
                    <h3 className="text-lg font-semibold">Documents Réglementaires</h3>
                    
                    <div className="space-y-3">
                      {[
                        { doc: 'Permis de Construire', required: true, status: 'pending' },
                        { doc: 'Étude d\'Impact Environnemental', required: true, status: 'pending' },
                        { doc: 'Autorisation de Voirie', required: false, status: 'pending' },
                        { doc: 'Certificat d\'Urbanisme', required: true, status: 'pending' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" className="rounded border-gray-300" />
                            <div>
                              <p className="font-medium text-sm">{item.doc}</p>
                              {item.required && <Badge variant="destructive" className="text-xs">Obligatoire</Badge>}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            En attente
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <Button variant="outline" className="w-full">
                      Ajouter un Document
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Validation Finale</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <h4 className="font-semibold text-blue-800 mb-2">Récapitulatif du Projet</h4>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p>• Informations générales: ✓</p>
                          <p>• Parties prenantes: ✓</p>
                          <p>• Équipe & contractants: ✓</p>
                          <p>• Planification: ✓</p>
                          <p>• Géolocalisation: ✓</p>
                          <p>• Ressources: ✓</p>
                          <p>• Gestion des risques: ✓</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <label className="text-sm">
                            Je certifie que toutes les informations fournies sont exactes
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <label className="text-sm">
                            J'accepte les termes et conditions du projet
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300" />
                          <label className="text-sm">
                            Le projet respecte les normes environnementales
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => handleStepComplete('compliance')}>
                    Sauvegarder comme Brouillon
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleStepComplete('compliance');
                      // Submit final project
                    }}
                  >
                    Créer le Projet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <Button 
          variant="outline" 
          onClick={() => {
            const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
            if (currentIndex > 0) {
              setActiveTab(workflowSteps[currentIndex - 1].id);
            }
          }}
          disabled={workflowSteps.findIndex(step => step.id === activeTab) === 0}
        >
          Précédent
        </Button>
        
        <div className="text-sm text-gray-500">
          Étape {workflowSteps.findIndex(step => step.id === activeTab) + 1} sur {workflowSteps.length}
        </div>
        
        <Button 
          onClick={() => {
            const currentIndex = workflowSteps.findIndex(step => step.id === activeTab);
            if (currentIndex < workflowSteps.length - 1) {
              setActiveTab(workflowSteps[currentIndex + 1].id);
            }
          }}
          disabled={workflowSteps.findIndex(step => step.id === activeTab) === workflowSteps.length - 1}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
};

export default ProjectCreationWorkflow;