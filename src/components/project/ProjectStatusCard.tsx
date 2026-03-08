
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ProjectWithPayments } from '@/types/project';
import { format } from 'date-fns';

export function ProjectStatusCard({ project }: { project: ProjectWithPayments }) {
  const getStatusColor = () => {
    switch (project.status) {
      case 'en cours': return 'bg-blue-500';
      case 'terminé': return 'bg-green-500';
      case 'en attente': return 'bg-amber-500';
      case 'en inspection': return 'bg-yellow-500';
      case 'suspendu': return 'bg-purple-500';
      case 'annulé': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>État du projet</span>
          <Badge className={`${getStatusColor()} text-white`}>
            {project.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
          
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div>
              <p className="text-muted-foreground">Date de début</p>
              <p>{format(new Date(project.startDate), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Date de fin</p>
              <p>{project.endDate ? format(new Date(project.endDate), 'dd/MM/yyyy') : 'N/A'}</p>
            </div>
          </div>
          
          {project.inspections && project.inspections.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Dernière inspection</p>
              <p className="text-sm">
                {format(new Date(project.inspections[0].date), 'dd/MM/yyyy')} -{' '}
                <span className={`${
                  project.inspections[0].status === 'approved' ? 'text-green-600' : 
                  project.inspections[0].status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {project.inspections[0].status === 'approved' ? 'APPROUVÉE' : 
                   project.inspections[0].status === 'rejected' ? 'REJETÉE' : 
                   project.inspections[0].status === 'requires_changes' ? 'CHANGEMENTS REQUIS' : 
                   'EN ATTENTE'}
                </span>
              </p>
            </div>
          )}

          {project.payments && project.payments.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Dernier paiement</p>
              <p className="text-sm font-medium">
                {project.payments[0].amount.toLocaleString()} MRU ({format(new Date(project.payments[0].payment_date), 'dd/MM/yyyy')})
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
