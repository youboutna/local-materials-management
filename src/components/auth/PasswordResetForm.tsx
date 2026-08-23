
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft } from 'lucide-react';
import { usePasswordManagement } from '@/hooks/usePasswordManagement';
import { T } from '@/components/i18n/T';

interface PasswordResetFormProps {
  onBack: () => void;
}

const PasswordResetForm = ({ onBack }: PasswordResetFormProps) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  const { loading, requestPasswordReset } = usePasswordManagement();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await requestPasswordReset(email);
    
    if (result.success) {
      setEmailSent(true);
    } else {
      setError(result.error || 'Une erreur est survenue lors de l\'envoi de l\'email.');
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Mail className="h-5 w-5" />
            <T k="auto.passwordresetform.email_envoye" fallback="Email envoyé" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <T k="auto.passwordresetform.un_lien_de_reinitialisation_de_mot_de_passe_a_et" fallback="Un lien de réinitialisation de mot de passe a été envoyé à" /> <strong>{email}</strong>.
              Vérifiez votre boîte de réception et suivez les instructions dans l'email.
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <T k="auto.passwordresetform.retour_a_la_connexion" fallback="Retour à la connexion" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center"><T k="auto.passwordresetform.mot_de_passe_oublie" fallback="Mot de passe oublié" /></CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="email"><T k="auto.passwordresetform.adresse_email" fallback="Adresse email" /></Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Entrez votre adresse email"
            />
          </div>

          <div className="space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </Button>
            
            <Button 
              type="button"
              variant="outline" 
              className="w-full" 
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <T k="auto.passwordresetform.retour_a_la_connexion" fallback="Retour à la connexion" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordResetForm;
