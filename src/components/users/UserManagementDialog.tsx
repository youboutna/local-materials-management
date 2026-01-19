
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUsersHex, useUserCreate, useUserUpdate, useUserToggleStatus } from '@/hooks/hexagonal';
import { useRoleManagement } from '@/hooks/useUserRoles';
import RoleBadge, { RoleType } from '@/components/RoleBadge';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  roles?: string[];
  is_active?: boolean;
  email?: string;
}

interface UserManagementDialogProps {
  user?: UserProfile | null;
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
  const { t } = useLanguage();
  const { createUser } = useUserCreate();
  const { updateUser } = useUserUpdate();
  const { toggleUserStatus } = useUserToggleStatus();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    national_id: user?.national_id || '',
    email: user?.email || '',
    password: '',
    new_password: '',
    confirm_password: '',
    confirmPassword: '',
    is_active: user?.is_active ?? true
  });
  const [selectedRole, setSelectedRole] = useState<RoleType>('viewer');

  const availableRoles: RoleType[] = ['admin', 'project_manager', 'supervisor', 'inspector', 'supplier', 'viewer'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === 'create') {
        if (!formData.email || !formData.password || !formData.full_name) {
          toast({
            title: t('error.title') || 'Erreur',
            description: t('error.missing_fields') || 'Veuillez remplir tous les champs obligatoires',
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        // Create user with hexagonal architecture
        const userData = {
          fullName: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          nationalId: formData.national_id,
          isActive: formData.is_active
        };

        const result = await createUser.mutateAsync(userData);
        
        // Assign role if needed
        if (selectedRole && selectedRole !== 'viewer') {
          await assignRole.mutateAsync({ userId: result.id, role: selectedRole });
        }

        toast({
          title: t('users.created') || 'Utilisateur créé',
          description: t('users.created_success') || 'L\'utilisateur a été créé avec succès'
        });
      } else {
        if (!user?.id) {
          throw new Error(t('error.user_id_required') || 'ID utilisateur requis');
        }

        // Update profile information
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            national_id: formData.national_id
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Note: Email and password updates require admin privileges that aren't available with the anon key
        // These would need to be handled by a server-side function or edge function with service role access
        if (formData.email && formData.email !== user.email) {
          toast({
            title: t('users.info') || 'Information',
            description: 'La mise à jour de l\'email nécessite des privilèges administrateur avancés. Contactez l\'administrateur système.',
            variant: "default"
          });
        }

        if (formData.new_password) {
          toast({
            title: t('users.info') || 'Information',
            description: 'La mise à jour du mot de passe nécessite des privilèges administrateur avancés. Contactez l\'administrateur système.',
            variant: "default"
          });
        }

        toast({
          title: t('users.updated') || 'Utilisateur mis à jour',
          description: t('users.updated_success') || 'L\'utilisateur a été mis à jour avec succès'
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error managing user:', error);
      toast({
        title: t('error.title') || 'Erreur',
        description: error instanceof Error ? error.message : t('error.generic') || 'Une erreur est survenue',
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
      toast({
        title: t('roles.assigned') || 'Rôle assigné',
        description: t('roles.assigned_success')?.replace('{role}', role) || `Le rôle ${role} a été assigné avec succès`
      });
      onUpdate();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: t('error.title') || 'Erreur',
        description: t('roles.assign_error') || 'Erreur lors de l\'assignation du rôle',
        variant: "destructive"
      });
    }
  };

  const handleRoleRemove = async (role: string) => {
    if (!user?.id) return;
    
    try {
      await removeRole.mutateAsync({
        userId: user.id,
        roleName: role
      });
      toast({
        title: t('roles.removed') || 'Rôle retiré',
        description: t('roles.removed_success')?.replace('{role}', role) || `Le rôle ${role} a été retiré avec succès`
      });
      onUpdate();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: t('error.title') || 'Erreur',
        description: t('roles.remove_error') || 'Erreur lors de la suppression du rôle',
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('users.new') || 'Nouvel utilisateur' : t('users.details_title') || 'Détails de l\'utilisateur'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">{t('auth.full_name') || 'Nom complet'} *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">{t('auth.phone') || 'Téléphone'}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+222 XX XX XX XX"
            />
          </div>
          
          <div>
            <Label htmlFor="national_id">{t('auth.national_id') || 'ID National'}</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
              placeholder={t('users.table.national_id') || 'ID National'}
            />
          </div>

          <div>
            <Label htmlFor="email">{t('auth.email') || 'Email'} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required={mode === 'create'}
              placeholder="utilisateur@example.com"
              disabled={mode === 'edit'} // Disable email editing for now
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">
                La modification de l'email nécessite des privilèges avancés
              </p>
            )}
          </div>

          {mode === 'create' && (
            <>
              <div>
                <Label htmlFor="password">{t('auth.password') || 'Mot de passe'} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder={t('auth.password_requirements') || 'Minimum 6 caractères'}
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="role">{t('users.table.role') || 'Rôle'}</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as RoleType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(role => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <RoleBadge role={role} />
                          <span className="text-xs capitalize">{t(`roles.${role}`) || role.replace('_', ' ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {mode === 'edit' && (
            <>
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium">Mise à jour du mot de passe</h4>
                <div>
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Laisser vide pour conserver le mot de passe actuel"
                    minLength={6}
                    disabled // Disable password editing for now
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    La modification du mot de passe nécessite des privilèges avancés
                  </p>
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>{t('users.manage_roles') || 'Gérer les rôles'}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user && user.roles && user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <div key={role} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                          <RoleBadge role={role as RoleType} />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRoleRemove(role)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            title="Supprimer"
                          >
                            ×
                          </Button>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">{t('users.none_found') || 'Aucun rôle trouvé'}</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>{t('users.table.role') || 'Ajouter un rôle'}</Label>
                  <Select onValueChange={(value) => handleRoleAssign(value as RoleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.table.role') || 'Sélectionner un rôle'} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles
                        .filter(role => !user?.roles?.includes(role))
                        .map(role => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <RoleBadge role={role} />
                              <span className="text-xs capitalize">{t(`roles.${role}`) || role.replace('_', ' ')}</span>
                            </div>
                          </SelectItem>
                        ))}
                      {availableRoles.filter(role => !user?.roles?.includes(role)).length === 0 && (
                        <SelectItem value="no-roles" disabled>
                          {t('users.no_results') || 'Aucun rôle disponible'}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="font-medium">
              {t('users.active') || 'Actif'}
            </Label>
            <span className="text-sm text-gray-500 ml-2">
              {formData.is_active ? t('users.active') || 'Actif' : t('users.inactive') || 'Inactif'}
            </span>
          </div>
          
          {/* Admin Password Reset Section */}
          {mode === 'edit' && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700">Réinitialisation du mot de passe</h4>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe (optionnel)</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={formData.newPassword || ''}
                  onChange={(e) => setFormData(prev => ({...prev, newPassword: e.target.value}))}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
                  placeholder="Confirmer le nouveau mot de passe"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('users.cancel') || 'Annuler'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (mode === 'create' && (!formData.email || !formData.password || !formData.full_name))}
            className="min-w-[120px]"
          >
            {loading ? t('auth.button.loading') || 'Chargement...' : mode === 'create' ? t('users.new') || 'Créer' : t('users.save') || 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;
