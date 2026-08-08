import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle, AlertTriangle, FileText, Shield, Banknote, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  InspectionApprovalSyncService, 
  InspectionApprovalContext,
  SyncResult,
  SYNC_THRESHOLDS, getInspectionApprovalSyncService} from '@/application/services/InspectionApprovalSyncService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInspectionExecutionHex } from '@/hooks/hexagonal';

interface InspectionExecutionFormProps {
  inspection: {
    id: string;
    projectId: string;
    status: string;
    progressAtInspection: number;
    comments?: string | null;
    inspector: string;
    date: string;
    phaseId?: string | null;
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
  const [newProgress, setNewProgress] = useState(inspection.progressAtInspection.toString());
  const [comments, setComments] = useState(inspection.comments || '');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { uploadDocuments, updateInspection, isUploading: hookIsUploading } = useInspectionExecutionHex();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setSyncResult(null);
    
    try {
      // Upload documents
      uploadDocuments({
        inspectionId: inspection.id,
        documents
      });
      
      // Update inspection status
      updateInspection({
        inspectionId: inspection.id,
        status: newStatus,
        progress: parseInt(newProgress),
        comments
      });
      
      // Si le statut est "approved", déclencher la synchronisation complète
      if (newStatus === 'approved') {
        setIsSyncing(true);
        const syncService = getInspectionApprovalSyncService();
        const validationDocs: any[] = [];
        const context: InspectionApprovalContext = {
          inspectionId: inspection.id,
          projectId: inspection.projectId,
          phaseId: inspection.phaseId,
          status: newStatus,
          progressAtInspection: parseInt(newProgress),
          inspector: inspection.inspector,
          validationDocuments: validationDocs.map((doc: any) => ({
            name: doc.name,
            url: doc.url || '',
            uploadedAt: new Date().toISOString()
          }))
        };
        
        const newSyncResult = await syncService.synchronizeOnApproval(context);
        setSyncResult(newSyncResult);
      }
      
      onUpdate(inspection.id, newStatus, parseInt(newProgress), documents, syncResult || undefined);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Une erreur est survenue lors de l\'exécution de l\'inspection');
    } finally {
      setIsUploading(false);
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Projet</Label>
              <p className="text-sm font-medium">{projectTitle}</p>
            </div>
            <div>
              <Label>Inspecteur</Label>
              <p className="text-sm font-medium">{inspection.inspector}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Statut</Label>
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
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="progress">Progression (%)</Label>
              <Input
                id="progress"
                type="number"
                min={0}
                max={100}
                value={newProgress}
                onChange={(e) => setNewProgress(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label>Documents</Label>
            <Input
              type="file"
              multiple
              onChange={(e) => setDocuments(Array.from(e.target.files || []))}
            />
            {documents.length > 0 && (
              <div className="mt-2 space-y-1">
                {documents.map((doc, i) => (
                  <Badge key={i} variant="secondary" className="mr-2">
                    <FileText className="h-3 w-3 mr-1" />
                    {doc.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {syncResult && (
            <Alert variant={syncResult.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {syncResult.success ? (
                  <div className="space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Synchronisation réussie
                    </p>
                    {syncResult.actions.map((action, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{action}</p>
                    ))}
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Erreurs lors de la synchronisation:</p>
                    {syncResult.errors.map((err, i) => (
                      <p key={i} className="text-sm">{err}</p>
                    ))}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isUploading || isSyncing}>
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                'Mettre à jour'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InspectionExecutionForm;
