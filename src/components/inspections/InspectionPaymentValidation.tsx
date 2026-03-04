import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { NotificationService } from '@/application/services/NotificationService';
import { ProjectService } from '@/application/services/ProjectService';
import { InspectionService } from '@/application/services/InspectionService';
import { SupplierPaymentService } from '@/application/services/SupplierPaymentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowLeft,
  Users
} from 'lucide-react';

// Local interface for stakeholder
interface Stakeholder {
  id: string;
  stakeholderEntityType?: string;
  stakeholderType?: string;
  supplierId?: string;
  employeeId?: string;
  name?: string;
}

// Local interface for inspection data
interface InspectionData {
  id: string;
  projectId: string;
  phaseId?: string;
  date: string;
  inspector: string;
  status: string;
  progressAtInspection: number;
  comments?: string;
  documents?: unknown;
}

// Local interface for project with stakeholders
interface ProjectWithStakeholders {
  id: string;
  title: string;
  budget?: number;
  progress?: number;
  stakeholders?: Stakeholder[];
}

type PaymentType = 'contractor' | 'mission_fees' | 'engineer_fees';

type PaymentStatus = 'pending' | 'approved' | 'info_missing' | 'amount_inconsistent';

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Paiement accepté', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'info_missing', label: 'Informations manquantes', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'amount_inconsistent', label: 'Somme non cohérente avec le taux d\'avancement', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
];

const InspectionPaymentValidation: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inspectionId = searchParams.get('inspection');
  const queryClient = useQueryClient();
  const { hasAnyRole, isLoading: rolesLoading } = useCurrentUserRoles();

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('contractor');

  // Check if user has required role
  const canValidate = hasAnyRole(['project_manager', 'engineering_consultant', 'admin', 'director']);

  // Fetch inspection details with payment request
  const { data: inspection, isLoading: inspectionLoading } = useQuery<InspectionData | null>({
    queryKey: ['inspection', inspectionId],
    queryFn: async (): Promise<InspectionData | null> => {
      if (!inspectionId) return null;
      
      // Create service instance and get inspection
      const inspectionService = new InspectionService();
      const inspectionData = await inspectionService.getInspectionById(inspectionId);
      
      if (!inspectionData) {
        console.warn(`[InspectionPaymentValidation] Inspection not found: ${inspectionId}`);
        return null;
      }
      
      if (String(inspectionData.status) !== 'approved') {
        console.warn(`[InspectionPaymentValidation] Inspection not approved. Status: ${inspectionData.status}`);
        return null;
      }
      
      // Check for pending payment request
      const paymentService = new SupplierPaymentService();
      const paymentRequest = await paymentService.getPendingPaymentRequestByInspectionId({ inspectionId });
      
      if (!paymentRequest) {
        console.warn(`[InspectionPaymentValidation] No pending payment request found for inspection: ${inspectionId}`);
        return null;
      }
      
      return {
        id: inspectionData.id,
        projectId: inspectionData.projectId || '',
        phaseId: inspectionData.phaseId || undefined,
        date: inspectionData.date || '',
        inspector: String(inspectionData.inspector || ''),
        status: inspectionData.status,
        progressAtInspection: inspectionData.progressAtInspection,
        comments: inspectionData.comments || undefined,
        documents: inspectionData.documents
      };
    },
    enabled: !!inspectionId,
  });

  // Fetch project details with external stakeholders
  const { data: project } = useQuery<ProjectWithStakeholders | null>({
    queryKey: ['project-summary', projectId],
    queryFn: async (): Promise<ProjectWithStakeholders | null> => {
      if (!projectId) return null;
      
      try {
        const projectRepo = RepositoryFactory.getProjectRepository();
        const projectData = await projectRepo.findById(projectId);
        
        if (!projectData) return null;
        
        return {
          id: projectData.id,
          title: projectData.title,
          budget: (projectData as any).budget || 0,
          progress: (projectData as any).progress || 0,
          stakeholders: (projectData as any).stakeholders || []
        };
      } catch (error) {
        console.error(`[InspectionPaymentValidation] Error loading project:`, error);
        return null;
      }
    },
    enabled: !!projectId,
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: { status: string; comments: string; payment_status?: PaymentStatus; payment_type: PaymentType }) => {
      if (!inspectionId) throw new Error('Inspection ID missing');

      // Use service instance to update
      const inspectionService = new InspectionService();
      await inspectionService.updateInspection(inspectionId, {
        status: data.status as any,
        comments: data.comments,
      });

      // Determine beneficiary based on payment type
      let beneficiaryUserId: string | null = null;

      if (data.payment_type === 'contractor') {
        const contractor = project?.stakeholders?.find(
          (s: Stakeholder) => s.stakeholderEntityType === 'supplier' && s.supplierId
        );
        beneficiaryUserId = null;
      } else if (data.payment_type === 'mission_fees' || data.payment_type === 'engineer_fees') {
        const engineer = project?.stakeholders?.find(
          (s: Stakeholder) => s.stakeholderType === 'consultant' && s.employeeId
        );
        
        if (engineer?.employeeId) {
          const employeeRepo = RepositoryFactory.getEmployeeRepository();
          const employeeData = await employeeRepo.findById(engineer.employeeId);
          beneficiaryUserId = (employeeData as any)?.userId || null;
        }
      }

      // Create notification for beneficiary
      if (beneficiaryUserId && project) {
        const paymentTypeLabels = {
          contractor: 'entreprise contractante',
          mission_fees: 'frais de mission',
          engineer_fees: 'honoraires ingénieur conseil'
        };

        const notificationService = new NotificationService(RepositoryFactory.getNotificationRepository());
        
        await notificationService.createNotification({
          recipient_id: beneficiaryUserId,
          title: 'Validation de paiement',
          message: `Votre demande de paiement (${paymentTypeLabels[data.payment_type]}) a été ${
            data.payment_status === 'approved' ? 'approuvée' : 'rejetée'
          } pour le projet "${project.title}"`,
          type: data.payment_status === 'approved' ? 'success' : 'error',
          read: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      toast({
        title: 'Inspection mise à jour',
        description: 'La validation de paiement a été enregistrée avec succès.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'inspection.',
        variant: 'destructive',
      });
    },
  });

  const handleValidatePayment = () => {
    if (!canValidate) {
      toast({
        title: 'Accès refusé',
        description: 'Seul le chef de projet ou l\'ingénieur conseil peut valider les paiements.',
        variant: 'destructive',
      });
      return;
    }

    if (paymentStatus !== 'approved' && !rejectionNotes.trim()) {
      toast({
        title: 'Notes requises',
        description: 'Veuillez fournir des notes de rejet.',
        variant: 'destructive',
      });
      return;
    }

    const newStatus = paymentStatus === 'approved' ? 'approved' : 'requires_changes';
    const comments = paymentStatus === 'approved' 
      ? `Paiement approuvé - ${inspection?.comments || ''}`
      : `${PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus)?.label}: ${rejectionNotes}`;

    updateInspectionMutation.mutate({
      status: newStatus,
      comments,
      payment_status: paymentStatus,
      payment_type: paymentType,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approuvée', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejetée', className: 'bg-red-100 text-red-800' },
      requires_changes: { label: 'Modifications requises', className: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (rolesLoading || inspectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inspection non éligible</h3>
            <p className="text-muted-foreground mb-4">
              Cette inspection doit être terminée et avoir une demande de paiement en attente pour être validée.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canValidate) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
            <p className="text-muted-foreground mb-4">
              Seul le chef de projet ou l'ingénieur conseil peut valider les paiements.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au projet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedStatus = PAYMENT_STATUS_OPTIONS.find(o => o.value === paymentStatus);
  const StatusIcon = selectedStatus?.icon || AlertTriangle;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/projects/${projectId}?tab=inspections`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux inspections
          </Button>
          <h1 className="text-3xl font-bold">Validation de paiement - Inspection</h1>
          <p className="text-muted-foreground mt-2">
            Projet: {project?.title || 'Chargement...'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Détails de l'inspection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date d'inspection</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    <p className="font-medium">
                      {new Date(inspection.date || '').toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="mt-1">
                    {getStatusBadge(inspection.status || 'unknown')}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Inspecteur</Label>
                  <p className="font-medium mt-1">{inspection.inspector || 'Non spécifié'}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Progression à l'inspection</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <p className="font-medium">{inspection.progressAtInspection || 0}%</p>
                  </div>
                </div>
              </div>

              {inspection.comments && (
                <div>
                  <Label className="text-muted-foreground">Commentaires</Label>
                  <p className="mt-1">{inspection.comments}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Validation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Validation du paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Type de paiement</Label>
                  <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractor">Entreprise contractante</SelectItem>
                      <SelectItem value="mission_fees">Frais de mission</SelectItem>
                      <SelectItem value="engineer_fees">Honoraires ingénieur conseil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="paymentStatus">Décision de paiement</Label>
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="h-4 w-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {paymentStatus !== 'approved' && (
                <div>
                  <Label htmlFor="rejectionNotes">Notes de rejet</Label>
                  <Textarea
                    id="rejectionNotes"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Veuillez expliquer la raison du rejet..."
                    rows={4}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={handleValidatePayment} disabled={updateInspectionMutation.isPending}>
                  {updateInspectionMutation.isPending ? 'Enregistrement...' : 'Valider la décision'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Intervenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project?.stakeholders && project.stakeholders.length > 0 ? (
                <ul className="space-y-2">
                  {project.stakeholders.map((stakeholder) => (
                    <li key={stakeholder.id} className="text-sm">
                      <span className="font-medium">{stakeholder.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({stakeholder.stakeholderType || stakeholder.stakeholderEntityType})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun intervenant</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InspectionPaymentValidation;
