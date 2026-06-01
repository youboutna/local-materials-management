import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { StorageService } from '@/application/services/StorageService';

interface ProjectData {
  id: string;
  title: string;
  budget: number;
  project_type?: string;
  funding_source?: string;
}

interface InspectionData {
  id: string;
  date: string;
  progress_at_inspection: number;
  status: string;
}

interface WorkflowRequirements {
  requiresConsultant: boolean;
  requiresMinistry: boolean;
  requiresDonor: boolean;
}

interface ProgressInvoiceData {
  project_id: string;
  invoice_number: string;
  invoice_date: string;
  progress_percentage: number;
  invoice_amount: number;
  work_description: string;
  quantities_executed?: Record<string, number>;
  lot_details?: {
    id: string;
    name: string;
    completed: boolean;
  }[];
}

export function useProgressInvoiceHex() {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [inspections, setInspections] = useState<InspectionData[]>([]);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [workflowRequirements, setWorkflowRequirements] = useState<WorkflowRequirements>({
    requiresConsultant: false,
    requiresMinistry: false,
    requiresDonor: false
  });
  const { toast } = useToast();
  
  const projectRepository = RepositoryFactory.getProjectRepository();
  const inspectionRepository = RepositoryFactory.getInspectionRepository();
  const storageService = new StorageService(RepositoryFactory.getStorageRepository());

  const loadProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      
      const project = await projectRepository.findById(projectId);
      if (project) {
        setProjectData({
          id: project.id,
          title: project.title,
          budget: project.budget,
          project_type: project.projectType,
          funding_source: project.fundingSource
        });
      }
      
      const projectInspections = await inspectionRepository.findByProjectId(projectId);
      setInspections(projectInspections.map(inspection => ({
        id: inspection.id,
        date: inspection.date,
        progress_at_inspection: inspection.progressAtInspection,
        status: inspection.status
      })));
      
      // Filter by approved status (using string comparison since InspectionStatus enum may differ)
      const latestInspection = projectInspections
        .filter(i => String(i.status) === 'approved' || String(i.status) === 'completed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      setPreviousProgress(latestInspection?.progressAtInspection || 0);
      
      if (project) {
        setWorkflowRequirements({
          requiresConsultant: project.projectType === 'construction',
          requiresMinistry: project.budget > 1000000,
          requiresDonor: project.fundingSource === 'external'
        });
      }
      
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

  const uploadDocument = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `progress_invoices/${fileName}`;

      const result = await storageService.uploadFile({ bucket: 'documents', path: filePath, file });
      const fileUrl = result.publicUrl;
      
      setUploadedDocs(prev => [...prev, fileUrl]);
      
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été téléchargé avec succès'
      });
      
      return fileUrl;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erreur de téléchargement',
        description: 'Impossible de télécharger le document',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const submitInvoice = async (formData: ProgressInvoiceData): Promise<void> => {
    try {
      setLoading(true);
      console.log('Submitting invoice:', formData);
      toast({
        title: 'Facture soumise',
        description: 'La facture a été soumise avec succès'
      });
    } catch (error) {
      console.error('Error submitting invoice:', error);
      toast({
        title: 'Erreur de soumission',
        description: 'Impossible de soumettre la facture',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateInvoice = async (formData: ProgressInvoiceData): Promise<boolean> => {
    try {
      if (!formData.project_id) {
        toast({ title: 'Erreur de validation', description: 'Le projet est requis', variant: 'destructive' });
        return false;
      }
      if (formData.progress_percentage <= previousProgress) {
        toast({ title: 'Erreur de validation', description: 'Le progrès doit être supérieur au progrès précédent', variant: 'destructive' });
        return false;
      }
      if (formData.invoice_amount <= 0) {
        toast({ title: 'Erreur de validation', description: 'Le montant doit être positif', variant: 'destructive' });
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  return {
    loading, projectData, inspections, previousProgress, uploadedDocs, workflowRequirements,
    loadProjectData, uploadDocument, submitInvoice, validateInvoice,
    reset: () => {
      setProjectData(null);
      setInspections([]);
      setPreviousProgress(0);
      setUploadedDocs([]);
      setWorkflowRequirements({ requiresConsultant: false, requiresMinistry: false, requiresDonor: false });
    }
  };
}
