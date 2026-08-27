import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, CheckCircle, Circle, AlertCircle, ChevronDown } from 'lucide-react';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { fr } from 'date-fns/locale';
import { T } from '@/components/i18n/T';


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
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'active':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success-soft border-success/30';
      case 'active':
        return 'bg-warning/10 border-warning/30';
      default:
        return 'bg-muted border-muted-foreground/20';
    }
  };

  const activeEvent = events.find((e) => e.status === 'active');
  const remainingDays = activeEvent ? differenceInDays(new Date(activeEvent.date), now) : null;

  if (events.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="bg-gradient-to-br from-background to-muted/30">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 rounded-lg"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4" />
              <T k="auto.tendertimelinecard.chronologie_de_l_appel_d_offres" fallback="Chronologie de l'appel d'offres" />
              <Badge variant="outline" className="text-[10px]">{events.length}</Badge>
            </span>
            <span className="flex items-center gap-2">
              {remainingDays !== null && (
                <Badge variant="default" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {remainingDays} <T k="auto.tendertimelinecard.jours_restants" fallback="jours restants" />
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </span>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-1.5 rounded-full border-2 ${getStatusColor(event.status)}`}>
                      {getStatusIcon(event.status)}
                    </div>
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-6 bg-border my-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{event.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

