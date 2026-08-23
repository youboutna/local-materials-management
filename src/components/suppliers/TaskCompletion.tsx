
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useTaskAssignmentsHex } from '@/hooks/hexagonal';

import { TranslatedPriority } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  completion_date?: string;
  notes?: string; // Added missing notes property
  projects?: {
    title: string;
    location: string;
  };
}

interface TaskCompletionProps {
  task: Task;
  onTaskCompleted: () => void;
}

const TaskCompletion = ({ task, onTaskCompleted }: TaskCompletionProps) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeTaskAsync, addNoteAsync } = useTaskAssignmentsHex();

  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      if (notes.trim()) {
        await addNoteAsync({ id: task.id, note: notes.trim() });
      }
      await completeTaskAsync(task.id);

      toast({
        title: "Tâche terminée",
        description: `La tâche "${task.title}" a été marquée comme terminée.`,
      });

      onTaskCompleted();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Erreur",
        description: "Impossible de marquer la tâche comme terminée.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-soft text-success border-success/30';
      case 'in_progress':
        return 'bg-primary/10 text-primary border-primary/30';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {task.title}
            </CardTitle>
            {task.projects && (
              <p className="text-sm text-muted-foreground mt-1">
                Projet: {task.projects.title} - {task.projects.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize"><TranslatedPriority code={task.priority} /></span>
            </Badge>
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status === 'completed' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <Clock className="h-3 w-3 mr-1" />
              )}
              {task.status === 'completed' ? 'Terminé' : 
               task.status === 'in_progress' ? 'En cours' : 'En attente'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.description && (
          <div>
            <h4 className="font-medium text-foreground mb-2"><T k="auto.taskcompletion.description" fallback="Description" /></h4>
            <p className="text-muted-foreground text-sm">{task.description}</p>
          </div>
        )}

        {task.due_date && (
          <div>
            <h4 className="font-medium text-foreground mb-1"><T k="auto.taskcompletion.echeance" fallback="Échéance" /></h4>
            <p className="text-sm text-muted-foreground">
              {new Date(task.due_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        {task.status !== 'completed' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="completion-notes" className="block text-sm font-medium text-foreground mb-2">
                <T k="auto.taskcompletion.notes_de_completion_optionnel" fallback="Notes de completion (optionnel)" />
              </label>
              <Textarea
                id="completion-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes sur la completion de cette tâche..."
                rows={3}
              />
            </div>
            
            <Button
              onClick={handleCompleteTask}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Marquage en cours..." : "Marquer comme terminé"}
            </Button>
          </div>
        )}

        {task.status === 'completed' && task.completion_date && (
          <div className="bg-success-soft p-3 rounded-lg">
            <p className="text-sm text-success">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Tâche terminée le {new Date(task.completion_date).toLocaleDateString('fr-FR')}
            </p>
            {task.notes && (
              <p className="text-sm text-success mt-1">
                <strong><T k="auto.taskcompletion.notes" fallback="Notes:" /></strong> {task.notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCompletion;
