import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, CheckCircle } from 'lucide-react';
import { 
  ProcurementPhase, 
  ProcurementStage,
  getSuggestedDocuments,
  PROCUREMENT_STAGES,
  PROCUREMENT_PHASE_LABELS
} from './PublicProcurementWorkflow';
import type { TenderDocumentCategory } from '@/types/tender';

interface StandardWorkflowDocumentSuggestionsProps {
  selectedPhase: ProcurementPhase;
  selectedStepId?: number;
  onAddDocument: (documentData: {
    category: TenderDocumentCategory;
    subcategory: string;
    title: string;
    isRequired: boolean;
  }) => void;
  existingDocuments?: string[];
}

const StandardWorkflowDocumentSuggestions = ({
  selectedPhase,
  selectedStepId,
  onAddDocument,
  existingDocuments = []
}: StandardWorkflowDocumentSuggestionsProps) => {
  const [selectedStage, setSelectedStage] = useState<ProcurementStage | null>(null);

  // Safely get stages for the selected phase
  const phaseStages = PROCUREMENT_STAGES[selectedPhase] || [];

  const isDocumentAlreadyAdded = (docTitle: string) => {
    return existingDocuments.some(doc =>
      doc.toLowerCase().includes(docTitle.toLowerCase()) ||
      docTitle.toLowerCase().includes(doc.toLowerCase())
    );
  };

  const handleAddDocument = (documentData: {
    category: TenderDocumentCategory;
    subcategory: string;
    title: string;
    isRequired: boolean;
  }) => {
    onAddDocument(documentData);
  };

  // Get stage-specific documents
  const getStageSpecificDocuments = () => {
    if (!selectedPhase || !selectedStage) return [];
    return getSuggestedDocuments(selectedPhase, selectedStage);
  };

  const stageDocuments = getStageSpecificDocuments();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents suggérés pour l'étape
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            Phase: {PROCUREMENT_PHASE_LABELS[selectedPhase] || selectedPhase}
          </Badge>
          <p className="text-sm text-gray-600">
            Sélectionnez une étape pour voir les documents recommandés
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stage Selection */}
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-2">Sélectionnez une étape:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {phaseStages.length > 0 ? (
                phaseStages.map((stage) => (
                  <Button
                    key={stage.value}
                    variant={selectedStage === stage.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStage(selectedStage === stage.value ? null : stage.value)}
                    className="text-xs justify-start text-left h-auto min-h-[40px] py-2"
                  >
                    {stage.label}
                  </Button>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">Aucune étape disponible pour cette phase.</p>
                </div>
              )}
            </div>
          </div>

          {selectedStage && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm">
                  {PROCUREMENT_PHASE_LABELS[selectedPhase] || selectedPhase}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {phaseStages.find(s => s.value === selectedStage)?.label || selectedStage}
                </Badge>
                <Badge variant="secondary">
                  {stageDocuments.length} documents suggérés
                </Badge>
              </div>

              <div className="space-y-3">
                {stageDocuments.length > 0 ? (
                  stageDocuments.map((doc, index) => {
                    const isAdded = isDocumentAlreadyAdded(doc.title);

                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {doc.category === 'administrative' ? 'Admin' : 
                                 doc.category === 'technical' ? 'Tech' : 'Fin'}
                              </Badge>
                              {doc.isRequired && (
                                <Badge variant="destructive" className="text-xs">
                                  Requis
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAdded ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Ajouté
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddDocument(doc)}
                              disabled={isAdded}
                              className="whitespace-nowrap"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Ajouter
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm">Aucune suggestion de document pour cette étape.</p>
                    <p className="text-xs mt-1">
                      Vous pourrez ajouter des documents manuellement après avoir créé l'étape.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Ces documents sont spécifiques à l'étape sélectionnée 
                  et sont basés sur les standards des marchés publics mauritaniens.
                </p>
              </div>
            </div>
          )}

          {!selectedStage && phaseStages.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm">Sélectionnez une étape pour voir les documents suggérés</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StandardWorkflowDocumentSuggestions;