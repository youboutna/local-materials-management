// ============================================================
// src/components/project/DocumentsListPaginated.tsx
// ============================================================
/**
 * Documents List Paginated
 * Affichage paginé des documents avec filtrage
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Eye, Download, Trash2 } from 'lucide-react';
import { DocumentDTO, DocumentStatus } from '@/dtos/entities/DocumentDTO';
import { useDocumentViewer } from '@/components/documents/viewer';

interface DocumentsListPaginatedProps {
  documents: DocumentDTO[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onDocumentSelect: (document: DocumentDTO) => void;
  onDocumentDownload?: (document: DocumentDTO) => void;
  onDocumentDelete?: (document: DocumentDTO) => void;
  isLoading?: boolean;
}

const DocumentsListPaginated: React.FC<DocumentsListPaginatedProps> = ({
  documents,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onDocumentSelect,
  onDocumentDownload,
  onDocumentDelete,
  isLoading = false
}) => {
  const generateVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, self) => self.indexOf(item) === index);
  };

  const visiblePages = generateVisiblePages();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'contract': 'Contrat',
      'invoice': 'Facture',
      'report': 'Rapport',
      'certificate': 'Certificat',
      'permit': 'Permis',
      'insurance': 'Assurance',
      'photo': 'Photo',
      'manual': 'Manuel',
      'warranty': 'Garantie',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case DocumentStatus.APPROVED: return 'default';
      case DocumentStatus.DRAFT: return 'secondary';
      case DocumentStatus.PENDING_APPROVAL: return 'outline';
      case DocumentStatus.REJECTED: return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Brouillon',
      'pending_approval': 'En attente',
      'approved': 'Approuvé',
      'rejected': 'Rejeté',
      'archived': 'Archivé',
      'expired': 'Expiré',
      'deprecated': 'Déprécié'
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun document trouvé
          </h3>
          <p className="text-muted-foreground">
            Aucun document ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {totalItems} document{totalItems > 1 ? 's' : ''} trouvé{totalItems > 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                        {document.title}
                      </h3>
                      {document.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(document.status)}>
                      {getStatusLabel(document.status)}
                    </Badge>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(document.documentType)}
                    </Badge>
                    {document.isInternalOnly && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Interne
                      </Badge>
                    )}
                    {document.isSharedWithSuppliers && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Partagé
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(document.createdAt || '').toLocaleDateString('fr-FR')}</span>
                    </div>
                    {document.fileName && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{document.fileName}</span>
                        {document.fileSize && (
                          <span className="text-xs">({formatFileSize(document.fileSize)})</span>
                        )}
                      </div>
                    )}
                    {document.uploadedBy && (
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{document.uploadedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => { openDocument(document); onDocumentSelect?.(document); }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </Button>
                  
                  {onDocumentDownload && document.fileUrl && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onDocumentDownload(document)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {onDocumentDelete && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onDocumentDelete(document)}
                      className="flex items-center gap-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {visiblePages.map((page, index) => (
              <PaginationItem key={index}>
                {page === '...' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default DocumentsListPaginated;