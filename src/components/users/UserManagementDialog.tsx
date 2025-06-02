
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRoleManagement } from '@/hooks/useUserRoles';
import RoleBadge, { RoleType } from '@/components/RoleBadge';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  roles?: string[];
  is_active?: boolean;
}

interface UserManagementDialogProps {
  user?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  mode: 'create' | 'edit';
}

const UserManagementDialog: React.FC<UserManagementDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUpdate,
  mode
}) => {
  const { toast } = useToast();
  const { assignRole, removeRole } = useRoleManagement();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    national_id: user?.national_id || '',
    email: '',
    password: '',
    is_active: user?.is_active ?? true
  });
  const [selectedRole, setSelectedRole] = useState<RoleType>('viewer');

  const availableRoles: RoleType[] = ['admin', 'project_manager', 'supervisor', 'inspector', 'supplier', 'viewer'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'create') {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            full_name: formData.full_name,
            phone: formData.phone,
            national_id: formData.national_id
          }
        });

        if (error) throw error;

        if (data.user) {
          // Assign role to new user
          await assignRole.mutateAsync({
            userId: data.user.id,
            roleName: selectedRole
          });
        }

        toast({
          title: "Utilisateur créé",
          description: "L'utilisateur a été créé avec succès."
        });
      } else {
        // Update existing user profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            national_id: formData.national_id
          })
          .eq('id', user?.id);

        if (error) throw error;

        toast({
          title: "Utilisateur mis à jour",
          description: "Les informations ont été mises à jour avec succès."
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error managing user:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleAssign = async (role: RoleType) => {
    if (!user?.id) return;
    
    try {
      await assignRole.mutateAsync({
        userId: user.id,
        roleName: role
      });
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRoleRemove = async (role: string) => {
    if (!user?.id) return;
    
    try {
      await removeRole.mutateAsync({
        userId: user.id,
        roleName: role
      });
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="national_id">ID National</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
            />
          </div>

          {mode === 'create' && (
            <>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Rôle initial</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>
                        <RoleBadge role={role} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'edit' && user && (
            <div>
              <Label>Rôles actuels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.roles?.map(role => (
                  <div key={role} className="flex items-center gap-2">
                    <RoleBadge role={role as RoleType} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRoleRemove(role)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <Label>Ajouter un rôle</Label>
                <Select onValueChange={(value) => handleRoleAssign(value as RoleType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles
                      .filter(role => !user.roles?.includes(role))
                      .map(role => (
                        <SelectItem key={role} value={role}>
                          <RoleBadge role={role} />
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Compte actif</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'En cours...' : mode === 'create' ? 'Créer' : 'Mettre à jour'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;
