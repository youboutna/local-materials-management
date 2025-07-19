import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import { getStepIcon, getStepColor } from './OfficialWorkflowSteps';

interface StandardDocumentTemplate {
  id: number;
  stage: string;
  title: string;
  mandatoryDocuments: string[];
  category: 'planning' | 'publicity' | 'analysis' | 'attribution' | 'control';
  attachmentNumbers?: string[];
}

const STANDARD_DOCUMENT_TEMPLATES: StandardDocumentTemplate[] = [
  {
    id: 1,
    stage: "Planning (APP)",
    title: "Planification des achats",
    mandatoryDocuments: ["Attachment N°1 (APP Template)"],
    category: 'planning',
    attachmentNumbers: ["N°1"]
  },
  {
    id: 2,
    stage: "Initiation",
    title: "Lancement du processus",
    mandatoryDocuments: ["Attachment N°2 (Initiation Request)"],
    category: 'publicity',
    attachmentNumbers: ["N°2"]
  },
  {
    id: 3,
    stage: "Selection",
    title: "Sélection des soumissionnaires",
    mandatoryDocuments: [
      "Attachment N°3 - Lettre de soumission",
      "Attachment N°4 - Pouvoir de signature", 
      "Attachment N°5 - Acte de groupement",
      "Attachment N°6 - Attestation d'impôt",
      "Attachment N°7 - Attestation CNSS",
      "Attachment N°8 - Attestation non faillite"
    ],
    category: 'analysis',
    attachmentNumbers: ["N°3", "N°4", "N°5", "N°6", "N°7", "N°8"]
  },
  {
    id: 4,
    stage: "Award",
    title: "Attribution du marché",
    mandatoryDocuments: [
      "Attachment N°11 (Notification)",
      "Signed Contract"
    ],
    category: 'attribution',
    attachmentNumbers: ["N°11"]
  },
  {
    id: 5,
    stage: "Archiving",
    title: "Archivage et contrôle",
    mandatoryDocuments: [
      "Complete file (bids)",
      "Meeting minutes", 
      "Contracts",
      "Proofs of execution"
    ],
    category: 'control'
  }
];

interface StandardWorkflowDocumentSuggestionsProps {
  selectedStepId?: number;
  onAddDocument?: (documentTemplate: string, category: string) => void;
  existingDocuments?: string[];
}

const StandardWorkflowDocumentSuggestions = ({ 
  selectedStepId, 
  onAddDocument, 
  existingDocuments = [] 
}: StandardWorkflowDocumentSuggestionsProps) => {
  
  const selectedTemplate = STANDARD_DOCUMENT_TEMPLATES.find(template => template.id === selectedStepId);

  if (!selectedTemplate) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">Sélectionnez une étape</h3>
          <p className="text-gray-600">
            Choisissez une étape du workflow standard pour voir les documents suggérés.
          </p>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = getStepIcon(selectedTemplate.category);
  const isDocumentAlreadyAdded = (docName: string) => {
    return existingDocuments.some(doc => 
      doc.toLowerCase().includes(docName.toLowerCase()) || 
      docName.toLowerCase().includes(doc.toLowerCase())
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconComponent className="h-5 w-5" />
          Documents suggérés - {selectedTemplate.title}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Stage: {selectedTemplate.stage}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={getStepColor(selectedTemplate.category)}>
              Étape {selectedTemplate.id}
            </Badge>
            <Badge variant="outline">
              {selectedTemplate.mandatoryDocuments.length} documents requis
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Documents obligatoires:</h4>
            {selectedTemplate.mandatoryDocuments.map((document, index) => {
              const isAdded = isDocumentAlreadyAdded(document);
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{document}</p>
                      {selectedTemplate.attachmentNumbers?.[index] && (
                        <p className="text-xs text-gray-500">
                          Référence: {selectedTemplate.attachmentNumbers[index]}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isAdded ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Ajouté
                      </Badge>
                    ) : (
                      onAddDocument && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onAddDocument(document, selectedTemplate.category)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Ajouter
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Ces documents sont basés sur les standards des marchés publics mauritaniens. 
              Vous pouvez les utiliser comme modèle et les adapter selon vos besoins spécifiques.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandardWorkflowDocumentSuggestions;