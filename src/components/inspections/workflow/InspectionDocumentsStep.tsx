/**
 * InspectionDocumentsStep - Étape de configuration des documents requis
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileText, Camera, MapPin, FileSpreadsheet, Paperclip, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  InspectionWorkflowService, 
  RequiredDocument, 
  InspectionDocumentType 
} from '@/services/inspection/InspectionWorkflowService';

interface InspectionDocumentsStepProps {
  inspectionType: string;
  selectedDocuments: InspectionDocumentType[];
  onUpdate: (documents: InspectionDocumentType[]) => void;
  onComplete: () => void;
  mode: 'request' | 'schedule';
}

const getDocumentIcon = (type: InspectionDocumentType) => {
  switch (type) {
    case 'pv_service_fait':
    case 'pv_main_levee':
    case 'rapport_final':
      return <FileText className="h-4 w-4" />;
    case 'photos':
      return <Camera className="h-4 w-4" />;
    case 'geolocation':
      return <MapPin className="h-4 w-4" />;
    case 'decompte':
      return <FileSpreadsheet className="h-4 w-4" />;
    case 'attachement':
      return <Paperclip className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const InspectionDocumentsStep: React.FC<InspectionDocumentsStepProps> = ({
  inspectionType,
  selectedDocuments,
  onUpdate,
  onComplete,
  mode,
}) => {
  const requiredDocs = InspectionWorkflowService.getRequiredDocuments(inspectionType);

  const toggleDocument = (docType: InspectionDocumentType) => {
    if (selectedDocuments.includes(docType)) {
      onUpdate(selectedDocuments.filter(d => d !== docType));
    } else {
      onUpdate([...selectedDocuments, docType]);
    }
  };

  const selectAllRequired = () => {
    const required = requiredDocs.filter(d => d.required).map(d => d.type);
    onUpdate([...new Set([...selectedDocuments, ...required])]);
  };

  const allRequiredSelected = requiredDocs
    .filter(d => d.required)
    .every(d => selectedDocuments.includes(d.type));

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Documents requis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'request' 
            ? 'Définissez les documents qui devront être fournis lors de l\'inspection'
            : 'Confirmez les documents obligatoires pour cette inspection'}
        </p>
      </div>

      <div className="flex justify-between items-center">
        <Badge variant="outline" className={allRequiredSelected ? 'bg-green-50 text-green-700' : ''}>
          {selectedDocuments.length} / {requiredDocs.length} documents sélectionnés
        </Badge>
        <Button variant="outline" size="sm" onClick={selectAllRequired}>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Sélectionner tous les obligatoires
        </Button>
      </div>

      <div className="grid gap-3">
        {requiredDocs.map((doc) => {
          const isSelected = selectedDocuments.includes(doc.type);
          
          return (
            <Card
              key={doc.type}
              className={cn(
                'cursor-pointer transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50',
                doc.required && !isSelected && 'border-destructive/50'
              )}
              onClick={() => toggleDocument(doc.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleDocument(doc.type)}
                  />
                  <div className={cn(
                    'p-2 rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}>
                    {getDocumentIcon(doc.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium cursor-pointer">{doc.label}</Label>
                      {doc.required && (
                        <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {doc.minCount && (
                        <span>Min: {doc.minCount}</span>
                      )}
                      {doc.maxCount && (
                        <span>Max: {doc.maxCount}</span>
                      )}
                      {doc.acceptedFormats && (
                        <span>Formats: {doc.acceptedFormats.join(', ')}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onComplete} disabled={!allRequiredSelected}>
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default InspectionDocumentsStep;
