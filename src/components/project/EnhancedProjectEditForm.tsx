import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Building, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Settings, 
  FileText,
  CreditCard,
  Save,
  Loader2,
  Edit3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import InteractiveMapGIS from '../materials/InteractiveMapGIS';
import EnhancedWorkflowPhaseManager from './EnhancedWorkflowPhaseManager';
import EmployeeSelector from '../selectors/EmployeeSelector';
import SimpleSupplierSelector from '../selectors/SimpleSupplierSelector';
import { ProjectData, ConstructionPhase, ConstructionStage } from '@/types/project';

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
}

interface ProjectEditData {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  team_size: number;
  financing_source?: string;
  market_type?: string;
  selection_mode?: string;
  project_reference?: string;
  project_responsable_id?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  current_phase?: ConstructionPhase;
  current_stage?: ConstructionStage;
  progress: number;
  thumbnail?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  facilitiesLocation?: {
    center?: { lat: number; lng: number };
    polygon?: { lat: number; lng: number }[];
    address?: string;
    shapeType?: string;
  };
}

interface EnhancedProjectEditFormProps {
  projectId: string;
  onSave: (data: ProjectEditData) => Promise<void>;
  onCancel: () => void;
}

export function EnhancedProjectEditForm({ projectId, onSave, onCancel }: EnhancedProjectEditFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [formData, setFormData] = useState<ProjectEditData>({
    id: projectId,
    title: '',
    description: '',
    location: '',
    status: 'Planning',
    budget: 0,
    start_date: '',
    end_date: '',
    team_size: 1,
    financing_source: '',
    market_type: '',
    selection_mode: '',
    project_reference: '',
    project_responsable_id: '',
    main_contractor: '',
    engineering_consultant: '',
    current_phase: 'pre_construction',
    current_stage: 'planning_design',
    progress: 0,
    allows_initial_payment: false,
    initial_payment_percentage: 0,
    facilitiesLocation: {
      center: undefined,
      polygon: [],
      address: '',
      shapeType: undefined
    }
  });

  const [contractorSupplier, setContractorSupplier] = useState<{
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }>({
    name: '',
    contact: '',
    leadTime: 7
  });

  const [engineeringConsultant, setEngineeringConsultant] = useState<{
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }>({
    name: '',
    contact: '',
    leadTime: 7
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load project data on mount
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        setLoading(true);
        
        // Load project basic data
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;

        // Load employees for selection
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, position, department')
          .eq('is_active', true)
          .order('full_name');

        if (employeesError) throw employeesError;

        setEmployees(employeesData || []);

        // Transform project data to form format
        const transformedData: ProjectEditData = {
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          location: project.location || '',
          status: project.status || 'Planning',
          budget: project.budget || 0,
          start_date: project.start_date ? format(new Date(project.start_date), 'yyyy-MM-dd') : '',
          end_date: project.end_date ? format(new Date(project.end_date), 'yyyy-MM-dd') : '',
          team_size: project.team_size || 1,
          financing_source: project.financing_source || '',
          market_type: project.market_type || '',
          selection_mode: project.selection_mode || '',
          project_reference: project.project_reference || '',
          project_responsable_id: project.project_responsable_id || '',
          main_contractor: project.main_contractor || '',
          engineering_consultant: '',
          current_phase: 'pre_construction' as ConstructionPhase,
          current_stage: 'planning_design' as ConstructionStage,
          progress: project.progress || 0,
          thumbnail: project.thumbnail || '',
          allows_initial_payment: project.allows_initial_payment || false,
          initial_payment_percentage: project.initial_payment_percentage || 0,
          facilitiesLocation: {
            center: undefined,
            polygon: [],
            address: '',
            shapeType: undefined
          }
        };

        setFormData(transformedData);

        // Set contractor and consultant data
        setContractorSupplier({
          name: project.main_contractor || '',
          contact: '',
          leadTime: 7
        });

        setEngineeringConsultant({
          name: '',
          contact: '',
          leadTime: 7
        });

        toast({
          title: 'Données chargées',
          description: 'Les informations du projet ont été chargées avec succès'
        });

      } catch (error) {
        console.error('Error loading project data:', error);
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les données du projet',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProjectData();
    }
  }, [projectId, toast]);

  const handleChange = (field: keyof ProjectEditData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleMapDataChange = (data: any) => {
    const mappedData = {
      center: data.coordinates ? data.coordinates : data.center,
      polygon: data.shape || data.polygon || [],
      address: data.address || '',
      shapeType: data.shapeType
    };
    
    handleChange('facilitiesLocation', mappedData);
  };

  const handleContractorChange = (supplier: {
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }) => {
    setContractorSupplier(supplier);
    handleChange('main_contractor', supplier.name);
  };

  const handleEngineeringConsultantChange = (supplier: {
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }) => {
    setEngineeringConsultant(supplier);
    handleChange('engineering_consultant', supplier.name);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.title?.trim()) {
      errors.push('Le titre du projet est obligatoire');
    }
    
    if (!formData.description?.trim()) {
      errors.push('La description du projet est obligatoire');
    }
    
    if (!formData.location?.trim()) {
      errors.push('La localisation du projet est obligatoire');
    }
    
    if (!formData.budget || formData.budget <= 0) {
      errors.push('Le budget doit être supérieur à 0');
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (startDate >= endDate) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    if ((formData.initial_payment_percentage || 0) < 0 || (formData.initial_payment_percentage || 0) > 100) {
      errors.push('Le pourcentage de paiement initial doit être entre 0 et 100');
    }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const errors = validateForm();
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: 'Erreurs de validation',
          description: errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      await onSave(formData);
      
      toast({
        title: 'Projet mis à jour',
        description: 'Les modifications ont été sauvegardées avec succès'
      });

    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: 'Erreur de sauvegarde',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getTabCompletion = (tabId: string): number => {
    switch (tabId) {
      case 'basic':
        const basicRequired = ['title', 'description', 'location'];
        const basicCompleted = basicRequired.filter(field => 
          formData[field as keyof ProjectEditData]?.toString().trim()
        ).length;
        return (basicCompleted / basicRequired.length) * 100;

      case 'team':
        const teamFields = ['project_responsable_id', 'main_contractor', 'engineering_consultant'];
        const teamCompleted = teamFields.filter(field => 
          formData[field as keyof ProjectEditData]?.toString().trim()
        ).length;
        return (teamCompleted / teamFields.length) * 100;

      case 'timeline':
        const timelineFields = ['start_date', 'end_date'];
        const timelineCompleted = timelineFields.filter(field => 
          formData[field as keyof ProjectEditData]?.toString().trim()
        ).length;
        return (timelineCompleted / timelineFields.length) * 100;

      case 'location':
        return formData.facilitiesLocation?.address ? 100 : 0;

      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données du projet...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit3 className="h-8 w-8 text-primary" />
            Édition du projet
          </h1>
          <p className="text-muted-foreground">
            {formData.project_reference && `${formData.project_reference} - `}
            {formData.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="outline" disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Erreurs de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1 h-auto p-1 bg-muted/50 rounded-lg">
          {[
            { id: 'basic', label: 'Informations', icon: Building },
            { id: 'phases', label: 'Phases', icon: Layers },
            { id: 'team', label: 'Équipe', icon: Users },
            { id: 'timeline', label: 'Chronologie', icon: Calendar },
            { id: 'payment', label: 'Paiement', icon: CreditCard },
            { id: 'location', label: 'Localisation', icon: MapPin }
          ].map(tab => {
            const Icon = tab.icon;
            const completion = getTabCompletion(tab.id);
            return (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md"
              >
                <div className="relative">
                  <Icon className="h-4 w-4" />
                  {completion === 100 && (
                    <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-500 bg-background rounded-full" />
                  )}
                </div>
                <span className="font-medium">{tab.label}</span>
                <div className="w-full bg-muted rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre du projet *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Entrez le titre du projet"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="project_reference">Référence du projet</Label>
                  <Input
                    id="project_reference"
                    value={formData.project_reference}
                    onChange={(e) => handleChange('project_reference', e.target.value)}
                    placeholder="Ex: PRJ-2024-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez le projet"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="location">Localisation *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="Ville, Région"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Budget (MRU) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', Number(e.target.value))}
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="team_size">Taille de l'équipe</Label>
                  <Input
                    id="team_size"
                    type="number"
                    value={formData.team_size}
                    onChange={(e) => handleChange('team_size', Number(e.target.value))}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planification</SelectItem>
                      <SelectItem value="InProgress">En cours</SelectItem>
                      <SelectItem value="Pending">En attente</SelectItem>
                      <SelectItem value="OnHold">En pause</SelectItem>
                      <SelectItem value="Completed">Terminé</SelectItem>
                      <SelectItem value="Cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="market_type">Type de marché</Label>
                  <Select value={formData.market_type || ''} onValueChange={(value) => handleChange('market_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Privé</SelectItem>
                      <SelectItem value="mixed">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="selection_mode">Mode de sélection</Label>
                  <Select value={formData.selection_mode || ''} onValueChange={(value) => handleChange('selection_mode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tender">Appel d'offres</SelectItem>
                      <SelectItem value="direct">Attribution directe</SelectItem>
                      <SelectItem value="negotiated">Procédure négociée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="financing_source">Source de financement</Label>
                <Input
                  id="financing_source"
                  value={formData.financing_source}
                  onChange={(e) => handleChange('financing_source', e.target.value)}
                  placeholder="Budget national, privé, international..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Phases Tab */}
        <TabsContent value="phases" className="space-y-6">
          <EnhancedWorkflowPhaseManager
            projectId={projectId}
          />
        </TabsContent>

        {/* Team & Contractors Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Équipe et contractants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="project_responsable_id">Chef de projet / Manager</Label>
                <Select 
                  value={formData.project_responsable_id || 'no-selection'} 
                  onValueChange={(value) => handleChange('project_responsable_id', value === 'no-selection' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-selection">Aucun manager assigné</SelectItem>
                    {employees.filter(emp => 
                      emp.position?.toLowerCase().includes('manager') || 
                      emp.position?.toLowerCase().includes('chef') ||
                      emp.position?.toLowerCase().includes('directeur') ||
                      emp.department?.toLowerCase().includes('management')
                    ).map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.full_name} {emp.position && `- ${emp.position}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Contractant principal</Label>
                <SimpleSupplierSelector
                  value={contractorSupplier.name}
                  onChange={(supplierId) => {
                    // Find supplier by ID and update contractor data
                    handleChange('main_contractor', supplierId);
                  }}
                  placeholder="Sélectionner le contractant principal"
                />
              </div>

              <div>
                <Label>Consultant en ingénierie</Label>
                <SimpleSupplierSelector
                  value={engineeringConsultant.name}
                  onChange={(supplierId) => {
                    // Find supplier by ID and update consultant data
                    handleChange('engineering_consultant', supplierId);
                  }}
                  placeholder="Sélectionner le consultant en ingénierie"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chronologie du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">Date de fin prévue</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              {formData.start_date && formData.end_date && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Durée totale</span>
                    <Badge variant="outline">
                      {Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24))} jours
                    </Badge>
                  </div>
                  <Progress value={formData.progress} className="mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Progression: {formData.progress}%</span>
                    <span>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formData.progress < 100 ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuration des paiements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allows_initial_payment"
                  checked={formData.allows_initial_payment}
                  onCheckedChange={(checked) => handleChange('allows_initial_payment', checked)}
                />
                <Label htmlFor="allows_initial_payment">Autoriser le paiement initial</Label>
              </div>

              {formData.allows_initial_payment && (
                <div>
                  <Label htmlFor="initial_payment_percentage">Pourcentage du paiement initial (%)</Label>
                  <Input
                    id="initial_payment_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.initial_payment_percentage}
                    onChange={(e) => handleChange('initial_payment_percentage', Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Montant: {((formData.budget * (formData.initial_payment_percentage || 0)) / 100).toLocaleString()} MRU
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Géolocalisation et cartographie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <InteractiveMapGIS
                  allowPolygon={true}
                  value={{
                    coordinates: formData.facilitiesLocation?.center,
                    address: formData.facilitiesLocation?.address,
                    shape: formData.facilitiesLocation?.polygon,
                    shapeType: formData.facilitiesLocation?.shapeType as any
                  }}
                  onChange={handleMapDataChange}
                />
              </div>
              {formData.facilitiesLocation?.address && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Adresse sélectionnée:</p>
                  <p className="text-sm text-muted-foreground">{formData.facilitiesLocation.address}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}