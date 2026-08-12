import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import { getPriorityColor } from '@/utils/notificationUtils';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { useTaskAssignmentHex, useTaskAssignmentsHex } from '@/hooks/hexagonal';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/contexts/use-auth';
import { useLanguage } from '@/contexts/LanguageContext';

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, hasAnyRole } = useCurrentUserRoles();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [newNote, setNewNote] = useState('');
  
  // Use hexagonal hook
  const { task, isLoading: loading, refetch, updateTask } = useTaskAssignmentHex(taskId);
  const { startTaskAsync, completeTaskAsync, addNoteAsync } = useTaskAssignmentsHex();
  const [updating, setUpdating] = useState(false);

  // Check access
  const isAssigned = task?.assignedTo === user?.id;
  const isAdmin = hasAnyRole(['admin', 'director']);
  const hasAccess = isAssigned || isAdmin;

  const handleAddNote = async () => {
    if (!newNote.trim() || !task) return;

    setUpdating(true);
    try {
      await addNoteAsync({ id: task.id, note: newNote });
      setNewNote('');
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'in_progress' | 'completed') => {
    if (!task) return;

    setUpdating(true);
    try {
      if (newStatus === 'in_progress') {
        await startTaskAsync(task.id);
      } else {
        await completeTaskAsync(task.id);
      }

      toast({
        title: 'Statut mis à jour',
        description: `Tâche marquée comme ${newStatus === 'completed' ? 'terminée' : 'en cours'}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout pageTitle={t('task.title')}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess || !task) {
    return (
      <AppLayout pageTitle={t('task.title')}>
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">
              {!task ? 'Tâche introuvable' : 'Accès refusé'}
            </h2>
            <p className="text-muted-foreground">
              {!task 
                ? 'Cette tâche n\'existe pas ou a été supprimée.'
                : 'Vous n\'avez pas les permissions nécessaires pour accéder à cette tâche.'}
            </p>
            <Button variant="outline" onClick={() => navigate(-1)} aria-label="Revenir à la page précédente">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      pageTitle={task.title}
      pageDescription="Détail de la tâche"
    >
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6" aria-label="Revenir à la page précédente">
        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{task.title}</CardTitle>
              <p className="text-muted-foreground mt-2">{task.description}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant={
                task.status === 'completed' ? 'default' : 
                task.status === 'in_progress' ? 'secondary' : 
                'outline'
              }>
                {task.status === 'completed' ? 'Terminée' :
                 task.status === 'in_progress' ? 'En cours' :
                 task.status === 'cancelled' ? 'Annulée' : 'En attente'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Date limite</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Date de completion</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.completedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            {task.notes && (
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {task.notes}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-task-note" className="sr-only">Ajouter une note</Label>
              <Textarea
                id="new-task-note"
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                aria-label="Nouvelle note pour la tâche"
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim() || updating} aria-busy={updating}>
                Ajouter une note
              </Button>
            </div>
          </div>

          {task.status !== 'completed' && (
            <div className="flex gap-2 pt-4 border-t">
              {task.status === 'pending' && (
                <Button 
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  aria-busy={updating}
                  variant="outline"
                >
                  <AlertCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Commencer la tâche
                </Button>
              )}
              <Button 
                onClick={() => handleUpdateStatus('completed')}
                disabled={updating}
                aria-busy={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Marquer comme terminée
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {(task as any).projectId && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/projects/${(task as any).projectId}`} aria-label="Ouvrir le projet associé">
                  Projet <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
                </Link>
              </Button>
            )}
            {(task as any).phaseId && (task as any).projectId && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/projects/${(task as any).projectId}/phases/${(task as any).phaseId}`} aria-label="Ouvrir la phase associée">
                  Phase <ExternalLink className="h-3 w-3 ml-1" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default TaskDetail;