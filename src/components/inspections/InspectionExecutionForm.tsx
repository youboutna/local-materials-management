import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle, AlertTriangle, FileText, Shield, Banknote, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  getInspectionApprovalSyncService, 
  InspectionApprovalContext,
  SyncResult,
  SYNC_THRESHOLDS 
} from '@/services/InspectionApprovalSyncService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InspectionExecutionFormProps {
  inspection: {
    id: string;
    project_id: string;
    status: string;
    progress_at_inspection: number;
    comments?: string | null;
    inspector: string;
    date: string;
    phase_id?: string | null;
  };
  projectTitle: string;
  onUpdate: (inspectionId: string, status: string, progress?: number, documents?: File[], syncResult?: SyncResult) => void;
}

const InspectionExecutionForm: React.FC<InspectionExecutionFormProps> = ({
  inspection,
  projectTitle,
  onUpdate
}) => {
  const [newStatus, setNewStatus] = useState(inspection.status);
  const [newProgress, setNewProgress] = useState(inspection.progress_at_inspection.toString());
  const [comments, setComments] = useState(inspection.comments || '');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setSyncResult(null);
    
    try {
      const uploadedDocs: Array<{ name: string; url: string; uploadedAt: string }> = [];
      
      // Upload service fait documents
      if (documents.length > 0) {
        for (const file of documents) {
          const filePath = `inspections/${inspection.project_id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('project-documents')
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('project-documents').getPublicUrl(filePath);
          
          uploadedDocs.push({
            name: file.name,
            url: publicUrl,
            uploadedAt: new Date().toISOString()
          });

          // Insert document with proper type casting
          const { error: insertError } = await supabase.from('documents').insert({
            title: `Service Fait - ${file.name}`,
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
            document_type: 'inspection_validation' as const,
            project_id: inspection.project_id,
            inspection_id: inspection.id,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            status: 'approved' as const,
            metadata: { progress: parseInt(newProgress), validation_type: 'service_fait' }
          } as any);
          
          if (insertError) throw insertError;
        }
      }
      
      // Si le statut est "approved", déclencher la synchronisation complète
      if (newStatus === 'approved') {
        setIsSyncing(true);
        const syncService = getInspectionApprovalSyncService();
        const context: InspectionApprovalContext = {
          inspectionId: inspection.id,
          projectId: inspection.project_id,
          phaseId: inspection.phase_id,
          status: newStatus,
          progressAtInspection: parseInt(newProgress),
          inspector: inspection.inspector,
          validationDocuments: uploadedDocs.length > 0 ? uploadedDocs : undefined,
        };
        
        const result = await syncService.synchronizeOnApproval(context);
        setSyncResult(result);
        setIsSyncing(false);
        
        if (result.success) {
          toast.success('Inspection approuvée et synchronisation complète effectuée');
        } else {
          toast.warning('Inspection mise à jour avec des erreurs de synchronisation');
        }
        
        onUpdate(inspection.id, newStatus, parseInt(newProgress), documents.length > 0 ? documents : undefined, result);
      } else {
        onUpdate(inspection.id, newStatus, parseInt(newProgress), documents.length > 0 ? documents : undefined);
        toast.success('Inspection mise à jour');
      }
    } catch (error) {
      console.error('Error updating inspection:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUploading(false);
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      scheduled: { color: "bg-blue-100 text-blue-800", label: "Programmée" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", label: "En cours" },
      completed: { color: "bg-green-100 text-green-800", label: "Terminée" },
      approved: { color: "bg-green-100 text-green-800", label: "Approuvée" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejetée" },
      failed: { color: "bg-red-100 text-red-800", label: "Échouée" }
    };
    
    const config = configs[status as keyof typeof configs] || configs.scheduled;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="font-medium text-lg">{projectTitle}</h4>
            <p className="text-sm text-muted-foreground">
              Inspecteur: {inspection.inspector}
            </p>
            <p className="text-sm text-muted-foreground">
              Date: {new Date(inspection.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          {getStatusBadge(inspection.status)}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Statut de l'inspection *</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Programmée</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminée</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                  <SelectItem value="failed">Échouée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progression observée (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
                placeholder="0-100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Observations et recommandations</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Décrivez les observations, non-conformités, recommandations..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="validation-documents">Documents de validation</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              <input
                id="validation-documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setDocuments(files);
                }}
                className="hidden"
              />
              <label htmlFor="validation-documents" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {documents.length > 0
                    ? `${documents.length} document(s) de validation sélectionné(s)`
                    : 'Ajoutez les photos, rapports, PV de validation (PDF, images, Word)'}
                </p>
                {documents.length > 0 && (
                  <div className="mt-2 text-xs text-left max-h-20 overflow-y-auto">
                    {documents.map((file, idx) => (
                      <div key={idx} className="text-muted-foreground">• {file.name}</div>
                    ))}
                  </div>
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Les documents seront attachés à l'inspection et visibles dans les détails du projet
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            {inspection.status === 'scheduled' && (
              <Button 
                type="button"
                onClick={() => {
                  setNewStatus('in_progress');
                  onUpdate(inspection.id, 'in_progress');
                }}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Commencer l'inspection
              </Button>
            )}
            
            {(inspection.status === 'in_progress' || inspection.status === 'scheduled') && (
              <>
                <Button 
                  type="submit"
                  variant="default"
                  className="gap-2"
                  disabled={isUploading || isSyncing}
                >
                  {isSyncing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {isSyncing ? 'Synchronisation...' : 'Enregistrer et mettre à jour'}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="gap-2"
                  disabled={isUploading || isSyncing}
                  onClick={() => {
                    setNewStatus('failed');
                    onUpdate(inspection.id, 'failed', undefined, documents.length > 0 ? documents : undefined);
                  }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Marquer comme échouée
                </Button>
              </>
            )}
          </div>

          {/* Indicateur seuils automatiques */}
          {newStatus === 'approved' && (
            <Alert className="bg-blue-50 border-blue-200">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Actions automatiques à l'approbation :</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Synchronisation progression projet/phase/jalons</li>
                  {parseInt(newProgress) >= SYNC_THRESHOLDS.PAYMENT_TRIGGER && (
                    <li className="flex items-center gap-1">
                      <Banknote className="h-3 w-3" />
                      Déclenchement demande de paiement (≥{SYNC_THRESHOLDS.PAYMENT_TRIGGER}%)
                    </li>
                  )}
                  {parseInt(newProgress) >= SYNC_THRESHOLDS.PHASE_RELEASE && (
                    <li className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Demande mainlevée garanties/assurances (100%)
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {newStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ La progression du projet sera automatiquement mise à jour lors de l'enregistrement
            </div>
          )}

          {/* Résultat de synchronisation */}
          {syncResult && (
            <Alert className={syncResult.success ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
              <CheckCircle className={`h-4 w-4 ${syncResult.success ? 'text-green-600' : 'text-amber-600'}`} />
              <AlertDescription>
                <strong className={syncResult.success ? 'text-green-800' : 'text-amber-800'}>
                  {syncResult.success ? 'Synchronisation réussie' : 'Synchronisation partielle'}
                </strong>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Projet</Badge>
                    <span>{syncResult.projectProgressUpdated}%</span>
                  </div>
                  {syncResult.phaseProgressUpdated !== undefined && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Phase</Badge>
                      <span>{syncResult.phaseProgressUpdated}%</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Jalons</Badge>
                    <span>{syncResult.milestonesUpdated} mis à jour</span>
                  </div>
                  {(syncResult.phaseGuaranteesReleased > 0 || syncResult.projectGuaranteesReleased > 0) && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Shield className="h-4 w-4" />
                      <span>{syncResult.phaseGuaranteesReleased + syncResult.projectGuaranteesReleased} garantie(s) - mainlevée</span>
                    </div>
                  )}
                  {(syncResult.phaseInsurancesReleased > 0 || syncResult.projectInsurancesReleased > 0) && (
                    <div className="flex items-center gap-2 text-green-700">
                      <FileText className="h-4 w-4" />
                      <span>{syncResult.phaseInsurancesReleased + syncResult.projectInsurancesReleased} assurance(s) - libérée(s)</span>
                    </div>
                  )}
                  {syncResult.paymentTriggered && (
                    <div className="flex items-center gap-2 text-blue-700 col-span-2">
                      <Banknote className="h-4 w-4" />
                      <span>Paiement demandé: {syncResult.paymentAmount?.toLocaleString()} MRU</span>
                    </div>
                  )}
                </div>
                {syncResult.errors.length > 0 && (
                  <div className="mt-2 text-red-600 text-xs">
                    {syncResult.errors.map((err, i) => (
                      <div key={i}>⚠️ {err}</div>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default InspectionExecutionForm;
