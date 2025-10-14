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
import { supabase } from '@/integrations/supabase/client';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';

const invoiceSchema = z.object({
  project_id: z.string().min(1, 'Le projet est requis'),
  inspection_id: z.string().optional(),
  progress_percentage: z.number().min(0).max(100, 'Le taux d\'avancement doit être entre 0 et 100'),
  invoice_amount: z.number().positive('Le montant doit être positif'),
  work_description: z.string().min(10, 'Description requise (min 10 caractères)'),
  quantities_executed: z.any().optional(),
  lot_details: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface ProgressInvoiceFormProps {
  supplierId: string;
  onSuccess?: () => void;
}

export function ProgressInvoiceForm({ supplierId, onSuccess }: ProgressInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [previousProgress, setPreviousProgress] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [workflowRequirements, setWorkflowRequirements] = useState({
    requiresConsultant: false,
    requiresMinistry: false,
    requiresDonor: false
  });
  const { toast } = useToast();
  const { hasRole } = useCurrentUserRoles();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
  });

  const selectedProjectId = watch('project_id');
  const selectedInspectionId = watch('inspection_id');

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
      loadInspections(selectedProjectId);
      loadPreviousProgress(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedInspectionId) {
      const inspection = inspections.find(i => i.id === selectedInspectionId);
      if (inspection) {
        setValue('progress_percentage', inspection.progress_at_inspection || 0);
      }
    }
  }, [selectedInspectionId, inspections]);

  const loadProjectData = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProjectData(data);

      // Determine workflow requirements based on project type and funding
      const projectType = data.project_type?.toLowerCase() || '';
      const fundingSource = (data as any).funding_source?.toLowerCase() || '';
      
      setWorkflowRequirements({
        requiresConsultant: projectType === 'infrastructure' || projectType === 'construction',
        requiresMinistry: fundingSource.includes('ministère') || fundingSource.includes('ministry'),
        requiresDonor: fundingSource.includes('bailleur') || fundingSource.includes('donor') || fundingSource.includes('banque mondiale')
      });
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadInspections = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'approved')
        .order('date', { ascending: false });

      if (error) throw error;
      setInspections(data || []);
    } catch (error) {
      console.error('Error loading inspections:', error);
    }
  };

  const loadPreviousProgress = async (projectId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('progress_invoices')
        .select('progress_percentage')
        .eq('project_id', projectId)
        .in('status', ['paid', 'payment_processing'])
        .order('progress_percentage', { ascending: false })
        .limit(1);

      if (error && error.code !== 'PGRST116') throw error;
      
      const invoiceData = data?.[0] as any;
      setPreviousProgress(invoiceData?.progress_percentage || 0);
    } catch (error) {
      console.error('Error loading previous progress:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `progress_invoices/${fileName}`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setUploadedDocs(prev => [...prev, publicUrl]);
      toast({
        title: 'Document téléchargé',
        description: 'Le document a été ajouté à la facture',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le document',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true);
    try {
      // Validate progress increment
      if (data.progress_percentage <= previousProgress) {
        toast({
          title: 'Erreur',
          description: `Le taux d'avancement doit être supérieur à ${previousProgress}%`,
          variant: 'destructive',
        });
        return;
      }

      // Create progress invoice using database function
      const { data: invoiceResult, error } = await (supabase as any)
        .rpc('create_progress_invoice', {
          p_project_id: data.project_id,
          p_inspection_id: data.inspection_id || null,
          p_progress_percentage: data.progress_percentage,
          p_invoice_amount: data.invoice_amount,
          p_work_description: data.work_description,
          p_quantities_executed: data.quantities_executed || [],
          p_lot_details: data.lot_details || [],
        });

      if (error) throw error;

      // The function returns the created invoice
      const createdInvoice = invoiceResult as any;

      // Update invoice with supporting documents
      if (uploadedDocs.length > 0 && createdInvoice?.id) {
        await (supabase as any)
          .from('progress_invoices')
          .update({ supporting_documents: uploadedDocs })
          .eq('id', createdInvoice.id);
      }

      toast({
        title: 'Facture créée',
        description: 'La facture d\'avancement a été soumise avec succès',
      });

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la facture',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
                  <div>Source de financement: <strong>{(projectData as any).funding_source || 'N/A'}</strong></div>
                  {workflowRequirements.requiresConsultant && (
                    <div className="text-orange-600">✓ Validation ingénieur conseil requise</div>
                  )}
                  {workflowRequirements.requiresMinistry && (
                    <div className="text-orange-600">✓ Approbation ministère requise</div>
                  )}
                  {workflowRequirements.requiresDonor && (
                    <div className="text-orange-600">✓ Approbation bailleur de fonds requise</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Projet *</Label>
            <EnhancedProjectSelector
              value={selectedProjectId}
              onChange={(id) => setValue('project_id', id || '')}
              placeholder="Sélectionner un projet"
            />
            {errors.project_id && (
              <p className="text-sm text-red-500 mt-1">{errors.project_id.message}</p>
            )}
          </div>

          {inspections.length > 0 && (
            <div>
              <Label htmlFor="inspection_id">Inspection de référence</Label>
              <Select onValueChange={(value) => setValue('inspection_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une inspection" />
                </SelectTrigger>
                <SelectContent>
                  {inspections.map((inspection) => (
                    <SelectItem key={inspection.id} value={inspection.id}>
                      {new Date(inspection.date).toLocaleDateString('fr-FR')} - {inspection.progress_at_inspection}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="progress_percentage">Taux d'avancement (%) *</Label>
              <Input
                id="progress_percentage"
                type="number"
                step="0.01"
                {...register('progress_percentage', { valueAsNumber: true })}
                placeholder={`Min: ${previousProgress}%`}
              />
              {errors.progress_percentage && (
                <p className="text-sm text-red-500 mt-1">{errors.progress_percentage.message}</p>
              )}
              {previousProgress > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Avancement précédent: {previousProgress}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invoice_amount">Montant (MRU) *</Label>
              <Input
                id="invoice_amount"
                type="number"
                step="0.01"
                {...register('invoice_amount', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.invoice_amount && (
                <p className="text-sm text-red-500 mt-1">{errors.invoice_amount.message}</p>
              )}
              {projectData && (
                <p className="text-sm text-muted-foreground mt-1">
                  Budget total: {projectData.budget?.toLocaleString('fr-FR')} MRU
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="work_description">Description des travaux exécutés *</Label>
            <Textarea
              id="work_description"
              {...register('work_description')}
              placeholder="Décrivez en détail les travaux réalisés pour cette période"
              rows={4}
            />
            {errors.work_description && (
              <p className="text-sm text-red-500 mt-1">{errors.work_description.message}</p>
            )}
          </div>

          <div>
            <Label>Documents justificatifs</Label>
            <div className="mt-2">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id="invoice-document-upload"
              />
              <label
                htmlFor="invoice-document-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground border rounded-md hover:bg-secondary/80"
              >
                <Upload className="mr-2 h-4 w-4" />
                Télécharger un document
              </label>
            </div>
            {uploadedDocs.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadedDocs.map((doc, index) => (
                  <div key={index} className="flex items-center text-sm text-green-600">
                    <FileText className="mr-1 h-3 w-3" />
                    Document {index + 1} téléchargé
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la facture'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
