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
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { ProjectDTO } from '@/dtos/entities/ProjectDTO';
import { InspectionDomainTransformer } from '@/dtos/transforms/InspectionDomainTransformer';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
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
  const { data: inspection, isLoading: inspectionLoading } = useQuery<InspectionDTO | null>({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      
      // Get inspection
      const inspectionData = await InspectionService.getInspectionById(inspectionId);
      
      if (!inspectionData) {
        console.warn(`[InspectionPaymentValidation] Inspection not found: ${inspectionId}`);
        return null;
      }
      
      // Check if inspection is approved (terminé)
      if (inspectionData.status !== 'approved') {
        console.warn(`[InspectionPaymentValidation] Inspection not approved. Status: ${inspectionData.status}, ID: ${inspectionId}`);
        return null;
      }
      
      // Check if there's a pending payment request linked to this inspection
      const paymentRequest = await SupplierPaymentService.getPendingPaymentRequestByInspectionId(inspectionId);
      
      // Only return inspection if it has a pending payment request
      if (!paymentRequest) {
        console.warn(`[InspectionPaymentValidation] No pending payment request found for inspection: ${inspectionId}`);
        return null;
      }
      
      console.log(`[InspectionPaymentValidation] Validation successful for inspection: ${inspectionId}, payment request: ${paymentRequest.id}`);
      
      // Transform Inspection entity to InspectionDTO
      return InspectionDomainTransformer.toResponseDto(inspectionData);
    },
    enabled: !!inspectionId,
  });

  // Fetch project details with external stakeholders (contractors)
  const { data: project } = useQuery<ProjectDTO | null>({
    queryKey: ['project-summary', projectId],
    queryFn: async () => {
      if (!projectId) {
        console.warn('[InspectionPaymentValidation] No projectId provided');
        return null;
      }
      
      try {
        const projectData = await ProjectService.getProjectWithStakeholders(projectId);
        
        if (!projectData) {
          console.warn(`[InspectionPaymentValidation] Project not found: ${projectId}`);
          return null;
        }
        
        console.log(`[InspectionPaymentValidation] Project loaded successfully: ${projectId}`);
        return projectData;
      } catch (error) {
        console.error(`[InspectionPaymentValidation] Error loading project ${projectId}:`, error);
        return null;
      }
    },
    enabled: !!projectId,
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: { status: string; comments: string; payment_status?: PaymentStatus; payment_type: PaymentType }) => {
      if (!inspectionId) {
        console.error('[InspectionPaymentValidation] Inspection ID missing for update');
        throw new Error('Inspection ID missing');
      }

      console.log(`[InspectionPaymentValidation] Updating inspection ${inspectionId}:`, {
        status: data.status,
        payment_type: data.payment_type,
        payment_status: data.payment_status
      });

      try {
        // Update inspection using hexagonal service
        await InspectionService.updateInspectionPaymentValidation(inspectionId, {
          status: data.status,
          comments: data.comments,
          payment_type: data.payment_type,
          payment_status: data.payment_status
        });

        console.log(`[InspectionPaymentValidation] Inspection updated successfully: ${inspectionId}`);
      } catch (error) {
        console.error(`[InspectionPaymentValidation] Error updating inspection ${inspectionId}:`, error);
        throw error;
      }

      // Determine beneficiary based on payment type
      let beneficiaryUserId: string | null = null;
      console.log(`[InspectionPaymentValidation] Determining beneficiary for payment type: ${data.payment_type}`);

      if (data.payment_type === 'contractor') {
        // Find external contractor (partie prenante externe - supplier)
        const contractor = project?.project_stakeholders?.find(
          (s: any) => s.stakeholder_entity_type === 'supplier' && s.supplier_id && s.suppliers
        );
        beneficiaryUserId = contractor?.suppliers?.user_id || null;
        console.log(`[InspectionPaymentValidation] Contractor beneficiary found: ${beneficiaryUserId ? 'YES' : 'NO'}`);
      } else if (data.payment_type === 'mission_fees' || data.payment_type === 'engineer_fees') {
        // Find engineering consultant (ingénieur conseil)
        const engineer = project?.project_stakeholders?.find(
          (s: any) => s.stakeholder_type === 'engineering_consultant' && s.employee_id
        );
        
        if (engineer?.employee_id) {
          console.log(`[InspectionPaymentValidation] Found engineer employee ID: ${engineer.employee_id}`);
          // Get employee user_id via service
          const employeeData = await ProjectService.getEmployeeUserId(engineer.employee_id);
          beneficiaryUserId = employeeData?.user_id || null;
          console.log(`[InspectionPaymentValidation] Engineer beneficiary found: ${beneficiaryUserId ? 'YES' : 'NO'}`);
        } else {
          console.warn('[InspectionPaymentValidation] No engineer found in project stakeholders');
        }
      } else {
        console.warn(`[InspectionPaymentValidation] Unknown payment type: ${data.payment_type}`);
      }

      // Create notification for beneficiary
      if (beneficiaryUserId && project) {
        console.log(`[InspectionPaymentValidation] Creating notification for beneficiary: ${beneficiaryUserId}`);
        const paymentTypeLabels = {
          contractor: 'entreprise contractante',
          mission_fees: 'frais de mission',
          engineer_fees: 'honoraires ingénieur conseil'
        };

        await NotificationService.createNotification({
          recipient_id: beneficiaryUserId,
          title: 'Validation de paiement',
          message: `Votre demande de paiement (${paymentTypeLabels[data.payment_type]}) a été ${
            data.payment_status === 'approved' ? 'approuvée' : 'rejetée'
          } pour le projet "${project.title}"`,
          type: 'payment_validation',
          metadata: {
            project_id: projectId,
            inspection_id: inspectionId,
            payment_status: data.payment_status,
            payment_type: data.payment_type,
            rejection_notes: data.comments,
          },
        });
        
        console.log(`[InspectionPaymentValidation] Notification created successfully for user: ${beneficiaryUserId}`);
      } else {
        console.warn('[InspectionPaymentValidation] No beneficiary found or project missing, skipping notification');
      }
    },
    onSuccess: () => {
      console.log(`[InspectionPaymentValidation] Mutation successful, invalidating queries`);
      queryClient.invalidateQueries({ queryKey: ['inspection', inspectionId] });
      queryClient.invalidateQueries({ queryKey: ['project-detail', projectId] });
      toast({
        title: 'Inspection mise à jour',
        description: 'La validation de paiement a été enregistrée avec succès.',
      });
    },
    onError: (error) => {
      console.error('[InspectionPaymentValidation] Mutation error:', error);
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
                      {new Date(inspection.date).toLocaleDateString('fr-FR', {
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
                    {getStatusBadge(inspection.status)}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Inspecteur</Label>
                  <p className="font-medium mt-1">{inspection.inspector}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Progression à l'inspection</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <p className="font-medium">{inspection.progress_at_inspection}%</p>
                  </div>
                </div>
              </div>

              {inspection.comments && (
                <div>
                  <Label className="text-muted-foreground">Commentaires</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{inspection.comments}</p>
                </div>
              )}

              {inspection.documents && (
                <div>
                  <Label className="text-muted-foreground">Documents joints</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Array.isArray(inspection.documents) && inspection.documents.map((doc: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Document {idx + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Validation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Validation de paiement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payment-type">Type de paiement *</Label>
                <Select value={paymentType} onValueChange={(value) => setPaymentType(value as PaymentType)}>
                  <SelectTrigger id="payment-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Entreprise contractante
                      </div>
                    </SelectItem>
                    <SelectItem value="mission_fees">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Frais de mission
                      </div>
                    </SelectItem>
                    <SelectItem value="engineer_fees">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Honoraires ingénieur conseil
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment-status">Statut de validation *</Label>
                <Select value={paymentStatus} onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}>
                  <SelectTrigger id="payment-status" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus !== 'approved' && (
                <div>
                  <Label htmlFor="rejection-notes">Notes de rejet / Explication *</Label>
                  <Textarea
                    id="rejection-notes"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Expliquez la raison du rejet ou les informations manquantes..."
                    rows={5}
                    className="mt-2"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleValidatePayment}
                  disabled={updateInspectionMutation.isPending}
                  className="w-full"
                  variant={paymentStatus === 'approved' ? 'default' : 'destructive'}
                >
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {updateInspectionMutation.isPending ? 'Enregistrement...' : 'Valider la décision'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project & Beneficiary Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du projet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Titre</Label>
                <p className="font-medium mt-1">{project?.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Budget total</Label>
                <p className="font-medium mt-1">{(project?.budget || 0).toLocaleString()} MRU</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Progression projet</Label>
                <p className="font-medium mt-1">{project?.progress || 0}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bénéficiaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                if (paymentType === 'contractor') {
                  const contractor = project?.project_stakeholders?.find(
                    (s: any) => s.stakeholder_entity_type === 'supplier' && s.suppliers
                  );
                  
                  return contractor?.suppliers ? (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium mt-1">Entreprise contractante</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Entreprise</Label>
                        <p className="font-medium mt-1">
                          {contractor.suppliers.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Contact</Label>
                        <p className="font-medium mt-1">
                          {contractor.suppliers.contact_person || 'Non défini'}
                        </p>
                      </div>
                      {contractor.suppliers.phone && (
                        <div>
                          <Label className="text-muted-foreground">Téléphone</Label>
                          <p className="font-medium mt-1">{contractor.suppliers.phone}</p>
                        </div>
                      )}
                      {contractor.suppliers.email && (
                        <div>
                          <Label className="text-muted-foreground">Email</Label>
                          <p className="font-medium mt-1">{contractor.suppliers.email}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Aucune entreprise contractante définie pour ce projet.
                    </p>
                  );
                } else if (paymentType === 'mission_fees' || paymentType === 'engineer_fees') {
                  return (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Type</Label>
                        <p className="font-medium mt-1">
                          {paymentType === 'mission_fees' ? 'Frais de mission' : 'Honoraires ingénieur conseil'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Bénéficiaire</Label>
                        <p className="font-medium mt-1">Ingénieur conseil</p>
                      </div>
                    </>
                  );
                }
                return null;
              })()}
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Note importante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Une notification sera automatiquement envoyée au bénéficiaire pour l'informer de votre décision.
                {paymentStatus !== 'approved' && ' Il sera invité à compléter les informations bancaires et joindre la facture de décompte.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InspectionPaymentValidation;
