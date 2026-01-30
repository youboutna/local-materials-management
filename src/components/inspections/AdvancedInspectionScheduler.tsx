import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, CheckCircle, Bell, Send, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import UserSelector from '@/components/selectors/UserSelector';
import { NotificationService } from '@/application/services/NotificationService';

interface Project {
  id: string;
  title: string;
  location?: string;
  status?: string;
  project_reference?: string | null;
  budget?: number;
  progress?: number;
  contractor_name?: string;
  contractor_contact?: string;
}

interface ProjectStep {
  id: string;
  name: string;
  order_index: number;
  status: string;
  progress?: number;
}

interface AdvancedInspectionSchedulerProps {
  projects: Project[];
  onScheduleInspection: (projectId: string, inspector: string, date: string, additionalData?: any) => Promise<void>;
  preselectedProjectId?: string;
  preselectedStepId?: string;
  preselectedSteps?: ProjectStep[];
}

const INSPECTION_TYPES = [
  { value: 'quality', label: 'Contrôle Qualité' },
  { value: 'safety', label: 'Sécurité' },
  { value: 'progress', label: 'Avancement des Travaux' },
  { value: 'compliance', label: 'Conformité Réglementaire' },
  { value: 'materials', label: 'Contrôle Matériaux' },
  { value: 'structural', label: 'Contrôle Structurel' },
  { value: 'final', label: 'Réception Définitive' }
];

const AdvancedInspectionScheduler: React.FC<AdvancedInspectionSchedulerProps> = ({
  projects,
  onScheduleInspection,
  preselectedProjectId,
  preselectedStepId,
  preselectedSteps = []
}) => {
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [inspectionType, setInspectionType] = useState('');
  const [selectedInspector, setSelectedInspector] = useState('');
  const [inspectionDate, setInspectionDate] = useState('');
  const [targetProgress, setTargetProgress] = useState(0);
  const [requirements, setRequirements] = useState('');
  const [notifyContractor, setNotifyContractor] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inspectorSearch, setInspectorSearch] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedSteps, setSelectedSteps] = useState<string[]>(preselectedStepId ? [preselectedStepId] : []);

  // Fetch phases (as steps) for the selected project
  const { data: projectSteps = [] } = useQuery({
    queryKey: ['project-phases-as-steps', selectedProject?.id],
    queryFn: async () => {
      if (!selectedProject?.id) return [];
      
      // Get phases for this project (phases act as steps in the workflow)
      const { data: phases, error } = await supabase
        .from('project_phases')
        .select('id, phase_name, order_index, status, progress')
        .eq('project_id', selectedProject.id)
        .order('order_index');
      
      if (error) throw error;
      
      return (phases || []).map(p => ({
        id: p.id,
        name: p.phase_name,
        order_index: p.order_index || 0,
        status: p.status || 'pending',
        progress: p.progress || 0
      }));
    },
    enabled: !!selectedProject?.id
  });

  // Combine preselected steps with fetched steps
  const availableSteps = preselectedSteps.length > 0 ? preselectedSteps : projectSteps;

  // Pre-select project on mount
  useEffect(() => {
    if (preselectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.id === preselectedProjectId);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [preselectedProjectId, projects]);

  // Pre-select step on mount
  useEffect(() => {
    if (preselectedStepId) {
      setSelectedSteps([preselectedStepId]);
    }
  }, [preselectedStepId]);

  // Fetch inspectors (employees with inspector position or inspection department)
  const { data: inspectors } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, full_name, phone, position, department')
        .eq('is_active', true)
        .order('full_name');

      if (employeesError) throw employeesError;

      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, contact_person, email, phone, category, nif')
        .eq('is_active', true)
        .order('name');

      if (suppliersError) throw suppliersError;
      
      const allEmployees = employeesData || [];
      const allSuppliers = suppliersData || [];
      
      // Convert suppliers to inspector format
      const supplierInspectors = allSuppliers.map(supplier => ({
        id: supplier.id,
        full_name: supplier.contact_person || supplier.name,
        phone: supplier.phone,
        position: `Responsable - ${supplier.name}`,
        department: supplier.category,
        nif: supplier.nif,
        type: 'supplier' as const
      }));

      // Convert employees to inspector format  
      const employeeInspectors = allEmployees.map(emp => ({
        ...emp,
        nif: null as string | null, // Add nif field for consistency
        type: 'employee' as const
      }));

      // Combine all potential inspectors
      const allInspectors = [...employeeInspectors, ...supplierInspectors];
      
      // Separate into categories
      const inspectors = allInspectors.filter(inspector => 
        inspector.position?.toLowerCase().includes('inspector') ||
        inspector.position?.toLowerCase().includes('inspection') ||
        inspector.department?.toLowerCase().includes('inspection') ||
        inspector.position?.toLowerCase().includes('contrôle') ||
        inspector.position?.toLowerCase().includes('qualité')
      );
      
      const engineeringConsultants = allInspectors.filter(inspector => 
        inspector.position?.toLowerCase().includes('consultant') ||
        inspector.position?.toLowerCase().includes('ingénieur') ||
        inspector.position?.toLowerCase().includes('engineer') ||
        inspector.department?.toLowerCase().includes('ingénierie') ||
        inspector.department?.toLowerCase().includes('engineering') ||
        inspector.position?.toLowerCase().includes('bureau d\'études')
      );

      const responsables = allInspectors.filter(inspector =>
        inspector.position?.toLowerCase().includes('responsable') ||
        inspector.type === 'supplier'
      );
      
      const otherInspectors = allInspectors.filter(inspector => 
        !inspectors.includes(inspector) && 
        !engineeringConsultants.includes(inspector) &&
        !responsables.includes(inspector)
      );
      
      // Return in order: engineering consultants first, then inspectors, then responsables, then others
      return [...engineeringConsultants, ...inspectors, ...responsables, ...otherInspectors];
    }
  });

  // Set default inspector to engineering consultant when project is selected
  useEffect(() => {
    if (selectedProject && inspectors && inspectors.length > 0) {
      // Try to find engineering consultant from the project's engineering_consultant field
      const projectEngConsultant = inspectors.find(emp => 
        emp.position?.toLowerCase().includes('consultant') ||
        emp.position?.toLowerCase().includes('ingénieur')
      );
      
      if (projectEngConsultant && !selectedInspector) {
        setSelectedInspector(projectEngConsultant.id);
      }
    }
  }, [selectedProject, inspectors, selectedInspector]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !projectFilter || 
      project.title.toLowerCase().includes(projectFilter.toLowerCase()) ||
      project.project_reference?.toLowerCase().includes(projectFilter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || !statusFilter || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Filter inspectors based on search
  const filteredInspectors = inspectors?.filter(inspector => {
    if (!inspectorSearch) return true;
    
    const searchLower = inspectorSearch.toLowerCase();
    const matchesName = inspector.full_name?.toLowerCase().includes(searchLower);
    const matchesPhone = inspector.phone?.toLowerCase().includes(searchLower);
    const matchesPosition = inspector.position?.toLowerCase().includes(searchLower);
    const matchesDepartment = inspector.department?.toLowerCase().includes(searchLower);
    const matchesNif = inspector.nif?.toLowerCase()?.includes(searchLower);
    
    return matchesName || matchesPhone || matchesPosition || matchesDepartment || matchesNif;
  }) || [];

  const handleScheduleInspection = async () => {
    if (!selectedProject || !inspectionType || !selectedInspector || !inspectionDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      await onScheduleInspection(
        selectedProject.id,
        selectedInspector,
        inspectionDate,
        {
          inspection_type: inspectionType,
          target_progress: targetProgress,
          requirements,
          contractor_notified: notifyContractor,
          phase_ids: selectedSteps,
          phase_id: selectedSteps[0] || null
        }
      );

      // Notify contractor if requested
      if (notifyContractor && selectedProject.contractor_contact) {
        await NotificationService.createNotification({
          recipient_id: selectedProject.contractor_contact,
          title: 'Inspection Programmée',
          message: `Une inspection ${INSPECTION_TYPES.find(t => t.value === inspectionType)?.label} a été programmée pour le projet "${selectedProject.title}" le ${new Date(inspectionDate).toLocaleDateString('fr-FR')}.`,
          type: 'inspection_required',
          related_id: selectedProject.id,
          metadata: {
            project_id: selectedProject.id,
            inspection_type: inspectionType,
            inspection_date: inspectionDate,
            target_progress: targetProgress
          }
        });
      }

      // Reset form
      setSelectedProject(undefined);
      setInspectionType('');
      setSelectedInspector('');
      setSelectedSteps([]);
      setInspectionDate('');
      setTargetProgress(0);
      setRequirements('');
      setNotifyContractor(true);

      toast.success('Inspection programmée avec succès');
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast.error('Erreur lors de la programmation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de Projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Rechercher</Label>
              <Input
                placeholder="Nom du projet ou référence..."
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-[100]">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en cours">En cours</SelectItem>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="en inspection">En inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Sélection du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.slice(0, 9).map((project) => (
              <Card 
                key={project.id} 
                className={`cursor-pointer transition-all border-2 ${
                  selectedProject?.id === project.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-dashed border-muted hover:border-primary/50'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium line-clamp-2">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Réf: {project.project_reference}
                    </p>
                    {project.location && (
                      <p className="text-xs text-muted-foreground">📍 {project.location}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {project.status && (
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      )}
                      {project.progress !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {project.progress}%
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inspection Configuration */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Configuration de l'Inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Projet sélectionné: <strong>{selectedProject.title}</strong>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Type d'Inspection *</Label>
                <Select value={inspectionType} onValueChange={setInspectionType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Choisir le type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-[100]">
                    {INSPECTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Inspecteur *</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Rechercher par nom, téléphone, poste, NIF..."
                    value={inspectorSearch}
                    onChange={(e) => setInspectorSearch(e.target.value)}
                    className="bg-background"
                  />
                  <Select 
                    value={selectedInspector} 
                    onValueChange={setSelectedInspector}
                    open={isInspectorOpen}
                    onOpenChange={setIsInspectorOpen}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Sélectionner un inspecteur..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-[100] max-h-60">
                      {filteredInspectors.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          Aucun inspecteur trouvé
                        </div>
                      ) : (
                        filteredInspectors.map((inspector) => {
                          const isEngConsultant = inspector.position?.toLowerCase().includes('consultant') ||
                                                 inspector.position?.toLowerCase().includes('ingénieur');
                          const isInspector = inspector.position?.toLowerCase().includes('inspector');
                          const isSupplier = inspector.type === 'supplier';
                          const isResponsable = inspector.position?.toLowerCase().includes('responsable');
                          
                          return (
                            <SelectItem key={inspector.id} value={inspector.id}>
                              <div className="flex flex-col w-full">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{inspector.full_name}</span>
                                  {isEngConsultant && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      Consultant
                                    </span>
                                  )}
                                  {isInspector && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Inspecteur
                                    </span>
                                  )}
                                  {isSupplier && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      Fournisseur
                                    </span>
                                  )}
                                  {isResponsable && !isSupplier && (
                                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                      Responsable
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 space-y-1">
                                  {inspector.position && (
                                    <div>📋 {inspector.position}</div>
                                  )}
                                  {inspector.phone && (
                                    <div>📞 {inspector.phone}</div>
                                  )}
                                  {inspector.department && (
                                    <div>🏢 {inspector.department}</div>
                                  )}
                                  {inspector.nif && (
                                    <div>🆔 NIF: {inspector.nif}</div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Date d'Inspection *</Label>
                <Input
                  type="datetime-local"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <Label>Progression Cible (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={targetProgress}
                  onChange={(e) => setTargetProgress(Number(e.target.value))}
                  placeholder="Ex: 50"
                />
              </div>
            </div>

            {/* Phase/Step Selection */}
            {availableSteps.length > 0 && (
              <div className="col-span-full">
                <Label>Phases / Étapes concernées</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                  {availableSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSteps.includes(step.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-dashed hover:border-primary/50'
                      }`}
                      onClick={() => {
                        setSelectedSteps(prev =>
                          prev.includes(step.id)
                            ? prev.filter(id => id !== step.id)
                            : [...prev, step.id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium line-clamp-1">{step.name}</span>
                        <Badge variant={step.status === 'completed' ? 'default' : 'outline'} className="text-xs">
                          {step.progress || 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSteps.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedSteps.length} phase(s) sélectionnée(s)
                  </p>
                )}
              </div>
            )}

            <div>
              <Label>Exigences Spéciales</Label>
              <Textarea
                placeholder="Décrivez les exigences ou critères spéciaux pour cette inspection..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="notifyContractor"
                checked={notifyContractor}
                onChange={(e) => setNotifyContractor(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="notifyContractor" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifier l'entrepreneur principal
              </Label>
            </div>

            <Button 
              onClick={handleScheduleInspection}
              className="w-full"
              size="lg"
            >
              <Send className="h-4 w-4 mr-2" />
              Programmer l'Inspection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedInspectionScheduler;