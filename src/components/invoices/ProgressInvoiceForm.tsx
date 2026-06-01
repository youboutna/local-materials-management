import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import {
  useProgressInvoiceFormHex,
  type InvoiceFormData,
  type WorkflowRequirements
} from '@/hooks/hexagonal'

const invoiceSchema = z.object({
  project_id: z.string().min(1, 'Le projet est requis'),
  inspection_id: z.string().optional(),
  progress_percentage: z.number().min(0).max(100, 'Le taux d\'avancement doit être entre 0 et 100'),
  invoice_amount: z.number().positive('Le montant doit être positif'),
  work_description: z.string().min(10, 'Description requise (min 10 caractères)'),
  quantities_executed: z.any().optional(),
  lot_details: z.any().optional(),
});

type InvoiceFormDataType = z.infer<typeof invoiceSchema>;

interface ProgressInvoiceFormProps {
  supplierId: string;
  onSuccess?: () => void;
}

export function ProgressInvoiceForm({ supplierId, onSuccess }: ProgressInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const { toast } = useToast();
  const { hasRole } = useCurrentUserRoles();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormDataType>({
    resolver: zodResolver(invoiceSchema),
  });

  const selectedProjectId = watch('project_id');
  const selectedInspectionId = watch('inspection_id');

  // Use hexagonal hook
  const {
    projectData,
    inspections,
    previousProgress,
    workflowRequirements,
    isLoading,
    createProgressInvoice,
    uploadFile
  } = useProgressInvoiceFormHex(selectedProjectId);

  useEffect(() => {
    if (selectedInspectionId && inspections.length > 0) {
      const inspection = inspections.find(i => i.id === selectedInspectionId);
      if (inspection) {
        setValue('progress_percentage', inspection.progress_at_inspection || 0);
      }
    }
  }, [selectedInspectionId, inspections, setValue]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const publicUrl = await uploadFile(file);
      setUploadedDocs(prev => [...prev, publicUrl]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const onSubmit = async (data: InvoiceFormDataType) => {
    setLoading(true);
    try {
      await createProgressInvoice(data, uploadedDocs);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading && selectedProjectId) {
    return (
      <div className="text-center py-8">
        Chargement des données du projet...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Facture d'Avancement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projectData && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div>Type de projet: <strong>{projectData.project_type || 'infrastructure'}</strong></div>
                  <div>Source de financement: <strong>{projectData.funding_source || 'N/A'}</strong></div>
                  {workflowRequirements.requiresConsultant && (
                    <div className="text-orange-600">âœ“ Validation ingénieur conseil requise</div>
                  )}
                  {workflowRequirements.requiresMinistry && (
                    <div className="text-orange-600">âœ“ Approbation ministère requise</div>
                  )}
                  {workflowRequirements.requiresDonor && (
                    <div className="text-orange-600">âœ“ Approbation bailleur de fonds requise</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="project_id">Projet *</Label>
            <EnhancedProjectSelector
              value={selectedProjectId}
              onChange={(value) => setValue('project_id', value || '')}
              placeholder="Sélectionner un projet"
            />
            {errors.project_id && (
              <p className="text-sm text-red-600 mt-1">{errors.project_id.message}</p>
            )}
          </div>

          {selectedProjectId && (
            <>
              <div>
                <Label htmlFor="inspection_id">Inspection (optionnel)</Label>
                <Select 
                  value={selectedInspectionId || ''} 
                  onValueChange={(value) => setValue('inspection_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une inspection" />
                  </SelectTrigger>
                  <SelectContent>
                    {inspections.map((inspection) => (
                      <SelectItem key={inspection.id} value={inspection.id}>
                        {inspection.date && new Date(inspection.date).toLocaleDateString()} - 
                        {inspection.progress_at_inspection}% d'avancement
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="progress_percentage">Taux d'avancement (%) *</Label>
                <Input
                  id="progress_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  {...register('progress_percentage', { valueAsNumber: true })}
                />
                {errors.progress_percentage && (
                  <p className="text-sm text-red-600 mt-1">{errors.progress_percentage.message}</p>
                )}
                {previousProgress > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Progression précédente: {previousProgress}%
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="invoice_amount">Montant de la facture *</Label>
                <Input
                  id="invoice_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('invoice_amount', { valueAsNumber: true })}
                />
                {errors.invoice_amount && (
                  <p className="text-sm text-red-600 mt-1">{errors.invoice_amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="work_description">Description des travaux *</Label>
                <Textarea
                  id="work_description"
                  rows={4}
                  {...register('work_description')}
                />
                {errors.work_description && (
                  <p className="text-sm text-red-600 mt-1">{errors.work_description.message}</p>
                )}
              </div>

              <div>
                <Label>Documents de support</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Ajouter un document
                  </Button>
                </div>
                {uploadedDocs.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadedDocs.map((doc, index) => (
                      <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Document {index + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    // Reset form logic here if needed
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Création...' : 'Créer la facture'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
}

export default ProgressInvoiceForm;
