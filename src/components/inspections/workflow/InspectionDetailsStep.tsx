/**
 * InspectionDetailsStep - Étape de configuration des détails de l'inspection
 */

import { InspectionPermissionService } from '@/application/services/InspectionPermissionService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Calendar, CheckCircle2, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/use-auth';

interface InspectionDetailsStepProps {
  projectId: string;
  phaseId?: string;
  stepId?: string;
  inspectionType: string;
  mode: 'request' | 'schedule';
  initialData?: InspectionDetails;
  onComplete: (details: InspectionDetails) => void;
}

export interface InspectionDetails {
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration_hours: number;
  inspector_id?: string;
  inspector_name?: string;
  backup_inspector_id?: string;
  priority: 'low' | 'medium' | 'high';
  requirements?: string;
  proposed_dates?: string[];
}

const InspectionDetailsStep: React.FC<InspectionDetailsStepProps> = ({
  projectId,
  phaseId,
  stepId,
  inspectionType,
  mode,
  initialData,
  onComplete,
}) => {
  const [details, setDetails] = useState<InspectionDetails>({
    scheduled_date: initialData?.scheduled_date || '',
    scheduled_time: initialData?.scheduled_time || '09:00',
    estimated_duration_hours: initialData?.estimated_duration_hours || 2,
    inspector_id: initialData?.inspector_id || '',
    inspector_name: initialData?.inspector_name || '',
    priority: initialData?.priority || 'medium',
    requirements: initialData?.requirements || '',
    proposed_dates: initialData?.proposed_dates || [],
  });

  const [alternateDate1, setAlternateDate1] = useState('');
  const [alternateDate2, setAlternateDate2] = useState('');
  const [availabilityWarning, setAvailabilityWarning] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch assignable inspectors
  const { data: inspectors = [] } = useQuery({
    queryKey: ['assignable-inspectors', projectId, phaseId, user?.id],
    queryFn: async () => {
      const repository = RepositoryFactory.getInspectionPermissionRepository();
      const service = new InspectionPermissionService(repository);

      const userId = user?.id || '';

      return service.getAssignableInspectors({ 
        context: {
          userId,
          projectId,
          phaseId,
          inspectionType
        }
      });
    },
    enabled: mode === 'schedule' && !!user?.id,
  });

  // Auto-select default inspector
  useEffect(() => {
    if (mode === 'schedule' && inspectors.length > 0 && !details.inspector_id) {
      const defaultInspector = inspectors.find(i => i.isDefault);
      if (defaultInspector) {
        setDetails(prev => ({
          ...prev,
          inspector_id: defaultInspector.id,
          inspector_name: defaultInspector.name,
        }));
      }
    }
  }, [inspectors, mode, details.inspector_id]);

  const handleInspectorChange = (inspectorId: string) => {
    const inspector = inspectors.find(i => i.id === inspectorId);
    setDetails(prev => ({
      ...prev,
      inspector_id: inspectorId,
      inspector_name: inspector?.name || '',
    }));
  };

  const handleContinue = () => {
    // Collect proposed dates for request mode
    if (mode === 'request') {
      const proposedDates = [details.scheduled_date, alternateDate1, alternateDate2].filter(Boolean);
      onComplete({ ...details, proposed_dates: proposedDates });
    } else {
      onComplete(details);
    }
  };

  const isValid = mode === 'request' 
    ? !!details.scheduled_date
    : !!details.scheduled_date && !!details.inspector_id;

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum tomorrow
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">
          {mode === 'request' ? 'Proposez des dates' : 'Planifiez l\'inspection'}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'request' 
            ? 'Proposez jusqu\'à 3 dates possibles pour l\'inspection'
            : 'Définissez la date, l\'heure et l\'inspecteur'}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Date & Time Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date et Heure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date principale *</Label>
                <Input
                  type="date"
                  value={details.scheduled_date}
                  onChange={(e) => setDetails(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  min={getMinDate()}
                />
              </div>

              {mode === 'schedule' && (
                <>
                  <div className="space-y-2">
                    <Label>Heure</Label>
                    <Input
                      type="time"
                      value={details.scheduled_time}
                      onChange={(e) => setDetails(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Durée (heures)</Label>
                    <Select 
                      value={details.estimated_duration_hours.toString()} 
                      onValueChange={(v) => setDetails(prev => ({ ...prev, estimated_duration_hours: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8].map(h => (
                          <SelectItem key={h} value={h.toString()}>{h} heure{h > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {mode === 'request' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date alternative 1</Label>
                  <Input
                    type="date"
                    value={alternateDate1}
                    onChange={(e) => setAlternateDate1(e.target.value)}
                    min={getMinDate()}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date alternative 2</Label>
                  <Input
                    type="date"
                    value={alternateDate2}
                    onChange={(e) => setAlternateDate2(e.target.value)}
                    min={getMinDate()}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspector Selection - Only for schedule mode */}
        {mode === 'schedule' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inspecteur principal *</Label>
                  <Select value={details.inspector_id || ''} onValueChange={handleInspectorChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un inspecteur..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map(inspector => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          <div className="flex items-center gap-2">
                            <span>{inspector.name}</span>
                            {inspector.isEngineeringConsultant && (
                              <Badge variant="outline" className="text-xs">Ing. Conseil</Badge>
                            )}
                            {inspector.isTechnicalManager && (
                              <Badge variant="outline" className="text-xs">Resp. Tech.</Badge>
                            )}
                            {inspector.isDefault && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availabilityWarning && (
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-xs">{availabilityWarning}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Inspecteur suppléant</Label>
                  <Select 
                    value={details.backup_inspector_id || 'none'} 
                    onValueChange={(v) => setDetails(prev => ({ ...prev, backup_inspector_id: v === 'none' ? undefined : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optionnel..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {inspectors
                        .filter(i => i.id !== details.inspector_id)
                        .map(inspector => (
                          <SelectItem key={inspector.id} value={inspector.id}>
                            {inspector.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Priority & Requirements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Priorité et Exigences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select 
                value={details.priority} 
                onValueChange={(v) => setDetails(prev => ({ ...prev, priority: v as 'low' | 'medium' | 'high' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Basse</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Exigences particulières</Label>
              <Textarea
                placeholder="Décrivez les points particuliers à vérifier, les zones à inspecter..."
                value={details.requirements || ''}
                onChange={(e) => setDetails(prev => ({ ...prev, requirements: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!isValid}>
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default InspectionDetailsStep;
