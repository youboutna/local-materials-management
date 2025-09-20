// components/project/TaskList.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskListProps {
  tasks: any[];
  projectId: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, projectId }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toutes ({tasks.length})
        </Button>
        <Button 
          variant={filter === 'in_progress' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('in_progress')}
        >
          En cours ({tasks.filter(t => t.status === 'in_progress').length})
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Terminées ({tasks.filter(t => t.status === 'completed').length})
        </Button>
        <Button 
          variant={filter === 'not_started' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('not_started')}
        >
          Non débutées ({tasks.filter(t => t.status === 'not_started').length})
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.map((task, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{task.name}</span>
                <Badge className={getStatusColor(task.status)}>
                  {task.status === 'completed' ? 'Terminée' : 
                   task.status === 'in_progress' ? 'En cours' : 
                   task.status === 'delayed' ? 'En retard' : 'Non débutée'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm">{task.description}</p>
                
                <Progress value={task.progress || 0} className="h-2" />
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{task.startDate} → {task.endDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assignedTo?.length || 0} assigné(s)</span>
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
                : `Aucune tâche avec le statut "${filter}"`}
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