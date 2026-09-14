/**
 * Page « validation en cours » — accueil des fournisseurs dont le compte
 * attend l'approbation d'un administrateur.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, LogOut, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { ROUTES } from '@/config/routes';
import { useNavigate } from 'react-router-dom';

const PendingValidation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate(ROUTES.auth, { replace: true });
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
            Votre demande est en cours de validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nous avons bien reçu votre dossier d'inscription. Un administrateur vérifie vos informations
            (raison sociale, identifiant fiscal, zones d'intervention). Vous recevrez un courriel dès
            l'activation de votre accès au portail fournisseur.
          </p>

          {user?.email && (
            <Alert>
              <Mail className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Courriel de suivi : <strong>{user.email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.contact)}>
              Contacter l'administration
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingValidation;
