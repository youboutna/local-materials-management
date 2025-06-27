
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date?: string;
  completion_date?: string;
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

  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({ 
          status: 'completed',
          completion_date: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', task.id);

      if (error) throw error;

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
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
              <p className="text-sm text-gray-600 mt-1">
                Projet: {task.projects.title} - {task.projects.location}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(task.priority)}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
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
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600 text-sm">{task.description}</p>
          </div>
        )}

        {task.due_date && (
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Échéance</h4>
            <p className="text-sm text-gray-600">
              {new Date(task.due_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}

        {task.status !== 'completed' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="completion-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes de completion (optionnel)
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
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Tâche terminée le {new Date(task.completion_date).toLocaleDateString('fr-FR')}
            </p>
            {task.notes && (
              <p className="text-sm text-green-700 mt-1">
                <strong>Notes:</strong> {task.notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCompletion;
