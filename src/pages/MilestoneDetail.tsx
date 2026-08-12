import { AppLayout } from '@/components/layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMilestonesHex } from '@/hooks/hexagonal/useMilestonesHex';
import { entityToasts } from '@/hooks/projects/projectToasts';
import { ArrowLeft, Calendar, ExternalLink, Flag, Pencil, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const milestoneToasts = entityToasts('jalon');

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value ?? '—'}</p>
  </div>
);

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  in_progress: 'secondary',
  pending: 'outline',
  delayed: 'destructive',
};

const MilestoneDetail: React.FC = () => {
  const { projectId, milestoneId } = useParams<{ projectId: string; milestoneId: string }>();
  const navigate = useNavigate();
  const { milestones, loading, error, toggleMilestoneStatus, updateMilestone, deleteMilestone } =
    useMilestonesHex(projectId);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    targetDate: '',
    weight: '',
    notes: '',
  });

  const milestone = milestones.find((m) => m.id === milestoneId);

  const openEditDialog = () => {
    if (!milestone) return;
    setForm({
      title: milestone.title || '',
      description: milestone.description || '',
      targetDate: milestone.targetDate ? milestone.targetDate.slice(0, 10) : '',
      weight: String(milestone.weight ?? 0.1),
      notes: milestone.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!milestone) return;
    setIsSaving(true);
    try {
      const ok = await updateMilestone(milestone.id, {
        title: form.title,
        description: form.description || undefined,
        targetDate: form.targetDate || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        notes: form.notes || undefined,
      });
      if (ok) {
        milestoneToasts.updateSuccess(form.title);
        setIsEditOpen(false);
      } else {
        milestoneToasts.updateError();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!milestone) return;
    setIsDeleting(true);
    try {
      const ok = await deleteMilestone(milestone.id);
      if (ok) {
        milestoneToasts.deleteSuccess();
        navigate(projectId ? `/projects/${projectId}` : -1 as unknown as string);
      } else {
        milestoneToasts.deleteError();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout pageTitle="🚩 Détail du jalon">
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(-1)} aria-label="Revenir à la page précédente">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" /> Retour
        </Button>

        {loading && <Skeleton className="h-64 w-full" />}

        {error && (
          <Card>
            <CardContent className="p-6 text-destructive">Erreur : {error}</CardContent>
          </Card>
        )}

        {!loading && !milestone && !error && (
          <Card>
            <CardContent className="p-6">
              Aucun jalon trouvé pour l'identifiant <code>{milestoneId}</code>.
            </CardContent>
          </Card>
        )}

        {milestone && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                <div>
                  <CardTitle>{milestone.title}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{milestone.id}</p>
                </div>
              </div>
              <Badge variant={statusVariant[milestone.status] || 'outline'}>{milestone.status}</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Description" value={milestone.description} />
              <Field
                label="Date cible"
                value={milestone.targetDate ? <span><Calendar className="inline h-3 w-3 mr-1" />{new Date(milestone.targetDate).toLocaleDateString('fr-FR')}</span> : null}
              />
              <Field
                label="Date de complétion"
                value={milestone.completionDate ? new Date(milestone.completionDate).toLocaleDateString('fr-FR') : null}
              />
              <Field label="Poids" value={`${(milestone.weight * 100).toFixed(0)} %`} />
              <Field label="Notes" value={milestone.notes} />

              <div className="md:col-span-2 flex flex-wrap gap-2 pt-2">
                {milestone.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${milestone.projectId}`}>
                      Projet <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {milestone.phaseId && milestone.projectId && (
                  <Button variant="outline" asChild>
                    <Link to={`/projects/${milestone.projectId}/phases/${milestone.phaseId}`}>
                      Phase <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={isTogglingStatus}
                  aria-busy={isTogglingStatus}
                  onClick={async () => {
                    setIsTogglingStatus(true);
                    try {
                      const ok = await toggleMilestoneStatus(milestone.id, milestone.status);
                      ok ? milestoneToasts.updateSuccess(milestone.title) : milestoneToasts.updateError();
                    } finally {
                      setIsTogglingStatus(false);
                    }
                  }}
                >
                  {isTogglingStatus
                    ? 'Mise à jour…'
                    : milestone.status === 'completed' ? 'Rouvrir' : 'Marquer terminé'}
                </Button>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={openEditDialog} aria-label="Modifier le jalon">
                      <Pencil className="h-4 w-4 mr-1" /> Modifier
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier le jalon</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="milestone-title">Titre</Label>
                        <Input
                          id="milestone-title"
                          value={form.title}
                          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-description">Description</Label>
                        <Textarea
                          id="milestone-description"
                          value={form.description}
                          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-target-date">Date cible</Label>
                        <Input
                          id="milestone-target-date"
                          type="date"
                          value={form.targetDate}
                          onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-weight">Poids (0 à 1)</Label>
                        <Input
                          id="milestone-weight"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={form.weight}
                          onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-notes">Notes</Label>
                        <Textarea
                          id="milestone-notes"
                          value={form.notes}
                          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                        Annuler
                      </Button>
                      <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting} aria-label="Supprimer le jalon">
                      <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer ce jalon ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le jalon « {milestone.title} » sera définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Suppression…' : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default MilestoneDetail;
