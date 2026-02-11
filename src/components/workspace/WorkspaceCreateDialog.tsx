
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Location, OperationalStatus, MAURITANIA_REGIONS } from '@/dtos/entities/ProjectDTO';
import { useQueryClient } from '@tanstack/react-query';

interface WorkspaceCreateDialogProps {
  selectedRegion?: string;
  onWorkspaceCreated?: (workspaceId: string) => void;
}

const WorkspaceCreateDialog: React.FC<WorkspaceCreateDialogProps> = ({
  selectedRegion,
  onWorkspaceCreated
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: selectedRegion ? MAURITANIA_REGIONS.find(r => r.code === selectedRegion)?.name || '' : '',
    contactManager: '',
    contactPhone: '',
    status: OperationalStatus.active
  });

  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: formData.name,
          location: formData.location,
          contact_manager: formData.contactManager,
          contact_phone: formData.contactPhone,
          status: formData.status,
          facilities: []
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Espace de travail créé",
        description: `L'espace de travail "${formData.name}" a été créé avec succès.`,
      });

      // Refresh workspaces query
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });

      // Notify parent component
      if (onWorkspaceCreated && data) {
        onWorkspaceCreated(data.id);
      }

      setOpen(false);
      setFormData({
        name: '',
        location: selectedRegion ? MAURITANIA_REGIONS.find(r => r.code === selectedRegion)?.name || '' : '',
        contactManager: '',
        contactPhone: '',
        status: OperationalStatus.active
      });
    } catch (error) {
      console.error('Error creating workspace:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'espace de travail. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un espace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel espace de travail</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'espace de travail</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Entrepôt Nouakchott"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localisation</Label>
            <Select
              value={formData.location}
              onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {MAURITANIA_REGIONS.map(region => (
                  <SelectItem key={region.code} value={region.name}>
                    {region.name} ({region.nameAr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactManager">Responsable (optionnel)</Label>
            <Input
              id="contactManager"
              value={formData.contactManager}
              onChange={(e) => setFormData(prev => ({ ...prev, contactManager: e.target.value }))}
              placeholder="Nom du responsable"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Téléphone (optionnel)</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="Ex: +222 12 34 56 78"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: OperationalStatus) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OperationalStatus.active}>Actif</SelectItem>
                <SelectItem value={OperationalStatus.inactive}>Inactif</SelectItem>
                <SelectItem value={OperationalStatus.closed}>Fermé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WorkspaceCreateDialog;
