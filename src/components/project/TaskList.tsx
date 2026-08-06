// components/project/TaskList.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { TaskAssignmentDTO } from '@/dtos/entities/TaskAssignmentDTO';
import { TaskStatus } from '@/dtos/entities/TaskAssignmentDTO';

interface TaskListProps {
  tasks: TaskAssignmentDTO[];
  projectId: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, projectId }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'pending' | 'blocked'>('all');

  // Memoized task counts to avoid repeated filtering
  const taskCounts = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let pending = 0;
    let blocked = 0;

    tasks.forEach(task => {
      switch (task.status) {
        case TaskStatus.IN_PROGRESS:
          inProgress++;
          break;
        case TaskStatus.COMPLETED:
          completed++;
          break;
        case TaskStatus.PENDING:
          pending++;
          break;
        case TaskStatus.BLOCKED:
          blocked++;
          break;
        default:
          pending++;
      }
    });

    return {
      total: tasks.length,
      inProgress,
      completed,
      pending,
      blocked
    };
  }, [tasks]);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case TaskStatus.BLOCKED: return 'bg-red-100 text-red-800 border-red-200';
      case TaskStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED: return 'Terminée';
      case TaskStatus.IN_PROGRESS: return 'En cours';
      case TaskStatus.BLOCKED: return 'Bloquée';
      case TaskStatus.PENDING: return 'En attente';
      case TaskStatus.CANCELLED: return 'Annulée';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tâches du projet</h3>
        <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({taskCounts.total})
        </Button>
        <Button 
          variant={filter === TaskStatus.IN_PROGRESS ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter(TaskStatus.IN_PROGRESS)}
        >
          En cours ({taskCounts.inProgress})
        </Button>
        <Button 
          variant={filter === TaskStatus.COMPLETED ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter(TaskStatus.COMPLETED)}
        >
          Terminées ({taskCounts.completed})
        </Button>
        <Button 
          variant={filter === TaskStatus.PENDING ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter(TaskStatus.PENDING)}
        >
          En attente ({taskCounts.pending})
        </Button>
        <Button 
          variant={filter === TaskStatus.BLOCKED ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter(TaskStatus.BLOCKED)}
        >
          Bloquées ({taskCounts.blocked})
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{task.title || task.name}</span>
                <Badge className={getStatusColor(task.status)}>
                  {getStatusLabel(task.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{task.description || 'Aucune description'}</p>
                
                <Progress value={task.progress || 0} className="h-2" />
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {task.startDate ? `${task.startDate} → ` : ''}
                      {task.dueDate || task.endDate || 'Date non définie'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assigneeName || task.assigneeId || 'Non assigné(e)'}</span>
                  </div>
                </div>

                {task.dependencies && Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Dépendances:</h4>
                    <div className="flex gap-1 flex-wrap">
                      {task.dependencies.map((depId: string, depIndex: number) => (
                        <Badge key={depIndex} variant="outline" className="text-xs">
                          Tâche #{typeof depId === 'string' ? depId.slice(-4) : depIndex}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {task.priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Priorité:</span>
                    <Badge variant={
                      task.priority === 'CRITICAL' ? 'destructive' :
                      task.priority === 'HIGH' ? 'default' :
                      task.priority === 'MEDIUM' ? 'secondary' : 'outline'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground text-center mb-4">
              {filter === 'all' 
                ? 'Aucune tâche créée pour ce projet' 
                : `Aucune tâche avec le statut "${getStatusLabel(filter)}"`}
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/tasks/new`)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;