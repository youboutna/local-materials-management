import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineEvent {
  date: string;
  label: string;
  type: 'launch' | 'deadline' | 'evaluation' | 'attribution';
  status: 'completed' | 'active' | 'upcoming';
}

interface TenderTimelineCardProps {
  launchDate?: string;
  deadlineDate?: string;
  evaluationDate?: string;
  attributionDate?: string;
}

export const TenderTimelineCard: React.FC<TenderTimelineCardProps> = ({
  launchDate,
  deadlineDate,
  evaluationDate,
  attributionDate
}) => {
  const events: TimelineEvent[] = [];
  const now = new Date();

  if (launchDate) {
    events.push({
      date: launchDate,
      label: 'Lancement',
      type: 'launch',
      status: isPast(new Date(launchDate)) ? 'completed' : 'upcoming'
    });
  }

  if (deadlineDate) {
    const deadline = new Date(deadlineDate);
    events.push({
      date: deadlineDate,
      label: 'Date limite de soumission',
      type: 'deadline',
      status: isPast(deadline) ? 'completed' : isFuture(deadline) ? 'active' : 'upcoming'
    });
  }

  if (evaluationDate) {
    events.push({
      date: evaluationDate,
      label: 'Évaluation',
      type: 'evaluation',
      status: isPast(new Date(evaluationDate)) ? 'completed' : 'upcoming'
    });
  }

  if (attributionDate) {
    events.push({
      date: attributionDate,
      label: 'Attribution',
      type: 'attribution',
      status: isPast(new Date(attributionDate)) ? 'completed' : 'upcoming'
    });
  }

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'active':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'active':
        return 'bg-amber-100 border-amber-300';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/30">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Chronologie de l'appel d'offres
        </h3>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full border-2 ${getStatusColor(event.status)}`}>
                  {getStatusIcon(event.status)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-0.5 h-12 bg-border my-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{event.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  {event.status === 'active' && (
                    <Badge variant="default" className="gap-1">
                      <Calendar className="h-3 w-3" />
                      {differenceInDays(new Date(event.date), now)} jours restants
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
