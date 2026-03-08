
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronDown, ChevronUp, Percent, ClipboardCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ProjectWithPayments } from '@/dtos/entities/ProjectDTO';
import { InspectionStatus } from '@/dtos/entities/InspectionDTO';

interface InspectionReportCardProps {
  project: ProjectWithPayments;
}

export function InspectionReportCard({ project }: InspectionReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!project.inspections || project.inspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rapports d'inspection</CardTitle>
          <CardDescription>
            Aucune inspection n'a été réalisée pour ce projet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Sort inspections by date (newest first)
  const sortedInspections = [...project.inspections].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const latestInspection = sortedInspections[0];
  
  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'requires_changes': return 'bg-amber-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusText = (status: InspectionStatus) => {
    switch (status) {
      case 'approved': return 'APPROUVÉE';
      case 'requires_changes': return 'MODIFICATIONS REQUISES';
      case 'rejected': return 'REJETÉE';
      default: return status.toUpperCase();
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-adrar-600" />
            Rapports d'inspection
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          {sortedInspections.length} inspection{sortedInspections.length > 1 ? 's' : ''} réalisée{sortedInspections.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground">
                Dernière inspection
              </div>
              <div className="font-medium">
                {format(new Date(latestInspection.date), 'dd/MM/yyyy')}
              </div>
            </div>
            <Badge className={`${getStatusColor(latestInspection.status as InspectionStatus)} text-white`}>
              {getStatusText(latestInspection.status as InspectionStatus)}
            </Badge>
          </div>
          
          <div className="flex items-center mt-2 gap-2">
            <Percent className="h-4 w-4 text-adrar-600" />
            <div className="text-sm font-medium">Progression au moment de l'inspection: {latestInspection.progress_at_inspection}%</div>
          </div>
          
          <Progress value={latestInspection.progress_at_inspection} className="h-2 mt-1" />
          
          {latestInspection.comments && (
            <div className="mt-2 bg-gray-50 p-3 rounded-md border text-sm">
              <div className="font-medium mb-1">Commentaires:</div>
              <p>{latestInspection.comments}</p>
            </div>
          )}
          
          {expanded && sortedInspections.length > 1 && (
            <>
              <div className="border-t my-4"></div>
              <div className="space-y-4">
                <div className="font-medium">Historique des inspections</div>
                {sortedInspections.slice(1).map((inspection, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md border">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{format(new Date(inspection.date), 'dd/MM/yyyy')}</div>
                      <Badge className={`${getStatusColor(inspection.status as InspectionStatus)} text-white`}>
                        {getStatusText(inspection.status as InspectionStatus)}
                      </Badge>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                      <ClipboardCheck className="h-4 w-4 mr-1 text-adrar-600" />
                      Progression: {inspection.progress_at_inspection}%
                    </div>
                    {inspection.comments && (
                      <div className="mt-2 text-sm">
                        <div>Commentaires:</div>
                        <p className="text-gray-700">{inspection.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          
          {latestInspection.status === 'requires_changes' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mt-3">
              <div className="font-medium text-amber-800">Actions requises</div>
              <p className="text-sm text-amber-700 mt-1">
                Des modifications ont été demandées suite à l'inspection. 
                Veuillez apporter les corrections nécessaires avant de demander une nouvelle inspection.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
