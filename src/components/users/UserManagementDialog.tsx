import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserAdministrationHex } from '@/hooks/hexagonal/useUserAdministrationHex';
import {
  ROLES_RESPONSIBILITIES,
  getRoleLabel,
} from '@/config/referentials/auth/roles-responsibilities.referential';
import { MIN_PASSWORD_LENGTH, UserAdministrationError } from '@/application/services/UserAdministrationService';
import type { ConfirmationChannel } from '@/domain/repositories/IUserAdministrationGateway';

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

const ERROR_FALLBACKS: Record<string, string> = {
  INVALID_EMAIL: 'Adresse e-mail invalide.',
  FULL_NAME_REQUIRED: 'Le nom complet est obligatoire.',
  INVALID_PHONE: 'Numéro au format international requis (ex. +222 22 33 44 55).',
  PHONE_REQUIRED_FOR_SMS: "Un numéro de téléphone est nécessaire pour l'envoi par SMS.",
  ROLE_REQUIRED: 'Choisissez au moins un rôle.',
  UNKNOWN_ROLE: 'Rôle inconnu.',
  PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
  PASSWORD_MISMATCH: 'Les mots de passe ne correspondent pas.',
};

const UserManagementDialog: React.FC<UserManagementDialogProps> = ({ user, isOpen, onClose, onUpdate, mode }) => {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const admin = useUserAdministrationHex(currentUser?.id);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [roles, setRoles] = useState<string[]>(['viewer']);
  const [legacyRoles, setLegacyRoles] = useState<string[]>([]);
  const [channel, setChannel] = useState<ConfirmationChannel>('email');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFullName(user?.full_name ?? '');
    setEmail(user?.email ?? '');
    setPhone(user?.phone ?? '');
    setNationalId(user?.national_id ?? '');
    // Seuls les rôles du référentiel sont éditables ; les rôles hérités inconnus ne sont pas renvoyés.
    const known = (user?.roles ?? []).filter((r) => ROLES_RESPONSIBILITIES.some((x) => x.code === r));
    setLegacyRoles((user?.roles ?? []).filter((r) => !known.includes(r)));
    setRoles(known.length ? known : ['viewer']);
    setChannel('email');
    setPassword('');
    setConfirm('');
  }, [isOpen, user]);

  const label = (key: string, fallback: string) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const describe = (error: unknown) => {
    const code = error instanceof UserAdministrationError ? error.code : error instanceof Error ? error.message : '';
    return ERROR_FALLBACKS[code] ?? (code || label('error.generic', 'Une erreur est survenue'));
  };

  const toggleRole = (code: string, checked: boolean) =>
    setRoles((prev) => (checked ? [...new Set([...prev, code])] : prev.filter((r) => r !== code)));

  const handleSubmit = async () => {
    try {
      if (mode === 'create') {
        const result = await admin.createUser({ email, fullName, phone, nationalId, roles, channel });
        const sent = result.confirmation?.sent !== false;
        toast({
          title: label('users.created', 'Utilisateur créé'),
          description: sent
            ? channel === 'sms'
              ? 'Un lien de confirmation a été envoyé par SMS.'
              : 'Un lien de confirmation a été envoyé par e-mail.'
            : `Compte créé, mais le lien n'a pas pu être envoyé : ${result.confirmation?.error ?? ''}`,
          variant: sent ? 'default' : 'destructive',
        });
      } else {
        if (!user?.id) return;
        if (password && password !== confirm) throw new UserAdministrationError('PASSWORD_MISMATCH');
        await admin.updateUser({
          userId: user.id,
          fullName,
          phone,
          nationalId,
          email: email && email !== user.email ? email : undefined,
          password: password || undefined,
          roles,
        });
        toast({ title: label('users.updated', 'Utilisateur mis à jour') });
      }
      onUpdate();
      onClose();
    } catch (error) {
      toast({ title: label('error.title', 'Erreur'), description: describe(error), variant: 'destructive' });
    }
  };

  const handleResend = async () => {
    if (!user?.id) return;
    try {
      const result = await admin.resendConfirmation({ userId: user.id, channel });
      toast({
        title: result.sent ? 'Lien envoyé' : 'Envoi impossible',
        description: result.sent ? undefined : result.error,
        variant: result.sent ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({ title: label('error.title', 'Erreur'), description: describe(error), variant: 'destructive' });
    }
  };

  const lang = (language === 'ar' || language === 'en' ? language : 'fr') as 'fr' | 'ar' | 'en';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? label('users.new', 'Nouvel utilisateur') : label('users.details_title', "Modifier l'utilisateur")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="full_name">{label('auth.full_name', 'Nom complet')} *</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">{label('auth.email', 'E-mail')} *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="utilisateur@exemple.mr" />
            </div>
            <div>
              <Label htmlFor="phone">{label('auth.phone', 'Téléphone')}</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+222 22 33 44 55" />
            </div>
          </div>
          <div>
            <Label htmlFor="national_id">{label('auth.national_id', 'Numéro national')}</Label>
            <Input id="national_id" value={nationalId} onChange={(e) => setNationalId(e.target.value)} />
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>{label('users.manage_roles', 'Rôles')} *</Label>
            {legacyRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {label('users.legacy_roles_notice', 'Anciens rôles non reconnus, retirés à l\'enregistrement :')} {legacyRoles.join(', ')}
              </p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES_RESPONSIBILITIES.map((role) => (
                <label key={role.code} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={roles.includes(role.code)}
                    onCheckedChange={(checked) => toggleRole(role.code, checked === true)}
                  />
                  {getRoleLabel(role.code, lang)}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label>
              {mode === 'create' ? 'Envoyer le lien de confirmation par' : 'Canal pour renvoyer le lien'}
            </Label>
            <RadioGroup value={channel} onValueChange={(v) => setChannel(v as ConfirmationChannel)} className="flex gap-6">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="email" /> E-mail</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="sms" /> SMS</label>
            </RadioGroup>
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground">
                L'utilisateur choisit lui-même son mot de passe en ouvrant le lien.
              </p>
            )}
            {mode === 'edit' && (
              <Button type="button" variant="outline" size="sm" onClick={handleResend} disabled={admin.isPending}>
                Renvoyer le lien
              </Button>
            )}
          </div>

          {mode === 'edit' && (
            <div className="space-y-3 border-t pt-4">
              <Label>Nouveau mot de passe (facultatif)</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={`${MIN_PASSWORD_LENGTH} caractères minimum`} />
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>{label('users.cancel', 'Annuler')}</Button>
          <Button onClick={handleSubmit} disabled={admin.isPending || !fullName || !email || roles.length === 0}>
            {admin.isPending ? 'Enregistrement…' : mode === 'create' ? 'Créer et envoyer le lien' : label('users.save', 'Enregistrer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementDialog;
