
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOAuthConfig } from '@/hooks/hexagonal/useOAuthConfigHex';

const OAuthConfigGuide = () => {
  const { 
    currentProvider, 
    currentDomain, 
    getProviderConfig, 
    getRedirectUris, 
    getSetupInstructions 
  } = useOAuthConfig();
  
  const providerConfig = getProviderConfig(currentProvider);
  const redirectUris = getRedirectUris();
  const setupInstructions = getSetupInstructions(currentProvider);
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="mr-2 h-5 w-5" />
          Configuration {providerConfig?.name || 'OAuth'} requise
        </CardTitle>
        <CardDescription>
          Pour que {providerConfig?.name || 'OAuth'} fonctionne, vous devez configurer les URLs de redirection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>URLs à configurer dans {providerConfig?.name || 'OAuth Console'} :</strong>
            <br />
            <code className="block mt-2 p-2 bg-gray-100 rounded text-sm">
              {redirectUris.length > 1 ? (
                <>
                  Authorized JavaScript origins: {currentDomain}
                  <br />
                  Authorized redirect URIs: {redirectUris.join(', ')}
                </>
              ) : (
                <>
                  Authorized JavaScript origins: {currentDomain}
                  <br />
                  Authorized redirect URIs: {redirectUris[0]}
                </>
              )}
            </code>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Étapes de configuration :</p>
          <ol className="list-decimal list-inside text-sm space-y-1 text-gray-600">
            {setupInstructions.length > 0 ? (
              setupInstructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))
            ) : (
              <>
                <li>Aller dans {providerConfig?.name || 'OAuth Console'} {'->'} APIs & Credentials</li>
                <li>Sélectionner votre OAuth 2.0 Client ID</li>
                <li>Ajouter les URLs ci-dessus dans les champs appropriés</li>
                <li>Configurer l'écran de consentement avec votre domaine autorisé</li>
                <li>Dans votre fournisseur auth {'->'} Auth {'->'} URL Configuration, définir Site URL: {currentDomain}</li>
              </>
            )}
          </ol>
        </div>

        <div className="flex gap-2">
          {providerConfig?.setupUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(providerConfig.setupUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {providerConfig.name} Console
            </Button>
          )}
          {currentProvider === 'supabase' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://supabase.com/dashboard/project/huttgbybeuzeikaqfvam/auth/providers', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Supabase Auth Settings
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OAuthConfigGuide;
