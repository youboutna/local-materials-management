import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

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

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      toast({
        title: "Lien invalide",
        description: "Le lien de réinitialisation est invalide ou manquant.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('reset_token', token)
        .eq('notification_type', 'password_reset')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast({
          title: "Lien expiré",
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
        title: "Erreur",
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
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Erreur",
        description: "Token invalide.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get the notification to find the supplier email
      const { data: notification, error: notificationError } = await supabase
        .from('supplier_notifications')
        .select('email, supplier_id')
        .eq('reset_token', token)
        .single();

      if (notificationError || !notification) {
        throw new Error('Token invalide');
      }

      // Create/update auth user for the supplier
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: notification.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/supplier-portal`
        }
      });

      if (authError && authError.message !== 'User already registered') {
        throw authError;
      }

      // Update the supplier record with the user_id
      if (authData.user && notification.supplier_id) {
        await supabase
          .from('suppliers')
          .update({ 
            user_id: authData.user.id,
            default_password_reset_required: false
          })
          .eq('id', notification.supplier_id);
      }

      // Mark the token as used
      await supabase
        .from('supplier_notifications')
        .update({ used_at: new Date().toISOString() })
        .eq('reset_token', token);

      toast({
        title: "Succès",
        description: "Votre mot de passe a été défini avec succès. Vous pouvez maintenant vous connecter.",
      });

      navigate('/auth');

    } catch (error: any) {
      console.error('Error setting password:', error);
      toast({
        title: "Erreur",
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
