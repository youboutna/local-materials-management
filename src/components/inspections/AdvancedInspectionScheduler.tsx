import React, { useState } from 'react';
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
import { sendNotification } from '@/services/notificationService';

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

interface AdvancedInspectionSchedulerProps {
  projects: Project[];
  onScheduleInspection: (projectId: string, inspector: string, date: string, additionalData?: any) => Promise<void>;
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
  onScheduleInspection
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

  // Fetch inspectors (employees with inspector position or inspection department)
  const { data: inspectors } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, phone, position, department')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      
      // Filter employees who are inspectors or in inspection-related roles
      const filteredInspectors = (data || []).filter(emp => 
        emp.position?.toLowerCase().includes('inspector') ||
        emp.position?.toLowerCase().includes('inspection') ||
        emp.department?.toLowerCase().includes('inspection') ||
        emp.position?.toLowerCase().includes('contrôle') ||
        emp.position?.toLowerCase().includes('qualité')
      );
      
      return filteredInspectors;
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !projectFilter || 
      project.title.toLowerCase().includes(projectFilter.toLowerCase()) ||
      project.project_reference?.toLowerCase().includes(projectFilter.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || !statusFilter || project.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
          contractor_notified: notifyContractor
        }
      );

      // Notify contractor if requested
      if (notifyContractor && selectedProject.contractor_contact) {
        await sendNotification({
          recipient_id: selectedProject.contractor_contact, // This should be contractor's user ID
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
                <Select value={selectedInspector} onValueChange={setSelectedInspector}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Sélectionner un inspecteur..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-[100]">
                    {inspectors?.map((inspector) => (
                      <SelectItem key={inspector.id} value={inspector.id}>
                        {inspector.full_name}
                        {inspector.phone && (
                          <span className="text-muted-foreground"> • {inspector.phone}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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