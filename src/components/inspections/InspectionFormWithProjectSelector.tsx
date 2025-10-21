import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import EnhancedProjectSelector from '@/components/selectors/EnhancedProjectSelector';
import { InspectorSelector } from '@/components/selectors/InspectorSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InspectionFormData {
  projectId: string;
  tenderReference: string;
  inspector: string;
  date: Date | undefined;
  comments: string;
  progressAtInspection: number;
  status: string;
}

interface InspectionFormWithProjectSelectorProps {
  onSubmit: (data: InspectionFormData) => void;
  initialData?: Partial<InspectionFormData>;
  isLoading?: boolean;
}

const InspectionFormWithProjectSelector: React.FC<InspectionFormWithProjectSelectorProps> = ({
  onSubmit,
  initialData,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [inspectorId, setInspectorId] = useState('');
  const [formData, setFormData] = useState<InspectionFormData>({
    projectId: initialData?.projectId || '',
    tenderReference: initialData?.tenderReference || '',
    inspector: initialData?.inspector || '',
    date: initialData?.date || new Date(),
    comments: initialData?.comments || '',
    progressAtInspection: initialData?.progressAtInspection || 0,
    status: initialData?.status || 'planifiée'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.inspector || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formData);
  };

  const updateFormData = (field: keyof InspectionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle Inspection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EnhancedProjectSelector
            value={formData.projectId}
            onChange={(id) => updateFormData('projectId', id || '')}
            label="Projet"
            placeholder="Sélectionner un projet"
            required={true}
            showTenderReference={true}
            tenderReference={formData.tenderReference}
            onTenderReferenceChange={(ref) => updateFormData('tenderReference', ref)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <InspectorSelector
                projectId={formData.projectId}
                value={inspectorId}
                onValueChange={(id, name) => {
                  setInspectorId(id);
                  updateFormData('inspector', name);
                }}
                label="Inspecteur *"
              />
            </div>

            <div>
              <Label>Date d'inspection *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => updateFormData('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="progress">Progrès observé (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progressAtInspection}
                onChange={(e) => updateFormData('progressAtInspection', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifiée">Planifiée</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="validé">Validée</SelectItem>
                  <SelectItem value="non_conforme">Non conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => updateFormData('comments', e.target.value)}
              placeholder="Observations et commentaires de l'inspection"
              rows={4}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Enregistrement...' : 'Enregistrer l\'inspection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InspectionFormWithProjectSelector;