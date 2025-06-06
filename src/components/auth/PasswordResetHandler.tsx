import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PasswordResetHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);

  // Check if we have the required tokens or if user is authenticated
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');

  useEffect(() => {
    const checkAuthState = async () => {
      // If this is a password recovery link, set the session
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (!error) {
            setIsValidLink(true);
            return;
          }
        } catch (err) {
          console.error('Error setting session:', err);
        }
      }

      // Check if user is already authenticated (might have clicked link while logged in)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidLink(true);
        return;
      }

      // If no valid session and no valid tokens, link is invalid
      setIsValidLink(false);
    };

    checkAuthState();
  }, [accessToken, refreshToken, type]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_do_not_match') || 'Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 6) {
      setError(t('auth.password_too_short') || 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: t('auth.password_updated') || "Mot de passe mis à jour",
        description: t('auth.password_updated_desc') || "Votre mot de passe a été mis à jour avec succès.",
      });

      // Sign out and redirect to login page
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setError(error.message || t('auth.password_update_error') || 'Une erreur est survenue lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('auth.invalid_link') || 'Lien invalide'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {t('auth.invalid_link_desc') || 'Ce lien de réinitialisation de mot de passe est invalide ou a expiré. Veuillez demander un nouveau lien de réinitialisation.'}
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/auth?mode=reset-password')}
            >
              {t('auth.request_new_link') || 'Demander un nouveau lien'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            {t('auth.new_password') || 'Nouveau mot de passe'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="password">{t('auth.new_password') || 'Nouveau mot de passe'}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('auth.enter_new_password') || 'Entrez votre nouveau mot de passe'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
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

            <div>
              <Label htmlFor="confirmPassword">{t('auth.confirm_password') || 'Confirmer le mot de passe'}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('auth.confirm_new_password') || 'Confirmez votre nouveau mot de passe'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? t('auth.updating') || 'Mise à jour...' : t('auth.update_password') || 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetHandler;
