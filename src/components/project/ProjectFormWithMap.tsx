import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Building, User, HardHat, Clock, FileText, CreditCard, Settings, Save, CheckCircle } from 'lucide-react';
import InteractiveMapGIS from '../materials/InteractiveMapGIS';
import ProjectPhases from '@/components/project/ProjectPhases';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import TenderProjectFields from '@/components/projects/TenderProjectFields';
import { supabase } from '@/integrations/supabase/client';
import { ConstructionPhase, ConstructionStage } from '@/dtos/entities/ProjectDTO';
import { PhaseData, CustomPhase } from '@/dtos/entities/PhaseDTO';

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
}

// Use PhaseData and CustomPhase from PhaseDTO.ts instead of local definitions

interface ProjectFormData {
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
  launch_date?: string;
  attribution_date?: string;
  project_responsable_id?: string;
  main_contractor?: string;
  engineering_consultant?: string;
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
  // Construction workflow fields
  current_phase?: ConstructionPhase;
  current_stage?: ConstructionStage;
  phases?: PhaseData[];
}

interface MapData {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  warehouseShape?: { lat: number; lng: number }[];
  address?: string;
  shapeType?: "polygon" | "rectangle" | "circle" | "diamond";
}

interface ProjectFormWithMapProps {
  onSubmit: (data: ProjectFormData & { facilitiesLocation?: MapData }) => void;
  initialData?: Partial<ProjectFormData>;
}

const ProjectFormWithMap: React.FC<ProjectFormWithMapProps> = ({
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
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
    launch_date: '',
    attribution_date: '',
    project_responsable_id: '',
    main_contractor: '',
    engineering_consultant: '',
    project_reference: '',
    allows_initial_payment: false,
    initial_payment_percentage: 0,
    current_phase: 'pre_construction',
    current_stage: 'planningDesign' as ConstructionStage,
    ...initialData
  });

  const [facilitiesMapData, setFacilitiesMapData] = useState<MapData>(() => {
    // Initialize with facilitiesLocation data if available in initialData
    const facilitiesLocation = (initialData as any)?.facilitiesLocation;
    if (facilitiesLocation) {
      return {
        center: facilitiesLocation.center,
        polygon: facilitiesLocation.polygon || [],
        warehouseShape: facilitiesLocation.warehouseShape || facilitiesLocation.polygon || [],
        address: facilitiesLocation.address || '',
        shapeType: facilitiesLocation.shapeType
      };
    }
    
    return {
      center: undefined,
      polygon: [],
      warehouseShape: [],
      address: '',
      shapeType: undefined
    };
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractorSupplier, setContractorSupplier] = useState<{
    id?: string;
    name: string;
    contact: string;
    leadTime: number;
  }>(() => {
    // Initialize with main_contractor data from initialData if available
    const mainContractor = initialData?.main_contractor || '';
    return {
      name: mainContractor,
      contact: initialData?.mainContractorContact || '',
      leadTime: 7
    };
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

  const [phases, setPhases] = useState<PhaseData[]>(formData.phases || []);

  // Load employees for project responsable selection
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name, position, department')
          .eq('is_active', true)
          .order('full_name');

        if (error) throw error;
        setEmployees((data || []).filter(d => d.id && d.full_name).map(d => ({ id: d.id!, full_name: d.full_name!, position: d.position || '', department: d.department || '' })) as Employee[]);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhaseChange = (phase: ConstructionPhase) => {
    handleChange('current_phase', phase);
  };

  const handleStageChange = (stage: ConstructionStage) => {
    handleChange('current_stage', stage);
  };

  const handleMapDataChange = (data: any) => {
    console.log('Map data changed:', data);
    
    // Map from InteractiveMapGIS format to ProjectFormWithMap format
    const mappedData: MapData = {
      center: data.coordinates ? data.coordinates : data.center,
      polygon: data.shape || data.polygon || [],
      warehouseShape: data.shape || data.warehouseShape || [],
      address: data.address || '',
      shapeType: data.shapeType
    };
    
    setFacilitiesMapData(mappedData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        phases: phases,
        facilitiesLocation: facilitiesMapData
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 h-auto p-1 bg-muted/50 rounded-lg overflow-x-auto">
          <TabsTrigger value="basic" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Informations</span>
            <span className="sm:hidden font-medium">Info</span>
          </TabsTrigger>
          <TabsTrigger value="construction" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Construction</span>
            <span className="sm:hidden font-medium">Phases</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Équipe</span>
            <span className="sm:hidden font-medium">Team</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Chronologie</span>
            <span className="sm:hidden font-medium">Dates</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Paiement</span>
            <span className="sm:hidden font-medium">Pay</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Localisation</span>
            <span className="sm:hidden font-medium">Map</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex flex-col items-center gap-1 p-3 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-md">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">Détails</span>
            <span className="sm:hidden font-medium">Plus</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations du projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre du projet</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Localisation</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    required
                  />
                </div>
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
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Label htmlFor="budget">Budget (MRU)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => handleChange('budget', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="team_size">Taille de l'équipe</Label>
                  <Input
                    id="team_size"
                    type="number"
                    min="1"
                    value={formData.team_size}
                    onChange={(e) => handleChange('team_size', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Construction Phase Tab */}
        <TabsContent value="construction" className="space-y-6">
          <ProjectPhases
            formMode={true}
            initialPhases={phases}
            onPhasesChange={setPhases}
            projectBudget={formData.budget}
          />
        </TabsContent>

        {/* Team & Contractors Tab - Updated with supplier selector */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Équipe et Contractants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project_responsable_id">Chef de projet / Manager</Label>
                  <Select 
                    value={formData.project_responsable_id || 'no-selection'} 
                    onValueChange={(value) => handleChange('project_responsable_id', value === 'no-selection' ? '' : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un manager" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-[100]">
                      <SelectItem value="no-selection">Aucun manager assigné</SelectItem>
                      {employees.filter(emp => 
                        emp.position?.toLowerCase().includes('manager') || 
                        emp.position?.toLowerCase().includes('chef') ||
                        emp.position?.toLowerCase().includes('directeur') ||
                        emp.department?.toLowerCase().includes('management')
                      ).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.full_name}</span>
                            {(employee.position || employee.department) && (
                              <span className="text-sm text-gray-500">
                                {employee.position && employee.department 
                                  ? `${employee.position} - ${employee.department}`
                                  : employee.position || employee.department
                                }
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      {employees.filter(emp => 
                        !(emp.position?.toLowerCase().includes('manager') || 
                          emp.position?.toLowerCase().includes('chef') ||
                          emp.position?.toLowerCase().includes('directeur') ||
                          emp.department?.toLowerCase().includes('management'))
                      ).map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{employee.full_name}</span>
                            {(employee.position || employee.department) && (
                              <span className="text-sm text-gray-500">
                                {employee.position && employee.department 
                                  ? `${employee.position} - ${employee.department}`
                                  : employee.position || employee.department
                                }
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    Sélectionnez l'employé responsable de ce projet
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Contractant principal</Label>
                  <SupplierSelector
                    value={contractorSupplier}
                    onChange={handleContractorChange}
                    allowCustom={true}
                  />
                  <p className="text-sm text-gray-600">
                    Sélectionnez un fournisseur existant ou saisissez un contractant personnalisé
                  </p>
                </div>
              </div>

              {/* Engineering Consultant */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Consultant Ingénierie</h3>
                <div className="space-y-2">
                  <Label>Bureau d'études / Consultant</Label>
                  <SupplierSelector
                    value={engineeringConsultant}
                    onChange={handleEngineeringConsultantChange}
                    allowCustom={true}
                  />
                  <p className="text-sm text-gray-600">
                    Bureau d'études ou consultant technique pour le projet.
                  </p>
                </div>
              </div>

              {loadingEmployees && (
                <div className="flex items-center justify-center p-4">
                  <div className="text-sm text-gray-500">Chargement des employés...</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chronologie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Date de début</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Date de fin</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Détails du projet
              </CardTitle>
            </CardHeader>
            <TenderProjectFields
              formData={{
                launchDate: formData.launch_date,
                attributionDate: formData.attribution_date,
                marketType: formData.market_type,
                selectionMode: formData.selection_mode,
                financingSource: formData.financing_source,
                projectReference: formData.project_reference
              }}
              onChange={(field, value) => {
                const fieldMap: Record<string, string> = {
                  'launchDate': 'launch_date',
                  'attributionDate': 'attribution_date',
                  'marketType': 'market_type',
                  'selectionMode': 'selection_mode',
                  'financingSource': 'financing_source',
                  'projectReference': 'project_reference'
                };
                handleChange(fieldMap[field] || field, value);
              }}
              readOnly={false}
            />
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paramètres de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allows_initial_payment"
                  checked={formData.allows_initial_payment}
                  onCheckedChange={(checked) => handleChange('allows_initial_payment', checked)}
                />
                <Label htmlFor="allows_initial_payment" className="text-sm font-medium">
                  Autoriser le paiement initial (0-30%)
                </Label>
              </div>
              
              {formData.allows_initial_payment && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label htmlFor="initial_payment_percentage">Pourcentage de paiement initial autorisé (%)</Label>
                    <Input
                      id="initial_payment_percentage"
                      type="number"
                      min="0"
                      max="30"
                      value={formData.initial_payment_percentage}
                      onChange={(e) => handleChange('initial_payment_percentage', parseFloat(e.target.value) || 0)}
                      className="mt-2"
                    />
                    <p className="text-sm text-blue-600 mt-2">
                      Ce pourcentage permet un paiement anticipé selon les termes du contrat (maximum 30%)
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Note :</strong> Le paiement initial ne sera autorisé que si le contrat le permet explicitement. 
                      Cette option facilite le démarrage des projets nécessitant des investissements initiaux importants.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Tab - Fixed to prevent render2 error */}
        <TabsContent value="location" className="space-y-6">
          <div className="w-full">
            <InteractiveMapGIS
              title="Localisation et zone d'entrepôt du projet"
              description="Définissez la position GPS du projet et tracez la zone des installations/entrepôts"
              value={{
                coordinates: facilitiesMapData.center,
                shape: facilitiesMapData.warehouseShape || facilitiesMapData.polygon || [],
                address: facilitiesMapData.address,
                shapeType: facilitiesMapData.shapeType
              }}
              onChange={handleMapDataChange}
              allowPolygon={true}
              className="min-h-[600px]"
            />
          </div>
          
          {/* Display current map data for debugging */}
          {(facilitiesMapData.center || facilitiesMapData.warehouseShape?.length) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Données de localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {facilitiesMapData.center && (
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-green-800">Position GPS du projet:</p>
                    <p className="text-sm text-green-700 font-mono">
                      Latitude: {facilitiesMapData.center.lat.toFixed(6)}, 
                      Longitude: {facilitiesMapData.center.lng.toFixed(6)}
                    </p>
                  </div>
                )}
                
                {facilitiesMapData.warehouseShape && facilitiesMapData.warehouseShape.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Zone d'entrepôt tracée:</p>
                    <p className="text-sm text-blue-700">
                      Type: {facilitiesMapData.shapeType || 'polygon'} - {facilitiesMapData.warehouseShape.length} points
                    </p>
                  </div>
                )}
                
                {facilitiesMapData.address && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-800">Adresse:</p>
                    <p className="text-sm text-gray-700">{facilitiesMapData.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CheckCircle className="h-4 w-4" />
          <span>Tous les champs obligatoires sont remplis</span>
        </div>
        <Button 
          type="submit" 
          className="group relative overflow-hidden bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground shadow-elegant hover:shadow-glow transition-all duration-300 transform hover:scale-105 w-full sm:w-auto px-8 py-3"
          disabled={isSubmitting}
        >
          <div className="flex items-center gap-3">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5 transition-transform group-hover:rotate-12" />
                <span className="font-medium">Enregistrer le projet</span>
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </Button>
      </div>
    </form>
  );
};

export default ProjectFormWithMap;
