import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Milestone, useMilestonesHex, usePhaseInspectionsListHex } from "@/hooks/hexagonal";
import { usePhasePayments } from "@/hooks/hexagonal/usePhasePaymentsHex";
import { toast } from "@/hooks/use-toast";
import { CalendarDays, CheckCircle, Clock, Plus, Sparkles, Target } from "lucide-react";
import React, { useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { ElectricSpinner } from "../loading-page";
import { getDefaultPhaseMilestones } from "@/config/referentials/milestones.referential";

import { TranslatedStatus } from '@/components/i18n/TranslatedBadges';
interface PhaseMilestonesProps {
  phaseId: string;
  projectId: string;
}

const PhaseMilestones: React.FC<PhaseMilestonesProps> = ({
  phaseId,
  projectId,
}) => {
  const { t } = useLanguage();
  const {
    milestones,
    loading,
    progress,
    createMilestone,
    updateMilestone,
    toggleMilestoneStatus,
  } = useMilestonesHex(projectId, phaseId);

  // Phase-context enrichment: link sibling inspections + payments for visibility
  const { data: phaseInspections = [] } = usePhaseInspectionsListHex(phaseId);
  const phasePaymentsQuery = usePhasePayments(phaseId);
  const phasePayments = phasePaymentsQuery.data || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [generating, setGenerating] = useState(false);

  /**
   * Génère les jalons de la phase depuis le référentiel (milestones.referential.ts)
   * lorsque la phase n'en possède aucun — proposé dans les workflows de création/édition.
   */
  const handleGenerateFromReferential = async () => {
    setGenerating(true);
    try {
      const templates = getDefaultPhaseMilestones();
      const base = Date.now();
      for (const tpl of templates) {
        const target = new Date(base + (tpl.relativeOffsetDays ?? 0) * 86400000);
        await createMilestone({
          projectId,
          phaseId,
          title: tpl.name,
          description: tpl.description,
          targetDate: target.toISOString(),
          weight: tpl.weight ?? 0.1,
          status: 'pending',
        });
      }
      toast({
        title: t('milestone.generated'),
        description: t('milestone.generated_count', { count: templates.length }),
      });
    } catch (error) {
      console.error('Error generating milestones:', error);
      toast({
        title: t('common.error'),
        description: t('milestone.generate_error'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_date: "",
    weight: 0.1,
    notes: "",
  });

  const handleSave = async () => {
    try {
      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, {
          title: formData.title,
          description: formData.description,
          targetDate: formData.target_date,
          weight: formData.weight,
          notes: formData.notes,
        });
        toast({ title: t("common.success"), description: t("milestone.updated") });
      } else {
        await createMilestone({
          projectId,
          phaseId,
          title: formData.title,
          description: formData.description,
          targetDate: formData.target_date,
          weight: formData.weight,
          notes: formData.notes,
          status: 'pending',
        });
        toast({ title: t("common.success"), description: t("milestone.added") });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving milestone:", error);
      toast({
        title: t("common.error"),
        description: t("common.save_error"),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description || "",
      target_date: milestone.targetDate,
      weight: milestone.weight,
      notes: milestone.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleMarkCompleted = async (milestone: Milestone) => {
    try {
      await toggleMilestoneStatus(milestone.id, milestone.status);
      toast({
        title: t("common.success"),
        description:
          milestone.status === "completed"
            ? t("milestone.marked_pending")
            : t("milestone.marked_completed"),
      });
    } catch (error) {
      console.error("Error updating milestone status:", error);
      toast({
        title: t("common.error"),
        description: t("common.status_update_error"),
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      title: "",
      description: "",
      target_date: "",
      weight: 0.1,
      notes: "",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-primary" />;
      case "delayed":
        return <Clock className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-soft text-success";
      case "in_progress":
        return "bg-primary/10 text-primary";
      case "delayed":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-warning/10 text-warning";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ElectricSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          {t('milestone.phase_title')}
          {milestones.length > 0 && (
            <Badge variant="outline">
              {t('milestone.progress_completed', { value: Math.round(progress) })}
            </Badge>
          )}
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              {t('common.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMilestone ? t("milestone.edit_title") : t("milestone.add_title")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">{t('common.title')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t('milestone.title_placeholder')}
                />
              </div>
              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t('milestone.description_placeholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_date">{t('milestone.target_date')}</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) =>
                      setFormData({ ...formData, target_date: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="weight">{t('milestone.weight')}</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">{t('common.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder={t('milestone.notes_placeholder')}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave}>
                  {editingMilestone ? t("common.edit") : t("common.add")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {/* Contexte de phase : éléments liés au même phaseId */}
        {(phaseInspections.length > 0 || phasePayments.length > 0) && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">{t('milestone.phase_inspections')}</p>
              <p className="text-lg font-semibold">
                {phaseInspections.filter((i: any) => i.status === 'completed' || i.status === 'approved').length}
                <span className="text-sm text-muted-foreground"> / {phaseInspections.length}</span>
              </p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">{t('milestone.linked_payments')}</p>
              <p className="text-lg font-semibold">
                {phasePayments.filter((p: any) => p.status === 'paid' || p.status === 'approved').length}
                <span className="text-sm text-muted-foreground"> / {phasePayments.length}</span>
              </p>
            </div>
          </div>
        )}
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t('milestone.none_hint')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateFromReferential}
              disabled={generating}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? t('phase_structure.generating') : t('phase_structure.generate_milestones_from_referential')}
            </Button>
          </div>
        ) : (

          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="border rounded-lg p-4 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(milestone.status)}
                      <h4 className="font-medium">{milestone.title}</h4>
                      <Badge className={getStatusColor(milestone.status)}>
                        <TranslatedStatus code={milestone.status} />
                      </Badge>
                      <Badge variant="outline">{t('milestone.weight_value', { value: milestone.weight })}</Badge>
                    </div>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {t('milestone.target')}{' '}
                        {new Date(milestone.targetDate).toLocaleDateString()}
                      </div>
                      {milestone.completionDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                           {t('milestone.completed_on')}{' '}
                          {new Date(
                            milestone.completionDate
                          ).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkCompleted(milestone)}
                    >
                      {milestone.status === "completed"
                        ? t("milestone.mark_pending")
                        : t("milestone.mark_completed")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(milestone)}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
                {milestone.notes && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t('common.notes')}: {milestone.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhaseMilestones;
