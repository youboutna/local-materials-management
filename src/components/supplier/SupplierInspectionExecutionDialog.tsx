import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InspectionDTO } from '@/types/inspection.dto';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { SupplierPaymentService } from '@/services/SupplierPaymentService';

interface SupplierInspectionExecutionDialogProps {
  inspection: InspectionDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInspectionCompleted: () => void;
  supplierId: string;
}

export const SupplierInspectionExecutionDialog: React.FC<SupplierInspectionExecutionDialogProps> = ({
  inspection,
  open,
  onOpenChange,
  onInspectionCompleted,
  supplierId
}) => {
  const [progress, setProgress] = useState(inspection?.progress_at_inspection || 0);
  const [comments, setComments] = useState(inspection?.comments || '');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createPaymentRequest, setCreatePaymentRequest] = useState(true);
  const [paymentRequestType, setPaymentRequestType] = useState<'contractor' | 'inspector'>('contractor');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(docs => docs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!inspection) return;

    if (progress < 0 || progress > 100) {
      toast({
        title: 'Erreur',
        description: 'Le taux d\'avancement doit être entre 0 et 100%',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents to storage
      const uploadedDocs: any[] = [];
      for (const file of documents) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${inspection.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `inspections/${inspection.project_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedDocs.push({
          file_name: file.name,
          file_url: publicUrl,
          file_path: filePath,
          mime_type: file.type,
          file_size: file.size
        });

        // Insert document metadata
        const documentData = {
          title: `Service fait - ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          document_type: 'inspection' as any,
          project_id: inspection.project_id,
          inspection_id: inspection.id,
          supplier_id: supplierId,
          uploaded_by: supplierId
        };
        
        const { error: docError } = await supabase
          .from('documents')
          .insert(documentData);
        
        if (docError) console.error('Error inserting document:', docError);
      }

      // Update inspection
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          status: 'approved',
          progress_at_inspection: progress,
          comments: comments,
          documents: uploadedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspection.id);

      if (updateError) throw updateError;

      // Get project manager for notification
      const { data: projectData } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', inspection.project_id)
        .single();

      // Notify project manager
      if (projectData?.created_by) {
        await createNotification(
          projectData.created_by,
          'Inspection complétée',
          `L'inspection du ${new Date(inspection.date).toLocaleDateString('fr-FR')} a été complétée avec un taux d'avancement de ${progress}%`,
          'inspection',
          inspection.id,
          { progress, project_id: inspection.project_id }
        );
      }

      // Get contractor (entreprise contractante) from project stakeholders
      const { data: stakeholders } = await supabase
        .from('project_stakeholders')
        .select('employee_id, supplier_id')
        .eq('project_id', inspection.project_id)
        .eq('stakeholder_entity_type', 'employee');

      // Notify contractors
      if (stakeholders) {
        for (const stakeholder of stakeholders) {
          if (stakeholder.employee_id) {
            // Get employee user_id
            const { data: employee } = await supabase
              .from('employees')
              .select('user_id')
              .eq('id', stakeholder.employee_id)
              .single();

            if (employee?.user_id) {
              await createNotification(
                employee.user_id,
                'Résultats d\'inspection disponibles',
                `Inspection complétée: ${inspection.projects?.title} - ${progress}% d'avancement`,
                'inspection',
                inspection.id,
                { progress, project_id: inspection.project_id }
              );
            }
          }
        }
      }

      // Create payment request if requested
      if (createPaymentRequest && paymentAmount) {
        const amount = parseFloat(paymentAmount);
        
        if (paymentRequestType === 'contractor') {
          // Create contractor progress payment
          await SupplierPaymentService.createContractorProgressPayment(
            inspection.project_id,
            amount,
            inspection.id,
            progress,
            uploadedDocs.length,
            paymentDescription
          );
        } else {
          // Create inspector fee payment
          await SupplierPaymentService.createInspectorFeePayment(
            supplierId,
            inspection.project_id,
            amount,
            inspection.id,
            inspection.date,
            paymentDescription
          );
        }

        toast({
          title: '✅ Succès',
          description: 'Inspection complétée et demande de paiement créée',
        });
      } else {
        toast({
          title: '✅ Inspection complétée',
          description: 'L\'inspection a été marquée comme terminée',
        });
      }

      onInspectionCompleted();
      onOpenChange(false);
      
      // Reset form
      setProgress(0);
      setComments('');
      setDocuments([]);
      
    } catch (error: any) {
      console.error('Error completing inspection:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de compléter l\'inspection',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inspection) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Compléter l'inspection
          </DialogTitle>
          <DialogDescription>
            Projet: {inspection.projects?.title}
            <br />
            Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Statut actuel</p>
              <Badge variant="secondary" className="mt-1">
                {inspection.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Progrès actuel</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {inspection.progress_at_inspection || 0}%
              </p>
            </div>
          </div>

          {/* Progress Input */}
          <div className="space-y-2">
            <Label htmlFor="progress">
              Taux d'avancement (%) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="progress"
              type="number"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              placeholder="0-100"
            />
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">
              Commentaires et observations
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Décrivez les travaux réalisés, observations, problèmes rencontrés..."
              rows={4}
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label htmlFor="documents">
              Documents "Service fait" <span className="text-destructive">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
              <input
                id="documents"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="documents" className="cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Cliquez pour ajouter des fichiers</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Images, Documents (Max 10MB par fichier)
                </p>
              </label>
            </div>

            {/* Selected Documents */}
            {documents.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium">Fichiers sélectionnés:</p>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(doc.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Request Section */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createPaymentRequest"
                checked={createPaymentRequest}
                onChange={(e) => setCreatePaymentRequest(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="createPaymentRequest" className="font-medium">
                Créer une demande de paiement
              </Label>
            </div>

            {createPaymentRequest && (
              <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label>Type de demande</Label>
                  <select
                    value={paymentRequestType}
                    onChange={(e) => setPaymentRequestType(e.target.value as 'contractor' | 'inspector')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="contractor">Paiement du contractant (Entreprise)</option>
                    <option value="inspector">Frais d'inspection / Honoraires ingénieur</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">
                    Montant (MRU) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Montant à demander"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required={createPaymentRequest}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDescription">
                    Description du paiement
                  </Label>
                  <Textarea
                    id="paymentDescription"
                    placeholder={
                      paymentRequestType === 'contractor'
                        ? 'Décompte de facture pour avancement des travaux...'
                        : 'Frais de mission d\'inspection, honoraires d\'ingénieur conseil...'
                    }
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {paymentRequestType === 'contractor'
                      ? '📋 Cette demande sera envoyée au chef de projet pour déclencher le processus de décompte de paiement de facture pour l\'entreprise contractante.'
                      : '💼 Cette demande couvrira les frais de mission d\'inspection ou les honoraires d\'ingénieur conseil.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || documents.length === 0 || progress <= 0 || (createPaymentRequest && !paymentAmount)}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Traitement...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider et compléter
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
