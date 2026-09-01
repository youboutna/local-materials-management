// src/components/auth/OAuthConfigGuide.tsx
// Guide de configuration OAuth - Version complète

import { T } from '@/components/i18n/T';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthProvider } from '@/config/app';
import { getAppConfig } from '@/config/app';
import { getOAuthProviderConfig } from '@/config/referentials/oauth-providers.referential';
import { useOAuthConfig } from "@/hooks/hexagonal/useOAuthConfigHex";
import { ExternalLink, Info } from "lucide-react";

interface OAuthConfigGuideProps {
  /** Fournisseur OAuth à configurer (par défaut: celui de la config) */
  provider?: AuthProvider;
  /** Titre personnalisé */
  title?: string;
  /** Description personnalisée */
  description?: string;
  /** Classes CSS supplémentaires */
  className?: string;
}

const OAuthConfigGuide = ({
  provider: forcedProvider,
  title,
  description,
  className,
}: OAuthConfigGuideProps = {}) => {
  const { currentProvider, currentDomain, getRedirectUris, getSetupInstructions } = useOAuthConfig();

  // Utiliser le fournisseur forcé ou celui de la config
  const provider = (forcedProvider || currentProvider) as AuthProvider;
  const providerConfig = getOAuthProviderConfig(provider);

  // Récupérer les URLs de redirection et les instructions
  const redirectUris = getRedirectUris();
  const setupInstructions = getSetupInstructions(provider);

  // Remplacer les placeholders dans les instructions
  const processedInstructions = setupInstructions.map((instruction) =>
    instruction.replace(/{domain}/g, currentDomain)
  );

  // Construire dynamiquement l'URL de configuration pour Supabase
  const setupUrl = (() => {
    if (provider === 'supabase') {
      try {
        const config = getAppConfig();
        const projectId = config.auth.projectId || '';
        if (projectId) {
          return `https://supabase.com/dashboard/project/${projectId}/auth/providers`;
        }
        // Fallback: essayer avec l'URL
        const url = config.auth.url || '';
        if (url) {
          const match = url.match(/https?:\/\/([^.]+)\.supabase\./i);
          if (match) {
            return `https://supabase.com/dashboard/project/${match[1]}/auth/providers`;
          }
        }
        return providerConfig.setupUrl;
      } catch {
        return providerConfig.setupUrl;
      }
    }
    return providerConfig.setupUrl;
  })();

  // Libellé par défaut
  const defaultTitle = `Configuration ${providerConfig.name} requise`;
  const defaultDescription = `Pour que ${providerConfig.name} fonctionne, vous devez configurer les URLs de redirection.`;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="mr-2 h-5 w-5 text-blue-500" />
          {title || defaultTitle}
        </CardTitle>
        <CardDescription>
          {description || defaultDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* URLs de redirection */}
        {redirectUris.length > 0 && (
          <Alert>
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <strong>URLs à configurer dans {providerConfig.name} :</strong>
              <br />
              <code className="block mt-2 p-3 bg-muted rounded text-sm font-mono break-all">
                <span className="text-muted-foreground">Authorized JavaScript origins:</span>
                <br />
                <span className="font-semibold">{currentDomain}</span>
                <br />
                <span className="text-muted-foreground">Authorized redirect URIs:</span>
                <br />
                {redirectUris.map((uri, index) => (
                  <span key={index}>
                    <span className="font-semibold">{uri}</span>
                    {index < redirectUris.length - 1 && <br />}
                  </span>
                ))}
              </code>
            </AlertDescription>
          </Alert>
        )}

        {/* Étapes de configuration */}
        {processedInstructions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              <T k="auto.oauthconfigguide.etapes_de_configuration" fallback="Étapes de configuration :" />
            </p>
            <ol className="list-decimal list-inside text-sm space-y-1.5 text-muted-foreground">
              {processedInstructions.map((instruction, index) => (
                <li key={index} className="pl-2">
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex flex-wrap gap-2 pt-2">
          {setupUrl && (
            <Button
              variant="outline"
              size="default"
              onClick={() => window.open(setupUrl, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir {providerConfig.name} Console
            </Button>
          )}
          {provider === "supabase" && setupUrl && (
            <Button
              variant="outline"
              size="default"
              onClick={() => window.open(setupUrl, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <T k="auto.oauthconfigguide.supabase_auth_settings" fallback="Supabase Auth Settings" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="default"
            onClick={() => {
              // Copier les URLs dans le presse-papiers
              const text = [
                'Authorized JavaScript origins:',
                currentDomain,
                '',
                'Authorized redirect URIs:',
                ...redirectUris,
              ].join('\n');
              navigator.clipboard?.writeText(text).then(() => {
                // Notification silencieuse
              }).catch(() => {});
            }}
            className="gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copier les URLs
          </Button>
        </div>

        {/* Note de sécurité */}
        <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <strong>🔐 Sécurité :</strong> Les clés API et secrets ne sont pas stockés dans l'interface.
            Ils doivent être configurés dans le fichier <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code> ou dans les variables d'environnement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default OAuthConfigGuide;