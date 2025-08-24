import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, Search, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorPageProps {
  type: '404' | '403' | '500' | '503' | 'network';
  title?: string;
  description?: string;
  onRetry?: () => void;
  showContactSupport?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  type,
  title,
  description,
  onRetry,
  showContactSupport = false
}) => {
  const navigate = useNavigate();

  const getErrorConfig = () => {
    switch (type) {
      case '404':
        return {
          icon: <Search className="h-16 w-16 text-muted-foreground" />,
          title: title || 'Page non trouvée',
          description: description || 'La page que vous recherchez n\'existe pas ou a été déplacée.',
          actions: [
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'default' as const },
            { label: 'Page précédente', action: () => window.history.back(), variant: 'outline' as const }
          ]
        };

      case '403':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-destructive" />,
          title: title || 'Accès interdit',
          description: description || 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
          actions: [
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'default' as const },
            { label: 'Demander l\'accès', icon: MessageCircle, action: () => navigate('/contact'), variant: 'outline' as const }
          ]
        };

      case '500':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-destructive" />,
          title: title || 'Erreur serveur',
          description: description || 'Une erreur interne s\'est produite. Notre équipe technique a été notifiée.',
          actions: [
            { label: 'Réessayer', icon: RefreshCw, action: onRetry || (() => window.location.reload()), variant: 'default' as const },
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'outline' as const }
          ]
        };

      case '503':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: title || 'Service temporairement indisponible',
          description: description || 'Le service est en maintenance. Veuillez réessayer dans quelques minutes.',
          actions: [
            { label: 'Réessayer', icon: RefreshCw, action: onRetry || (() => window.location.reload()), variant: 'default' as const },
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'outline' as const }
          ]
        };

      case 'network':
        return {
          icon: <AlertTriangle className="h-16 w-16 text-orange-500" />,
          title: title || 'Problème de connexion',
          description: description || 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
          actions: [
            { label: 'Réessayer', icon: RefreshCw, action: onRetry || (() => window.location.reload()), variant: 'default' as const },
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'outline' as const }
          ]
        };

      default:
        return {
          icon: <AlertTriangle className="h-16 w-16 text-muted-foreground" />,
          title: title || 'Une erreur s\'est produite',
          description: description || 'Une erreur inattendue s\'est produite.',
          actions: [
            { label: 'Réessayer', icon: RefreshCw, action: onRetry || (() => window.location.reload()), variant: 'default' as const },
            { label: 'Retour à l\'accueil', icon: Home, action: () => navigate('/'), variant: 'outline' as const }
          ]
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription className="text-center">
            {config.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            {config.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                className="w-full"
              >
                {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                {action.label}
              </Button>
            ))}
          </div>

          {showContactSupport && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Le problème persiste ?
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/contact')}
                className="w-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter le support
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pt-4">
            Code d'erreur: {type.toUpperCase()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorPage;