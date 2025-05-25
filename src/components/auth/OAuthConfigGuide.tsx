
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OAuthConfigGuide = () => {
  const currentDomain = window.location.origin;
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="mr-2 h-5 w-5" />
          Configuration OAuth requise
        </CardTitle>
        <CardDescription>
          Pour que Google OAuth fonctionne, vous devez configurer les URLs de redirection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>URLs à configurer dans Google Cloud Console :</strong>
            <br />
            <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
              Authorized JavaScript origins: {currentDomain}
              <br />
              Authorized redirect URIs: https://huttgbybeuzeikaqfvam.supabase.co/auth/v1/callback
            </code>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Étapes de configuration :</p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-gray-600">
            <li>Aller dans Google Cloud Console > APIs & Credentials</li>
            <li>Sélectionner votre OAuth 2.0 Client ID</li>
            <li>Ajouter les URLs ci-dessus dans les champs appropriés</li>
            <li>Configurer l'écran de consentement avec votre domaine autorisé</li>
            <li>Dans Supabase > Auth > URL Configuration, définir Site URL: {currentDomain}</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Google Cloud Console
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/huttgbybeuzeikaqfvam/auth/providers', '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Supabase Auth Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OAuthConfigGuide;
