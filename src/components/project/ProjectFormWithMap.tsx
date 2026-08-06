/**
 * ProjectFormWithMap - Formulaire de projet avec carte et zones d'intervention
 * 
 * Architecture Hexagonale :
 * - Utilise les DTOs pour les types
 * - GeoZoneEditor pour les zones d'intervention
 * - Services hexagonaux pour les données (EmployeeService, SupplierService)
 * - Pas d'appels directs à Supabase
 * - Communication via services et DTOs
 * - useMemo pour stabiliser les dépendances des hooks
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Building, User, FileText, CreditCard, Settings, Save, CheckCircle } from 'lucide-react';
import UnifiedLocationSelector from '@/components/location/UnifiedLocationSelector';
import GeoZoneEditor from '@/components/gis/GeoZoneEditor';
import type { InterventionZoneDTO } from '@/dtos/entities/InterventionZoneDTO';
import type { PhaseData } from '@/dtos/entities/PhaseDTO';
import type { ConstructionPhase, ConstructionStage } from '@/dtos/entities/ProjectDTO';
import { ProjectPhases } from '@/components/project/ProjectPhases';
import SupplierSelector from '@/components/suppliers/SupplierSelector';
import TenderProjectFields from '@/components/projects/TenderProjectFields';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { EmployeeService } from '@/application/services/EmployeeService';
import { SupplierService } from '@/application/services/SupplierService';

// ============================================================================
// INTERFACES (uniquement pour les props du composant)
// ============================================================================

interface EmployeeDTO {
  id: string;
  fullName: string;
  position?: string | null;
  department?: string | null;
}

interface ProjectFormData {
  title: string;
  description: string;
  location: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectManagerId?: string;
  mainContractor?: string;
  engineeringConsultant?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  phases?: PhaseData[];
  interventionZones?: InterventionZoneDTO[];
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

interface SupplierData {
  id?: string;
  name: string;
  contact: string;
  leadTime: number;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const ProjectFormWithMap: React.FC<ProjectFormWithMapProps> = ({
  onSubmit,
  initialData
}) => {
  // ============ Services hexagonaux (stabilisés avec useMemo) ============
  const employeeService = useMemo(
    () => new EmployeeService(RepositoryFactory.getEmployeeRepository()),
    []
  );
  
  const supplierService = useMemo(
    () => new SupplierService(RepositoryFactory.getSupplierRepository()),
    []
  );

  // ============ State ============
  const [formData, setFormData] = useState<ProjectFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    status: initialData?.status || 'Planning',
    budget: initialData?.budget || 0,
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    teamSize: initialData?.teamSize || 1,
    financingSource: initialData?.financingSource || '',
    marketType: initialData?.marketType || '',
    selectionMode: initialData?.selectionMode || '',
    launchDate: initialData?.launchDate || '',
    attributionDate: initialData?.attributionDate || '',
    projectManagerId: initialData?.projectManagerId || '',
    mainContractor: initialData?.mainContractor || '',
    engineeringConsultant: initialData?.engineeringConsultant || '',
    projectReference: initialData?.projectReference || '',
    allowsInitialPayment: initialData?.allowsInitialPayment || false,
    initialPaymentPercentage: initialData?.initialPaymentPercentage || 0,
    currentPhase: initialData?.currentPhase || 'pre_construction',
    currentStage: initialData?.currentStage || 'planningDesign',
    phases: initialData?.phases || [],
    interventionZones: (initialData as any)?.interventionZones || [],
  });

  const [facilitiesMapData, setFacilitiesMapData] = useState<MapData>(() => {
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

  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contractorSupplier, setContractorSupplier] = useState<SupplierData>({
    name: initialData?.mainContractor || '',
    contact: (initialData as any)?.mainContractorContact || '',
    leadTime: 7
  });

  const [engineeringConsultantSupplier, setEngineeringConsultantSupplier] = useState<SupplierData>({
    name: initialData?.engineeringConsultant || '',
    contact: '',
    leadTime: 7
  });

  const [phases, setPhases] = useState<PhaseData[]>(formData.phases || []);

  // ============ Effets ============
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Utilisation du service hexagonal EmployeeService (stabilisé)
        const employeesData = await employeeService.getAllEmployees();
        setEmployees(employeesData.map(e => ({
          id: e.id,
          fullName: e.fullName || e.full_name || 'Employé',
          position: e.position || e.role || null,
          department: e.department || null
        })));
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [employeeService]); // employeeService est stable grâce à useMemo

  // ============ Handlers ============
  const handleChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMapDataChange = (data: any) => {
    const mappedData: MapData = {
      center: data.coordinates || data.center,
      polygon: data.shape || data.polygon || [],
      warehouseShape: data.shape || data.warehouseShape || [],
      address: data.address || '',
      shapeType: data.shapeType
    };
    setFacilitiesMapData(mappedData);
  };

  const handleContractorChange = (supplier: SupplierData) => {
    setContractorSupplier(supplier);
    handleChange('mainContractor', supplier.name);
  };

  const handleEngineeringConsultantChange = (supplier: SupplierData) => {
    setEngineeringConsultantSupplier(supplier);
    handleChange('engineeringConsultant', supplier.name);
  };

  const handleInterventionZonesChange = (zones: InterventionZoneDTO[]) => {
    handleChange('interventionZones', zones);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.location) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        phases: phases,
        facilitiesLocation: facilitiesMapData,
        interventionZones: formData.interventionZones,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ Rendu ============
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-1 h-auto p-1 bg-muted/50 rounded-lg overflow-x-auto">
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

        {/* ===== Basic Information Tab ===== */}
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
                <Label htmlFor="projectReference">Référence du projet</Label>
                <Input
                  id="projectReference"
                  value={formData.projectReference}
                  onChange={(e) => handleChange('projectReference', e.target.value)}
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
                  <Label htmlFor="teamSize">Taille de l'équipe</Label>
                  <Input
                    id="teamSize"
                    type="number"
                    min="1"
                    value={formData.teamSize}
                    onChange={(e) => handleChange('teamSize', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Construction Phase Tab ===== */}
        <TabsContent value="construction" className="space-y-6">
          <ProjectPhases
            formMode={true}
            initialPhases={phases}
            onPhasesChange={setPhases}
            projectBudget={formData.budget}
          />
        </TabsContent>

        {/* ===== Team & Contractors Tab ===== */}
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
                  <Label htmlFor="projectManagerId">Chef de projet / Manager</Label>
                  <Select 
                    value={formData.projectManagerId || 'no-selection'} 
                    onValueChange={(value) => handleChange('projectManagerId', value === 'no-selection' ? '' : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un manager" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-[100]">
                      <SelectItem value="no-selection">Aucun manager assigné</SelectItem>
                      {loadingEmployees ? (
                        <SelectItem value="loading" disabled>Chargement...</SelectItem>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{employee.fullName}</span>
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
                        ))
                      )}
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Consultant Ingénierie</h3>
                <div className="space-y-2">
                  <Label>Bureau d'études / Consultant</Label>
                  <SupplierSelector
                    value={engineeringConsultantSupplier}
                    onChange={handleEngineeringConsultantChange}
                    allowCustom={true}
                  />
                  <p className="text-sm text-gray-600">
                    Bureau d'études ou consultant technique pour le projet.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Timeline Tab ===== */}
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
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Project Details Tab ===== */}
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
                launchDate: formData.launchDate || '',
                attributionDate: formData.attributionDate || '',
                marketType: formData.marketType || '',
                selectionMode: formData.selectionMode || '',
                financingSource: formData.financingSource || '',
                projectReference: formData.projectReference || ''
              }}
              onChange={(field, value) => {
                const fieldMap: Record<string, string> = {
                  'launchDate': 'launchDate',
                  'attributionDate': 'attributionDate',
                  'marketType': 'marketType',
                  'selectionMode': 'selectionMode',
                  'financingSource': 'financingSource',
                  'projectReference': 'projectReference'
                };
                handleChange(fieldMap[field] as keyof ProjectFormData, value);
              }}
              readOnly={false}
            />
          </Card>
        </TabsContent>

        {/* ===== Payment Settings Tab ===== */}
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
                  id="allowsInitialPayment"
                  checked={formData.allowsInitialPayment}
                  onCheckedChange={(checked) => handleChange('allowsInitialPayment', checked)}
                />
                <Label htmlFor="allowsInitialPayment" className="text-sm font-medium">
                  Autoriser le paiement initial (0-30%)
                </Label>
              </div>
              
              {formData.allowsInitialPayment && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label htmlFor="initialPaymentPercentage">Pourcentage de paiement initial autorisé (%)</Label>
                    <Input
                      id="initialPaymentPercentage"
                      type="number"
                      min="0"
                      max="30"
                      value={formData.initialPaymentPercentage}
                      onChange={(e) => handleChange('initialPaymentPercentage', parseFloat(e.target.value) || 0)}
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

        {/* ===== Location Tab ===== */}
        <TabsContent value="location" className="space-y-6">
          <div className="w-full">
            <UnifiedLocationSelector
              value={{
                address: facilitiesMapData.address,
                latitude: facilitiesMapData.center?.lat,
                longitude: facilitiesMapData.center?.lng,
              }}
              onChange={(loc) => {
                handleMapDataChange({
                  coordinates: loc.latitude != null && loc.longitude != null ? { lat: loc.latitude, lng: loc.longitude } : undefined,
                  address: loc.address,
                });
              }}
              showMap
              showCoordinates
              showGPS
            />
          </div>

          {/* Zones d'intervention avec GeoZoneEditor hexagonal */}
          <GeoZoneEditor
            value={formData.interventionZones || []}
            onChange={handleInterventionZonesChange}
            title="Zones d'intervention (bénéficiaires)"
            hint="Tracez une ou plusieurs zones — polygones, rectangles, cercles ou points. Import GeoJSON supporté."
            height={520}
            defaultCenter={facilitiesMapData.center ? [facilitiesMapData.center.lat, facilitiesMapData.center.lng] : [18.0735, -15.9582]}
          />
          
          {/* Affichage des données de localisation */}
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
                      Type: {facilitiesMapData.shapeType || 'polygone'} - {facilitiesMapData.warehouseShape.length} points
                    </p>
                  </div>
                )}
                
                {facilitiesMapData.address && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-800">Adresse:</p>
                    <p className="text-sm text-gray-700">{facilitiesMapData.address}</p>
                  </div>
                )}

                {formData.interventionZones && formData.interventionZones.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-purple-800">Zones d'intervention:</p>
                    <p className="text-sm text-purple-700">
                      {formData.interventionZones.length} zone(s) définie(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ===== Submit Button ===== */}
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