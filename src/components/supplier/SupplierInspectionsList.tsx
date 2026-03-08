import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Calendar, User, FileText, Edit } from 'lucide-react';
import { InspectionDTO } from '@/dtos/entities/InspectionDTO';
import { useNavigate } from 'react-router-dom';
import { SupplierInspectionExecutionDialog } from './SupplierInspectionExecutionDialog';

interface SupplierInspectionsListProps {
  inspections: InspectionDTO[];
  loading?: boolean;
  supplierId?: string;
  onInspectionUpdated?: () => void;
}

const getStatusConfig = (status: string) => {
  const configs = {
    approved: {
      label: 'Approuvée',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
    },
    rejected: {
      label: 'Rejetée',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
    },
    in_progress: {
      label: 'En cours',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
    },
    requires_changes: {
      label: 'Modifications requises',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
    },
    scheduled: {
      label: 'Programmée',
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
    }
  };

  return configs[status as keyof typeof configs] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
  };
};

export const SupplierInspectionsList: React.FC<SupplierInspectionsListProps> = ({ 
  inspections, 
  loading,
  supplierId,
  onInspectionUpdated
}) => {
  const navigate = useNavigate();
  const [selectedInspection, setSelectedInspection] = useState<InspectionDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleEditInspection = (inspection: InspectionDTO) => {
    setSelectedInspection(inspection);
    setDialogOpen(true);
  };

  const handleInspectionCompleted = () => {
    onInspectionUpdated?.();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Inspections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Inspections ({inspections.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/inspection-monitoring')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Suivi complet
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {inspections.length > 0 ? (
            inspections.map((inspection) => {
              const statusConfig = getStatusConfig(inspection.status);
              
              return (
                <div 
                  key={inspection.id} 
                  className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Project Title */}
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-medium text-lg">
                          {(inspection as any).projects?.title || inspection.projectId || 'Projet inconnu'}
                        </h3>
                      </div>

                      {/* Inspection Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Inspecteur:</span>
                          <span>{inspection.inspector}</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Date:</span>
                          <span>
                            {inspection.date 
                              ? new Date(inspection.date).toLocaleDateString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Date inconnue'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">Progrès:</span>
                          <span className="font-semibold text-primary">
                            {inspection.progress_at_inspection}%
                          </span>
                        </div>

                        {(inspection as any).projects?.status && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">Projet:</span>
                            <Badge variant="outline" className="text-xs">
                              {(inspection as any).projects.status}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Comments */}
                      {inspection.comments && (
                        <div className="p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium mb-1">Commentaires:</p>
                          <p className="text-sm text-muted-foreground">
                            {inspection.comments}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status Badge and Actions */}
                    <div className="flex flex-col gap-2">
                      <Badge 
                        variant="secondary"
                        className={statusConfig.className}
                      >
                        {statusConfig.label}
                      </Badge>
                      
                      {/* Edit button for scheduled inspections */}
                      {inspection.status === 'scheduled' && supplierId && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditInspection(inspection)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Compléter
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">
                Aucune inspection programmée
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Les inspections liées à vos projets apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Inspection Execution Dialog */}
      {supplierId && (
        <SupplierInspectionExecutionDialog
          inspection={selectedInspection}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onInspectionCompleted={handleInspectionCompleted}
          supplierId={supplierId}
        />
      )}
    </Card>
  );
};
