import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Calendar, MapPin, Building, User, HardHat, Clock, FileText, CreditCard } from 'lucide-react';
import InteractiveMap from '@/components/map/InteractiveMap';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  position?: string | null;
  department?: string | null;
}

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
  project_responsable_id?: string;
  main_contractor?: string;
  project_reference?: string;
  allows_initial_payment?: boolean;
  initial_payment_percentage?: number;
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
    project_responsable_id: '',
    main_contractor: '',
    project_reference: '',
    allows_initial_payment: false,
    initial_payment_percentage: 0,
    ...initialData
  });

  const [facilitiesMapData, setFacilitiesMapData] = useState<MapData>({
    center: undefined,
    polygon: [],
    warehouseShape: [],
    address: '',
    shapeType: undefined
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setEmployees(data || []);
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

  const handleMapDataChange = (data: MapData) => {
    console.log('Map data changed:', data);
    setFacilitiesMapData(data);
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
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-1 h-auto p-1">
          <TabsTrigger value="basic" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Informations</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Équipe</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Chronologie</span>
            <span className="sm:hidden">Dates</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Détails</span>
            <span className="sm:hidden">Plus</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Paiement</span>
            <span className="sm:hidden">Pay</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex flex-col items-center gap-1 p-2 text-xs md:text-sm">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Localisation</span>
            <span className="sm:hidden">Map</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <Label htmlFor="budget">Budget (MRO)</Label>
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

        {/* Team & Contractors Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Équipe et Contractants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project_responsable_id">Responsable du projet</Label>
                  <Select 
                    value={formData.project_responsable_id || 'no-selection'} 
                    onValueChange={(value) => handleChange('project_responsable_id', value === 'no-selection' ? '' : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-selection">Aucun responsable assigné</SelectItem>
                      {employees.map((employee) => (
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
                  <Label htmlFor="main_contractor">Contractant principal</Label>
                  <Input
                    id="main_contractor"
                    value={formData.main_contractor}
                    onChange={(e) => handleChange('main_contractor', e.target.value)}
                    placeholder="Nom du contractant principal"
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600">
                    Nom de l'entreprise ou du contractant principal (optionnel)
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="financing_source">Source de financement</Label>
                  <Input
                    id="financing_source"
                    value={formData.financing_source}
                    onChange={(e) => handleChange('financing_source', e.target.value)}
                    placeholder="Gouvernement, Privé, etc."
                  />
                </div>
                
                <div>
                  <Label htmlFor="market_type">Type de marché</Label>
                  <Select value={formData.market_type} onValueChange={(value) => handleChange('market_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Marché public</SelectItem>
                      <SelectItem value="private">Marché privé</SelectItem>
                      <SelectItem value="mixed">Marché mixte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="selection_mode">Mode de sélection</Label>
                  <Select value={formData.selection_mode} onValueChange={(value) => handleChange('selection_mode', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appel_offres">Appel d'offres</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="gre_gre">Gré à gré</SelectItem>
                      <SelectItem value="concours">Concours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
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

        {/* Location Tab - CRITICAL: Preserve all map/GPS functionality */}
        <TabsContent value="location" className="space-y-6">
          <InteractiveMap
            title="Localisation et zone d'entrepôt du projet"
            description="Définissez la position GPS du projet et tracez la zone des installations/entrepôts"
            value={facilitiesMapData}
            onChange={handleMapDataChange}
            allowPolygon={true}
            className="min-h-[600px]"
          />
          
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

      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
        <Button 
          type="submit" 
          className="bg-adrar-600 hover:bg-adrar-700 w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le projet'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectFormWithMap;
