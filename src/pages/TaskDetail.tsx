import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { getPriorityColor } from '@/utils/notificationUtils';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';

interface TaskAssignment {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
  completion_date?: string;
  notes?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, hasAnyRole } = useCurrentUserRoles();
  const [task, setTask] = useState<TaskAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (taskId && taskId !== 'list' && currentUser) {
      fetchTask();
    } else if (!taskId || taskId === 'list') {
      navigate('/dashboard');
    }
  }, [taskId, currentUser]);

  const fetchTask = async () => {
    if (!taskId || !currentUser) return;

    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      // Check if user has access (assigned to them or admin/director)
      const isAssigned = data.assigned_to === currentUser.id;
      const isAdmin = hasAnyRole(['admin', 'director']);
      
      if (!isAssigned && !isAdmin) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setTask({
        ...data,
        description: data.description || undefined,
        due_date: data.due_date || undefined,
        completion_date: data.completion_date || undefined,
        notes: data.notes || undefined,
        project_id: data.project_id || undefined,
      } as TaskAssignment);
    } catch (error: any) {
      console.error('Error fetching task:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la tâche',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !task) return;

    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const timestamp = new Date().toLocaleString('fr-FR');
      const noteWithMeta = `[${timestamp}] ${user?.email || 'Utilisateur'}: ${newNote}`;
      
      const updatedNotes = task.notes 
        ? `${task.notes}\n\n${noteWithMeta}`
        : noteWithMeta;

      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: 'Note ajoutée',
        description: 'Votre note a été ajoutée à la tâche',
      });

      setNewNote('');
      fetchTask();
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
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('task_assignments')
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;

      // Create notification for assigner
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('notifications')
        .insert({
          recipient_id: task.assigned_by,
          title: newStatus === 'completed' ? 'Tâche terminée' : 'Tâche en cours',
          message: `${user?.email || 'Un utilisateur'} a marqué la tâche "${task.title}" comme ${newStatus === 'completed' ? 'terminée' : 'en cours'}`,
          type: newStatus === 'completed' ? 'task_completed' : 'task_assignment',
          related_id: task.id,
          metadata: {
            task_id: task.id,
            task_type: 'general',
          },
        });

      toast({
        title: 'Statut mis à jour',
        description: `Tâche marquée comme ${newStatus === 'completed' ? 'terminée' : 'en cours'}`,
      });

      fetchTask();
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-destructive">Accès refusé</h2>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions nécessaires pour accéder à cette tâche.
            </p>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Tâche introuvable</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
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
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            {task.due_date && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date limite</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.due_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
            {task.completion_date && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Date de completion</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.completion_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notes</h3>
            {task.notes && (
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {task.notes}
              </div>
            )}
            
            <div className="space-y-2">
              <Textarea
                placeholder="Ajouter une note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!newNote.trim() || updating}>
                Ajouter une note
              </Button>
            </div>
          </div>

          {/* Actions */}
          {task.status !== 'completed' && (
            <div className="flex gap-2 pt-4 border-t">
              {task.status === 'pending' && (
                <Button 
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={updating}
                  variant="outline"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Commencer la tâche
                </Button>
              )}
              <Button 
                onClick={() => handleUpdateStatus('completed')}
                disabled={updating}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme terminée
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskDetail;
