import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { InspectionDTO } from '@/types/inspection.dto';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar,
  TrendingUp,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { InspectionService } from '@/services/InspectionService';

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

  // Check if user has required role
  const canValidate = hasAnyRole(['project_manager', 'engineering_consultant', 'admin', 'director']);

  // Fetch inspection details
  const { data: inspection, isLoading: inspectionLoading } = useQuery<InspectionDTO | null>({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      if (!inspectionId) return null;
      return await InspectionService.getInspectionById(inspectionId);
    },
    enabled: !!inspectionId,
  });

  // Fetch project details with external stakeholders (contractors)
  const { data: project } = useQuery({
    queryKey: ['project-summary', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_stakeholders(
            stakeholder_type,
            stakeholder_entity_type,
            supplier_id,
            suppliers(
              id,
              name,
              contact_person,
              phone,
              email,
              user_id
            )
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async (data: { status: string; comments: string; payment_status?: PaymentStatus }) => {
      if (!inspectionId) throw new Error('Inspection ID missing');

      const { error } = await supabase
        .from('inspections')
        .update({
          status: data.status,
          comments: data.comments,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspectionId);

      if (error) throw error;

      // Create notification for beneficiary (external contractor)
      if (project?.project_stakeholders && Array.isArray(project.project_stakeholders)) {
        // Find external contractor (partie prenante externe - supplier)
        const contractor = project.project_stakeholders.find(
          (s: any) => s.stakeholder_entity_type === 'supplier' && s.supplier_id && s.suppliers
        );

        if (contractor?.suppliers?.user_id) {
          await supabase.from('notifications').insert({
            recipient_id: contractor.suppliers.user_id,
            title: 'Validation de paiement',
            message: `Votre demande de paiement a été ${
              data.payment_status === 'approved' ? 'approuvée' : 'rejetée'
            } pour le projet "${project.title}"`,
            type: 'payment_validation',
            metadata: {
              project_id: projectId,
              inspection_id: inspectionId,
              payment_status: data.payment_status,
              rejection_notes: data.comments,
            },
          });
        }
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
      console.error('Error updating inspection:', error);
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
            <h3 className="text-lg font-semibold mb-2">Inspection introuvable</h3>
            <p className="text-muted-foreground mb-4">
              L'inspection demandée n'existe pas ou vous n'avez pas les permissions pour y accéder.
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
              <CardTitle>Bénéficiaire (Contractant)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const contractor = project?.project_stakeholders?.find(
                  (s: any) => s.stakeholder_entity_type === 'supplier' && s.suppliers
                );
                
                return contractor?.suppliers ? (
                  <>
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
