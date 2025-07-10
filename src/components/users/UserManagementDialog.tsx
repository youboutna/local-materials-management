
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
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  national_id: string | null;
  avatar_url: string | null;
  roles?: string[];
  is_active?: boolean;
  email?: string; // Add email to the interface
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    national_id: user?.national_id || '',
    email: user?.email || '',
    password: '',
    new_password: '', // For password updates
    confirm_password: '', // For password confirmation
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
            title: t('error.title'),
            description: t('error.missing_fields'),
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

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
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: formData.full_name,
              phone: formData.phone,
              national_id: formData.national_id
            });

          if (profileError) {
            console.warn('Profile update warning:', profileError);
          }

          try {
            await assignRole.mutateAsync({
              userId: data.user.id,
              roleName: selectedRole
            });
          } catch (roleError) {
            console.warn('Role assignment warning:', roleError);
          }
        }

        toast({
          title: t('users.created'),
          description: t('users.created_success')
        });
      } else {
        if (!user?.id) {
          throw new Error(t('error.user_id_required'));
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

        // Update email if changed
        if (formData.email && formData.email !== user.email) {
          const { error: emailError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email: formData.email }
          );
          if (emailError) {
            console.warn('Email update warning:', emailError);
            toast({
              title: t('error.title'),
              description: `Email update failed: ${emailError.message}`,
              variant: "destructive"
            });
          } else {
            toast({
              title: t('users.updated'),
              description: 'Email updated successfully'
            });
          }
        }

        // Update password if provided
        if (formData.new_password) {
          if (formData.new_password !== formData.confirm_password) {
            toast({
              title: t('error.title'),
              description: 'Passwords do not match',
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          if (formData.new_password.length < 6) {
            toast({
              title: t('error.title'),
              description: 'Password must be at least 6 characters',
              variant: "destructive"
            });
            setLoading(false);
            return;
          }

          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: formData.new_password }
          );

          if (passwordError) {
            console.warn('Password update warning:', passwordError);
            toast({
              title: t('error.title'),
              description: `Password update failed: ${passwordError.message}`,
              variant: "destructive"
            });
          } else {
            toast({
              title: t('users.updated'),
              description: 'Password updated successfully'
            });
          }
        }

        // Update user status
        if (formData.is_active !== user.is_active) {
          try {
            if (formData.is_active) {
              const { error: authError } = await supabase.auth.admin.updateUserById(
                user.id,
                { ban_duration: 'none' }
              );
              if (authError) console.warn('Auth activation warning:', authError);
            } else {
              const { error: authError } = await supabase.auth.admin.updateUserById(
                user.id,
                { ban_duration: '876000h' }
              );
              if (authError) console.warn('Auth deactivation warning:', authError);
            }
          } catch (authError) {
            console.warn('User status update warning:', authError);
          }
        }

        toast({
          title: t('users.updated'),
          description: t('users.updated_success')
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error managing user:', error);
      toast({
        title: t('error.title'),
        description: error instanceof Error ? error.message : t('error.generic'),
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
        title: t('roles.assigned'),
        description: t('roles.assigned_success').replace('{role}', role)
      });
      onUpdate();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: t('error.title'),
        description: t('roles.assign_error'),
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
        title: t('roles.removed'),
        description: t('roles.removed_success').replace('{role}', role)
      });
      onUpdate();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: t('error.title'),
        description: t('roles.remove_error'),
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('users.new') : t('users.details_title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">{t('auth.full_name')} *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">{t('auth.phone')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+222 XX XX XX XX"
            />
          </div>
          
          <div>
            <Label htmlFor="national_id">{t('auth.national_id')}</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
              placeholder={t('users.table.national_id')}
            />
          </div>

          <div>
            <Label htmlFor="email">{t('auth.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required={mode === 'create'}
              placeholder="utilisateur@example.com"
            />
          </div>

          {mode === 'create' && (
            <>
              <div>
                <Label htmlFor="password">{t('auth.password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  placeholder={t('auth.password_requirements')}
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="role">{t('users.table.role')}</Label>
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
                <h4 className="font-medium">Password Update</h4>
                <div>
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={formData.new_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, new_password: e.target.value }))}
                    placeholder="Leave empty to keep current password"
                    minLength={6}
                  />
                </div>
                {formData.new_password && (
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                      placeholder="Confirm new password"
                      minLength={6}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label>{t('users.manage_roles')}</Label>
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
                            title={t('project.delete')}
                          >
                            ×
                          </Button>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">{t('users.none_found')}</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label>{t('users.table.role')}</Label>
                  <Select onValueChange={(value) => handleRoleAssign(value as RoleType)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('users.table.role')} />
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
                          {t('users.no_results')}
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
              {t('users.active')}
            </Label>
            <span className="text-sm text-gray-500 ml-2">
              {formData.is_active ? t('users.active') : t('users.inactive')}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('users.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (mode === 'create' && (!formData.email || !formData.password || !formData.full_name))}
            className="min-w-[120px]"
          >
            {loading ? t('auth.button.loading') : mode === 'create' ? t('users.new') : t('users.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;
