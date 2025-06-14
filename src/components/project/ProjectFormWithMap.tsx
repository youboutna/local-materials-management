
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Building, User, HardHat } from 'lucide-react';
import InteractiveMap from '@/components/map/InteractiveMap';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  full_name: string;
  position?: string;
  department?: string;
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
}

interface MapData {
  center?: { lat: number; lng: number };
  polygon?: { lat: number; lng: number }[];
  address?: string;
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
    ...initialData
  });

  const [facilitiesMapData, setFacilitiesMapData] = useState<MapData>({
    center: undefined,
    polygon: [],
    address: ''
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

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
    setFacilitiesMapData(data);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      facilitiesLocation: facilitiesMapData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations du projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              required
            />
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

      {/* Project Team & Contractor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Équipe et Contractants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_responsable_id">Responsable du projet</Label>
              <Select 
                value={formData.project_responsable_id} 
                onValueChange={(value) => handleChange('project_responsable_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun responsable assigné</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                      {employee.position && ` - ${employee.position}`}
                      {employee.department && ` (${employee.department})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="main_contractor">Contractant principal</Label>
              <Input
                id="main_contractor"
                value={formData.main_contractor}
                onChange={(e) => handleChange('main_contractor', e.target.value)}
                placeholder="Nom du contractant principal"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Chronologie
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

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Détails du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Project Facilities Location Map */}
      <InteractiveMap
        title="Localisation des installations du projet"
        description="Définissez la position GPS du projet et tracez la zone des installations"
        value={facilitiesMapData}
        onChange={handleMapDataChange}
        allowPolygon={true}
      />

      <div className="flex justify-end gap-4">
        <Button type="submit" className="bg-adrar-600 hover:bg-adrar-700">
          Enregistrer le projet
        </Button>
      </div>
    </form>
  );
};

export default ProjectFormWithMap;
