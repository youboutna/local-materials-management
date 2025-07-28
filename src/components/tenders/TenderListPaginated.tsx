import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, DollarSign, Clock, Eye } from 'lucide-react';

interface Tender {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed' | 'awarded';
  launch_date?: string;
  deadline_date?: string;
  budget_min?: number;
  budget_max?: number;
  market_type?: string;
  created_at: string;
}

interface TenderListPaginatedProps {
  tenders: Tender[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onTenderSelect: (tender: Tender) => void;
  selectedTenderId?: string;
  isLoading?: boolean;
}

const TenderListPaginated: React.FC<TenderListPaginatedProps> = ({
  tenders,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  onTenderSelect,
  selectedTenderId,
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'default';
      case 'draft': return 'secondary';
      case 'closed': return 'outline';
      case 'awarded': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Brouillon',
      'published': 'Publié',
      'closed': 'Fermé',
      'awarded': 'Attribué'
    };
    return labels[status] || status;
  };

  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return 'Non spécifié';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} MRU`;
    if (min) return `À partir de ${min.toLocaleString()} MRU`;
    if (max) return `Jusqu'à ${max.toLocaleString()} MRU`;
    return 'Non spécifié';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
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

  if (tenders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucun appel d'offres trouvé
          </h3>
          <p className="text-muted-foreground">
            Aucun appel d'offres ne correspond à vos critères de recherche.
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
          {totalItems} appel{totalItems > 1 ? 's' : ''} d'offres trouvé{totalItems > 1 ? 's' : ''}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages}
          </p>
        )}
      </div>

      {/* Tenders List */}
      <div className="space-y-4">
        {tenders.map((tender) => (
          <Card 
            key={tender.id} 
            className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
              selectedTenderId === tender.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onTenderSelect(tender)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-lg line-clamp-2">{tender.title}</CardTitle>
                <Badge variant={getStatusBadgeVariant(tender.status)}>
                  {getStatusLabel(tender.status)}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {tender.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">{formatBudget(tender.budget_min, tender.budget_max)}</span>
                  </div>

                  {tender.launch_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Lancement:</span>
                      <span className="font-medium">
                        {new Date(tender.launch_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {tender.deadline_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Échéance:</span>
                      <span className="font-medium">
                        {new Date(tender.deadline_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {tender.market_type && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{tender.market_type}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-muted-foreground">
                    Créé le {new Date(tender.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <Button size="sm" variant="outline" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Voir détails
                  </Button>
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

export default TenderListPaginated;