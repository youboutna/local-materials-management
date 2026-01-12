/**
 * InspectionReviewStep - Étape de révision finale avant soumission
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Bell, 
  CheckCircle2,
  Send,
  CalendarPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InspectionDetails } from './InspectionDetailsStep';
import { InspectionDocumentType, InspectionWorkflowService } from '@/services/inspection/InspectionWorkflowService';

interface InspectionReviewStepProps {
  mode: 'request' | 'schedule';
  inspectionType: string;
  details: InspectionDetails;
  documents: InspectionDocumentType[];
  notifyContractor: boolean;
  onNotifyContractorChange: (notify: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  projectName?: string;
  phaseName?: string;
}

const INSPECTION_TYPE_LABELS: Record<string, string> = {
  progress: 'Avancement des Travaux',
  quality: 'Contrôle Qualité',
  safety: 'Sécurité',
  compliance: 'Conformité Réglementaire',
  materials: 'Contrôle Matériaux',
  structural: 'Contrôle Structurel',
  final: 'Réception Définitive',
};

const PRIORITY_LABELS: Record<string, { label: string; class: string }> = {
  low: { label: 'Basse', class: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Moyenne', class: 'bg-blue-100 text-blue-700' },
  high: { label: 'Haute', class: 'bg-orange-100 text-orange-700' },
};

const InspectionReviewStep: React.FC<InspectionReviewStepProps> = ({
  mode,
  inspectionType,
  details,
  documents,
  notifyContractor,
  onNotifyContractorChange,
  onSubmit,
  isSubmitting,
  projectName,
  phaseName,
}) => {
  const requiredDocs = InspectionWorkflowService.getRequiredDocuments(inspectionType);
  const selectedDocs = requiredDocs.filter(d => documents.includes(d.type));

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE d MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Récapitulatif</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez les informations avant de {mode === 'request' ? 'soumettre la demande' : 'programmer l\'inspection'}
        </p>
      </div>

      {/* Project & Phase Info */}
      {(projectName || phaseName) && (
        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{projectName}</span>
              {phaseName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{phaseName}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inspection Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Type d'inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2">
              <Badge>{INSPECTION_TYPE_LABELS[inspectionType] || inspectionType}</Badge>
              <Badge className={PRIORITY_LABELS[details.priority]?.class}>
                {PRIORITY_LABELS[details.priority]?.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date et Heure
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              <p className="font-medium">{formatDate(details.scheduled_date)}</p>
              {mode === 'schedule' && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {details.scheduled_time} • {details.estimated_duration_hours}h estimées
                </p>
              )}
              {mode === 'request' && details.proposed_dates && details.proposed_dates.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{details.proposed_dates.length - 1} date(s) alternative(s)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inspector - Only for schedule mode */}
        {mode === 'schedule' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Inspecteur
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="font-medium">{details.inspector_name || 'Non assigné'}</p>
              {details.backup_inspector_id && (
                <p className="text-xs text-muted-foreground">Suppléant assigné</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents requis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {selectedDocs.map(doc => (
                <Badge key={doc.type} variant="outline" className="text-xs">
                  <CheckCircle2 className="h-2 w-2 mr-1" />
                  {doc.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements */}
      {details.requirements && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Exigences particulières</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">{details.requirements}</p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Notifications */}
      <div className="flex items-center space-x-4 p-4 rounded-lg border bg-muted/20">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <Label htmlFor="notify" className="font-medium">Notifications</Label>
          <p className="text-xs text-muted-foreground">
            Notifier l'entrepreneur de cette {mode === 'request' ? 'demande' : 'programmation'}
          </p>
        </div>
        <Checkbox
          id="notify"
          checked={notifyContractor}
          onCheckedChange={(checked) => onNotifyContractorChange(checked as boolean)}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          size="lg"
          className="gap-2"
        >
          {isSubmitting ? (
            <>Traitement en cours...</>
          ) : mode === 'request' ? (
            <>
              <Send className="h-4 w-4" />
              Soumettre la demande
            </>
          ) : (
            <>
              <CalendarPlus className="h-4 w-4" />
              Programmer l'inspection
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default InspectionReviewStep;
