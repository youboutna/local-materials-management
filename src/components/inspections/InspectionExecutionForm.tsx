import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface InspectionExecutionFormProps {
  inspection: {
    id: string;
    project_id: string;
    status: string;
    progress_at_inspection: number;
    comments?: string | null;
    inspector: string;
    date: string;
  };
  projectTitle: string;
  onUpdate: (inspectionId: string, status: string, progress?: number, documents?: File[]) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(
      inspection.id,
      newStatus,
      parseInt(newProgress) || undefined,
      documents.length > 0 ? documents : undefined
    );
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
                >
                  <CheckCircle className="h-4 w-4" />
                  Enregistrer et mettre à jour
                </Button>
                <Button 
                  type="button" 
                  variant="destructive"
                  className="gap-2"
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

          {newStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              ✅ La progression du projet sera automatiquement mise à jour lors de l'enregistrement
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default InspectionExecutionForm;
