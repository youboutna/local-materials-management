/**
 * InspectionDialog - Create new inspections
 * MIGRATED TO HEXAGONAL ARCHITECTURE
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clipboard } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCreateInspectionHex, useUpdateProjectStatusHex } from '@/hooks/hexagonal';
import { ProjectWithPayments, InspectionStatus } from '@/types/project';
import { useLanguage } from '@/contexts/LanguageContext';
import { InspectorSelector } from '@/components/selectors/InspectorSelector';

interface InspectionDialogProps {
  project: ProjectWithPayments;
  onInspectionCreated?: () => void;
}

export function InspectionDialog({ project, onInspectionCreated }: InspectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [inspectorId, setInspectorId] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [status, setStatus] = useState<InspectionStatus>('pending');
  const [comments, setComments] = useState('');
  const [progress, setProgress] = useState(project.progress);
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Hexagonal hooks
  const createInspectionMutation = useCreateInspectionHex();
  const updateProjectStatusMutation = useUpdateProjectStatusHex();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inspectorId || !inspectorName) {
      toast({
        title: t("inspection.dialog.validation_error"),
        description: t("inspection.dialog.validation_inspector"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createInspectionMutation.mutateAsync({
        project_id: project.id,
        date: format(date, 'yyyy-MM-dd'),
        status,
        inspector: inspectorName,
        progress_at_inspection: progress,
        comments: comments || null,
      });

      // Update project status if needed
      if (status === 'approved' && project.status !== 'terminé') {
        await updateProjectStatusMutation.mutateAsync({
          projectId: project.id,
          status: 'en inspection'
        });
      }

      toast({
        title: t("inspection.dialog.created"),
        description: t("inspection.dialog.created_description"),
      });

      setIsOpen(false);
      
      // Reset form
      setInspectorId('');
      setInspectorName('');
      setStatus('pending');
      setComments('');
      setProgress(project.progress);
      
      // Call the callback if provided
      if (onInspectionCreated) {
        onInspectionCreated();
      }
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      toast({
        title: t("inspection.dialog.error"),
        description: t("inspection.dialog.error_description"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Clipboard className="h-4 w-4" />
          {t("inspection.dialog.new_inspection")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("inspection.dialog.title")}</DialogTitle>
          <DialogDescription>
            {t("inspection.dialog.description").replace('{project}', project.title)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="date" className="col-span-4 mb-1">
                {t("inspection.dialog.date")}
              </Label>
              <div className="col-span-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : t("inspection.dialog.select_date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <InspectorSelector
                projectId={project.id}
                value={inspectorId}
                onValueChange={(id, name) => {
                  setInspectorId(id);
                  setInspectorName(name);
                }}
                label={t("inspection.dialog.inspector")}
                placeholder={t("inspection.dialog.inspector_placeholder")}
                className="col-span-4"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="status" className="col-span-4 mb-1">
                {t("inspection.dialog.status")}
              </Label>
              <Select
                value={status}
                onValueChange={(value: InspectionStatus) => setStatus(value)}
              >
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder={t("inspection.dialog.select_status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("inspection.dialog.status_pending")}</SelectItem>
                  <SelectItem value="approved">{t("inspection.dialog.status_approved")}</SelectItem>
                  <SelectItem value="requires_changes">{t("inspection.dialog.status_requires_changes")}</SelectItem>
                  <SelectItem value="rejected">{t("inspection.dialog.status_rejected")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="progress" className="col-span-4 mb-1">
                {t("inspection.dialog.progress")}
              </Label>
              <div className="col-span-4 flex items-center gap-2">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="comments" className="col-span-4 mb-1">
                {t("inspection.dialog.comments")}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="col-span-4"
                placeholder={t("inspection.dialog.comments_placeholder")}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              {t("inspection.dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("inspection.dialog.creating") : t("inspection.dialog.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
