/**
 * Message d'accès restreint (niveau 2/3 du contrôle d'accès).
 * Affiché avant redirection vers /auth, avec compte à rebours.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROUTES } from '@/config/routes';

interface AccessRestrictedMessageProps {
  /** 'auth' = non connecté, 'forbidden' = connecté sans le rôle requis. */
  variant?: 'auth' | 'forbidden';
  /** Secondes avant redirection automatique (0 = pas de compte à rebours). */
  countdownSeconds?: number;
  onRedirect?: () => void;
}

const AccessRestrictedMessage = ({
  variant = 'auth',
  countdownSeconds = 3,
  onRedirect,
}: AccessRestrictedMessageProps) => {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (countdownSeconds <= 0) return;
    setRemaining(countdownSeconds);
    const interval = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(interval);
          onRedirect?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [countdownSeconds, onRedirect]);

  const isForbidden = variant === 'forbidden';

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            {isForbidden ? (
              <ShieldAlert className="w-7 h-7 text-destructive" aria-hidden="true" />
            ) : (
              <Lock className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
            )}
          </div>

          <h1 className="text-xl font-semibold">
            {isForbidden ? 'Accès non autorisé' : 'Vous devez être connecté pour accéder à cette page.'}
          </h1>

          <p className="text-sm text-muted-foreground">
            {isForbidden
              ? "Votre profil ne dispose pas des droits nécessaires pour cette page."
              : 'Vous allez être redirigé vers la page de connexion.'}
          </p>

          {!isForbidden && countdownSeconds > 0 && (
            <p aria-live="polite" className="text-sm text-muted-foreground">
              Redirection dans {remaining} s…
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            {isForbidden ? (
              <Button asChild variant="outline">
                <Link to={ROUTES.home}>Retour à l'accueil</Link>
              </Button>
            ) : (
              <>
                <Button asChild>
                  <Link to={ROUTES.auth}>Se connecter maintenant</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to={ROUTES.register}>Créer un compte</Link>
                </Button>
              </>
            )}
          </div>

          {!isForbidden && (
            <p className="text-xs text-muted-foreground pt-1">
              Vous êtes fournisseur ?{' '}
              <Link className="underline" to={ROUTES.supplierRegister}>
                Inscrivez-vous
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRestrictedMessage;
