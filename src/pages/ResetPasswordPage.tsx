import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { usePasswordManagement } from '@/hooks/usePasswordManagement';
import { AuthService } from '@/application/services/AuthService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword, loading } = usePasswordManagement();
  const authService = new AuthService(RepositoryFactory.getAuthRepository());

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isValidLink, setIsValidLink] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkResetLink = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          const { error } = await authService.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
            user: null // Will be populated by the adapter
          });

          if (error) {
            console.error('Session error:', error);
            setError('Lien de réinitialisation invalide ou expiré.');
            setIsValidLink(false);
          } else {
            setIsValidLink(true);
          }
        } catch (error) {
          console.error('Reset link error:', error);
          setError('Erreur lors de la validation du lien.');
          setIsValidLink(false);
        }
      } else {
        setError('Lien de réinitialisation invalide.');
        setIsValidLink(false);
      }
      setChecking(false);
    };

    checkResetLink();
  }, [searchParams, authService]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    const result = await updatePassword(newPassword, confirmPassword);
    
    if (result.success) {
      navigate('/auth');
    } else {
      setError(result.error || 'Erreur lors de la mise à jour du mot de passe.');
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-gray-600">Vérification du lien...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-gray-600 mb-4">
              {error || 'Ce lien de réinitialisation est invalide ou a expiré.'}
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Retour à la connexion
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
          <CardTitle className="text-center text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
            <Lock className="h-6 w-6" />
            Nouveau mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>

            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Retour à la connexion
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;