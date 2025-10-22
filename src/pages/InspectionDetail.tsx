import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, User, FileText, TrendingUp, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { InspectionDTO } from '@/types/inspection.dto';

const InspectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: inspection, isLoading, error } = useQuery({
    queryKey: ['inspection', id],
    queryFn: async () => {
      if (!id) throw new Error('ID d\'inspection manquant');
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          projects (
            title,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as InspectionDTO;
    },
    enabled: !!id,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Planifiée', variant: 'outline' as const },
      in_progress: { label: 'En cours', variant: 'default' as const },
      approved: { label: 'Approuvée', variant: 'default' as const },
      rejected: { label: 'Rejetée', variant: 'destructive' as const },
      requires_changes: { label: 'Modifications requises', variant: 'secondary' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <p className="text-destructive">Erreur lors du chargement de l'inspection</p>
                <Button onClick={() => navigate(-1)} className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <Button onClick={() => navigate(`/inspections/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">Détail de l'inspection</CardTitle>
                  <CardDescription>
                    {inspection.projects?.title || 'Projet non spécifié'}
                  </CardDescription>
                </div>
                {getStatusBadge(inspection.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date d'inspection
                  </div>
                  <p className="text-lg font-medium">
                    {format(new Date(inspection.date), 'PPP', { locale: fr })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    Inspecteur
                  </div>
                  <p className="text-lg font-medium">{inspection.inspector}</p>
                </div>

                {inspection.progress_at_inspection !== null && (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Progression lors de l'inspection
                    </div>
                    <p className="text-lg font-medium">{inspection.progress_at_inspection}%</p>
                  </div>
                )}
              </div>

              {inspection.comments && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 mr-2" />
                      Commentaires
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {inspection.comments}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Créé le:</span>{' '}
                  {format(new Date(inspection.created_at), 'PPP à HH:mm', { locale: fr })}
                </div>
                <div>
                  <span className="font-medium">Modifié le:</span>{' '}
                  {format(new Date(inspection.updated_at), 'PPP à HH:mm', { locale: fr })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InspectionDetail;
