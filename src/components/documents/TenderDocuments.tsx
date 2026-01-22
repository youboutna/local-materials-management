import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { TenderDocumentCategory, TENDER_DOCUMENT_LABELS, TENDER_CATEGORY_LABELS } from '@/types/tender';
import { toast } from '@/hooks/use-toast';
import { useTenderDocuments, useWorkflowStepDocuments } from '@/hooks/hexagonal'

interface TenderDocumentsProps {
  projectId: string;
  onDocumentSelect?: (document: any) => void;
}

const TenderDocuments = ({ projectId, onDocumentSelect }: TenderDocumentsProps) => {
  const [activeCategory, setActiveCategory] = useState<TenderDocumentCategory>('administrative');

  const { data: tenderDocuments, isLoading: isTenderDocsLoading } = useTenderDocuments(projectId);
  const { data: workflowStepDocuments, isLoading: isWorkflowDocsLoading } = useWorkflowStepDocuments(projectId);

  const isLoading = isTenderDocsLoading || isWorkflowDocsLoading;
  
  const allDocuments = [
    ...(tenderDocuments || []),
    ...(workflowStepDocuments || [])
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'requires_revision':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_revision':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'ApprouvÃ©';
      case 'rejected':
        return 'RejetÃ©';
      case 'requires_revision':
        return 'RÃ©vision requise';
      case 'submitted':
        return 'Soumis';
      default:
        return 'En attente';
    }
  };

  const filterDocumentsByCategory = (category: TenderDocumentCategory) => {
    return allDocuments?.filter(doc => doc.category === category) || [];
  };

  const handleViewDocument = (tenderDoc: any) => {
    if (tenderDoc.document && onDocumentSelect) {
      onDocumentSelect(tenderDoc.document);
    } else {
      toast({
        title: "Document non disponible",
        description: "Aucun fichier n'est associÃ© Ã  ce document d'appel d'offres.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-terracotta-600" />
            Documents d'Appel d'Offres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as TenderDocumentCategory)} className="tabs-responsive">
            <TabsList className="tabs-list-responsive tabs-list-3">
              <TabsTrigger value="administrative">Administratifs</TabsTrigger>
              <TabsTrigger value="technical">Techniques</TabsTrigger>
              <TabsTrigger value="financial">FinanciÃ¨res</TabsTrigger>
            </TabsList>

            {(['administrative', 'technical', 'financial'] as TenderDocumentCategory[]).map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-adrar-800 mb-2">
                    {TENDER_CATEGORY_LABELS[category]}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filterDocumentsByCategory(category).map((tenderDoc) => (
                    <Card key={tenderDoc.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">
                              {tenderDoc.subcategory === 'workflow_step' ? (
                                tenderDoc.document?.title || 'Document workflow'
                              ) : (
                                TENDER_DOCUMENT_LABELS[tenderDoc.subcategory]
                              )}
                            </h4>
                            {tenderDoc.subcategory === 'workflow_step' ? (
                              <p className="text-xs text-gray-500 flex items-center">
                                <FileText className="h-3 w-3 mr-1" />
                                Ã‰tape {(tenderDoc as any).step_info?.step_number}: {(tenderDoc as any).step_info?.step_title}
                              </p>
                            ) : (
                              tenderDoc.document?.title && (
                                <p className="text-xs text-gray-600 mb-2">
                                  {tenderDoc.document.title}
                                </p>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {tenderDoc.is_required && (
                              <Badge variant="outline" className="text-xs">
                                Requis
                              </Badge>
                            )}
                            <Badge className={getStatusColor(tenderDoc.status || 'pending')}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(tenderDoc.status || 'pending')}
                                {getStatusLabel(tenderDoc.status || 'pending')}
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {tenderDoc.document?.file_name && (
                          <div className="text-xs text-gray-500 mb-3">
                            Fichier: {tenderDoc.document.file_name}
                          </div>
                        )}
                        
                        {tenderDoc.reviewer_notes && (
                          <div className="text-xs text-gray-600 mb-3 p-2 bg-gray-50 rounded">
                            <strong>Notes:</strong> {tenderDoc.reviewer_notes}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          {tenderDoc.document ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDocument(tenderDoc)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Upload className="h-4 w-4 mr-1" />
                              TÃ©lÃ©charger
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filterDocumentsByCategory(category).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p>Aucun document {TENDER_CATEGORY_LABELS[category].toLowerCase()} trouvÃ© pour ce projet.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderDocuments;
