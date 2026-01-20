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
  getInspectionApprovalSyncService, 
  InspectionApprovalContext,
  SyncResult,
  SYNC_THRESHOLDS 
} from '@/application/services/InspectionApprovalSyncService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInspectionExecutionHex } from '@/hooks/hexagonal/useInspectionExecutionHex';

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

  const { uploadDocumentsMutation, updateInspectionMutation } = useInspectionExecutionHex();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setSyncResult(null);
    
    try {
      const result = await uploadDocumentsMutation.mutateAsync({
        inspectionId: inspection.id,
        documents
      });
      
      // Update inspection status
      await updateInspectionMutation.mutateAsync({
        inspectionId: inspection.id,
        status: newStatus,
        progress: parseInt(newProgress),
        comments
      });
      
      // Si le statut est "approved", déclencher la synchronisation complète
      if (newStatus === 'approved') {
        setIsSyncing(true);
        const syncService = getInspectionApprovalSyncService();
        const context: InspectionApprovalContext = {
          inspectionId: inspection.id,
          projectId: inspection.project_id,
          phaseId: inspection.phase_id,
          status: newStatus,
          progress: parseInt(newProgress),
          documents: result.uploadedDocs
        };
        
        const syncResult = await syncService.syncInspectionApproval(context);
        setSyncResult(syncResult);
      }
      
      onUpdate(inspection.id, newStatus, parseInt(newProgress), documents, syncResult);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'exécution de l\'inspection',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsSyncing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Exécution d'Inspection</h3>
            <Badge variant="outline">
              Projet: {projectTitle}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select 
                value={newStatus} 
                onValueChange={(value) => setNewStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="progress">Progression (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
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
              placeholder="Ajouter des commentaires sur l'inspection..."
            />
          </div>

          <div>
            <Label>Documents justificatifs</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Glissez-déposez les fichiers ici ou cliquez pour sélectionner
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDocuments(Array.from(e.target.files || []))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {syncResult && (
            <Alert className="mt-4">
              <AlertDescription>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Synchronisation réussie: {syncResult.message}</span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="submit" 
              onClick={handleSubmit}
              disabled={isUploading || isSyncing}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Exécuter l'Inspection
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InspectionExecutionForm;