
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clipboard, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProjectWithPayments, InspectionStatus } from '@/types/project';

interface InspectionDialogProps {
  project: ProjectWithPayments;
  onInspectionCreated?: () => void;
}

export function InspectionDialog({ project, onInspectionCreated }: InspectionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [inspector, setInspector] = useState('');
  const [status, setStatus] = useState<InspectionStatus>('pending');
  const [comments, setComments] = useState('');
  const [progress, setProgress] = useState(project.progress);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inspector) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir le nom de l'inspecteur.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          project_id: project.id,
          date: format(date, 'yyyy-MM-dd'),
          status,
          inspector,
          progress_at_inspection: progress,
          comments: comments || null,
        } as any)
        .select();

      if (error) throw error;

      // Update project status if needed
      if (status === 'approved' && project.status !== 'terminé') {
        await supabase
          .from('projects')
          .update({ status: 'en inspection' } as any)
          .eq('id', project.id as any);
      }

      toast({
        title: "Inspection créée",
        description: `L'inspection a été enregistrée avec succès.`,
      });

      setIsOpen(false);
      
      // Reset form
      setInspector('');
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
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'inspection.",
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
          Nouvelle Inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle inspection</DialogTitle>
          <DialogDescription>
            Enregistrez les détails de l'inspection pour le projet "{project.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="date" className="col-span-4 mb-1">
                Date d'inspection
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
                      {date ? format(date, "dd/MM/yyyy") : "Sélectionner une date"}
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
              <Label htmlFor="inspector" className="col-span-4 mb-1">
                Inspecteur
              </Label>
              <Input
                id="inspector"
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                className="col-span-4"
                placeholder="Nom de l'inspecteur"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="status" className="col-span-4 mb-1">
                Statut
              </Label>
              <Select
                value={status}
                onValueChange={(value: InspectionStatus) => setStatus(value)}
              >
                <SelectTrigger className="col-span-4">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="requires_changes">Modifications requises</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-2">
              <Label htmlFor="progress" className="col-span-4 mb-1">
                Progression du projet (%)
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
                Commentaires
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="col-span-4"
                placeholder="Ajoutez des commentaires sur l'inspection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création..." : "Créer l'inspection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
