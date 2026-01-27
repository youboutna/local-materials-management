import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { Eye, EyeOff, Lock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SupplierPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checking, setChecking] = useState(true);

  const token = searchParams.get('token');
  const { t } = useLanguage();

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      toast({
        title: t('common.error'),
        description: "Le lien de réinitialisation est invalide ou manquant.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    try {
      const authRepository = RepositoryFactory.getAuthRepository();
      const data = await authRepository.invokeRPC('validate_supplier_reset_token', {
        reset_token: token
      });

      if (!data || data.length === 0) {
        toast({
          title: t('common.error'),
          description: "Ce lien de réinitialisation a expiré ou a déjà été utilisé.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setTokenValid(true);
    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: t('common.error'),
        description: "Impossible de valider le lien de réinitialisation.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('common.error'),
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: t('common.error'),
        description: "Token invalide.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get the notification to find the supplier email
      const authRepository = RepositoryFactory.getAuthRepository();
      const notification = await authRepository.invokeRPC('get_supplier_notification_by_token', {
        reset_token: token
      });

      if (!notification) {
        throw new Error('Token invalide');
      }

      // Create/update auth user for the supplier
      const authData = await authRepository.signUp({
        email: notification.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/supplier-portal`
        }
      });

      // Update the supplier record with the user_id
      if (authData.user && notification.supplier_id) {
        const supplierRepository = RepositoryFactory.getSupplierRepository();
        await supplierRepository.update(notification.supplier_id, { 
          user_id: authData.user.id,
          default_password_reset_required: false
        });
      }

      // Mark the token as used
      await authRepository.invokeRPC('mark_supplier_token_used', {
        reset_token: token
      });

      toast({
        title: t('common.success'),
        description: "Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.",
      });

      navigate('/auth');

    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: t('common.error'),
        description: error.message || "Impossible de définir le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-adrar-50 to-terracotta-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
      </div>
    );
  }

  if (!tokenValid) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-adrar-50 to-terracotta-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-adrar-800">
            <Lock className="h-6 w-6" />
            Définir votre mot de passe
          </CardTitle>
          <p className="text-gray-600">
            Créez un mot de passe sécurisé pour accéder à votre portail fournisseur
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre mot de passe"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Définition en cours..." : "Définir le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierPasswordReset;
