import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInspectionsHex } from '@/hooks/hexagonal';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout';

const InspectionCreate: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { createInspection, isCreating } = useInspectionsHex();

  const initialProject = searchParams.get('project') || '';
  const initialPhase = searchParams.get('phase') || '';

  const [form, setForm] = useState({
    projectId: initialProject,
    phaseId: initialPhase,
    inspector: '',
    date: new Date().toISOString().split('T')[0],
    status: 'scheduled',
    progressAtInspection: 0,
    comments: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.inspector || !form.date) {
      toast({
        title: t('inspection.common.error') || 'Erreur',
        description:
          t('inspection.common.required_fields') ||
          'Les champs projet, inspecteur et date sont requis.',
        variant: 'destructive',
      });
      return;
    }

    createInspection({
      projectId: form.projectId,
      inspector: form.inspector,
      date: form.date,
      comments: form.comments || undefined,
      phaseId: form.phaseId || undefined,
    });

    // navigate back to scoped list once the mutation kicks off
    const sp = new URLSearchParams();
    if (form.projectId) sp.set('project', form.projectId);
    if (form.phaseId) sp.set('phase', form.phaseId);
    navigate(`/inspection-monitoring${sp.toString() ? `?${sp.toString()}` : ''}`);
  };

  return (
    <AppLayout pageTitle="Nouvelle inspection">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Créer une inspection</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Projet *</Label>
                  <ProjectSelector
                    value={form.projectId}
                    onChange={(value) =>
                      setForm((p) => ({ ...p, projectId: value || '' }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phase">Phase</Label>
                  <Input
                    id="phase"
                    value={form.phaseId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phaseId: e.target.value }))
                    }
                    placeholder="UUID de la phase (optionnel)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inspector">Inspecteur *</Label>
                  <Input
                    id="inspector"
                    value={form.inspector}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, inspector: e.target.value }))
                    }
                    required
                    placeholder="Nom de l'inspecteur"
                  />
                </div>
                <div>
                  <Label htmlFor="date">Date prévue *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((p) => ({ ...p, status: value }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Planifiée</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="progress">Avancement attendu (%)</Label>
                  <Input
                    id="progress"
                    type="number"
                    min={0}
                    max={100}
                    value={form.progressAtInspection}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        progressAtInspection: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="comments">Commentaires</Label>
                <Textarea
                  id="comments"
                  value={form.comments}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, comments: e.target.value }))
                  }
                  rows={4}
                  placeholder="Observations, instructions, points de contrôle…"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isCreating}>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Création…' : 'Créer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default InspectionCreate;
