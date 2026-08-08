/**
 * DocumentSection - Composant d'affichage des documents associés à un projet
 * 
 * Architecture Hexagonale - RÈGLES STRICTES :
 * - Injection de dépendances via props
 * - Utilisation des services hexagonaux
 * - Types provenant des DTOs
 * - Pas d'appels directs à Supabase
 * 
 * Respecte PROMPT.md :
 * - ✅ Utilisation de DocumentService via injection
 * - ✅ Types DocumentDTO depuis les DTOs
 * - ✅ Gestion des erreurs avec toast
 * - ✅ Séparation UI / Logique métier
 */

import { DocumentService } from '@/application/services/DocumentService';
import DocumentViewer from '@/components/documents/DocumentViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { Download, ExternalLink, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface DocumentSectionProps {
  /** ID du projet */
  projectId: string;
  /** Titre de la section */
  title?: string;
  /** Service de documents injecté pour les tests */
  documentService?: DocumentService;
}

// ============================================================================
// COMPOSANT
// ============================================================================

const DocumentSection: React.FC<DocumentSectionProps> = ({
  projectId,
  title = "Documents associés",
  documentService: injectedDocumentService
}) => {
  // ============================================================================
  // SERVICES HEXAGONAUX (injection)
  // ============================================================================

  // ✅ Injection du service via props ou création avec RepositoryFactory
  const documentService = injectedDocumentService || new DocumentService(
    RepositoryFactory.getDocumentRepository()
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [documents, setDocuments] = useState<DocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDTO | null>(null);
  const [activeTab, setActiveTab] = useState<string>('list');

  // ============================================================================
  // EFFETS
  // ============================================================================

  useEffect(() => {
    if (projectId) {
      loadDocuments();
    }
  }, [projectId]);

  // ============================================================================
  // MÉTHODES
  // ============================================================================

  /**
   * Charge les documents du projet via DocumentService
   */
  const loadDocuments = async (): Promise<void> => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // ✅ Appel via le service hexagonal
      const loadedDocuments = await documentService.getProjectDocuments(projectId);
      setDocuments(loadedDocuments);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de charger les documents',
        variant: 'destructive'
      });
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ouvre un document dans le visualiseur
   */
  const handleViewDocument = (document: DocumentDTO): void => {
    setSelectedDocument(document);
    setActiveTab('viewer');
  };

  /**
   * Télécharge un document
   */
  const handleDownloadDocument = (document: DocumentDTO): void => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    } else {
      toast({
        title: 'Erreur',
        description: 'Ce document n\'a pas de fichier associé',
        variant: 'destructive'
      });
    }
  };

  /**
   * Ouvre un document dans un nouvel onglet
   */
  const handleOpenExternal = (document: DocumentDTO): void => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  /**
   * Ferme le visualiseur
   */
  const handleCloseViewer = (): void => {
    setSelectedDocument(null);
    setActiveTab('list');
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  /**
   * Rend la liste des documents
   */
  const renderDocumentList = (): JSX.Element => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun document associé à ce projet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm truncate">{document.title}</h4>
                    <p className="text-xs text-gray-500 truncate">{document.fileName || 'Sans fichier'}</p>
                    <p className="text-xs text-gray-400">
                      {document.createdAt ? new Date(document.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      {document.uploadedBy && ` • ${document.uploadedBy}`}
                    </p>
                    {document.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        document.status === 'approved' ? 'bg-green-100 text-green-800' :
                        document.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {document.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocument(document)}
                  >
                    Voir
                  </Button>
                  {document.fileUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenExternal(document)}
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {document.fileUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownloadDocument(document)}
                      title="Télécharger"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={loadDocuments}
          disabled={loading}
        >
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="list">
            Liste ({documents.length})
          </TabsTrigger>
          {selectedDocument && (
            <TabsTrigger value="viewer">
              Visualisation
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          {renderDocumentList()}
        </TabsContent>
        
        {selectedDocument && (
          <TabsContent value="viewer" className="mt-4">
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 z-10"
                onClick={handleCloseViewer}
              >
                Fermer
              </Button>
              <DocumentViewer 
                document={{
                  ...selectedDocument,
                  description: selectedDocument.description || '',
                  mime_type: selectedDocument.mimeType || undefined
                } as never} 
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DocumentSection;