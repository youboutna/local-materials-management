
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

const OAuthErrorHandler = () => {
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (!error) return null;

  const getErrorMessage = (error: string, description?: string | null) => {
    switch (error) {
      case 'access_denied':
        return 'Accès refusé. Vous avez annulé la connexion.';
      case 'unauthorized_client':
        return 'Configuration OAuth incorrecte. Vérifiez les paramètres de votre provider.';
      case 'invalid_request':
        return 'Requête invalide. Problème de configuration OAuth.';
      default:
        return description || 'Erreur de connexion OAuth. Vérifiez votre configuration.';
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {getErrorMessage(error, errorDescription)}
      </AlertDescription>
    </Alert>
  );
};

export default OAuthErrorHandler;
