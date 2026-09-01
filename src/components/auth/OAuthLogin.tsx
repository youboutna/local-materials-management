// src/components/auth/OAuthLogin.tsx

import { T } from '@/components/i18n/T';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAppConfig } from '@/config/app';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOAuthLogin } from '@/hooks/hexagonal/useOAuthLogin';
import { Briefcase, Building, Chrome, Github, Key, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// ✅ Ajout de l'icône Keycloak
const PROVIDER_ICONS = {
  google: Chrome,
  github: Github,
  microsoft: Briefcase,
  keycloak: Key,
  auth0: Shield,
  gitlab: Building,
} as const;

const PROVIDER_LABELS = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft',
  keycloak: 'Keycloak',
  auth0: 'Auth0',
  gitlab: 'GitLab',
} as const;

interface OAuthLoginProps {
  title?: string;
  description?: string;
  className?: string;
  onProviderClick?: (provider: string) => void;
}

const OAuthLogin: React.FC<OAuthLoginProps> = ({
  title = "Connexion avec un fournisseur",
  description = "Connectez-vous avec votre compte existant",
  className = "",
  onProviderClick
}) => {
  const { t } = useLanguage();
  const { 
    initiateOAuthLogin, 
    getOAuthProviders,
    isHandlingCallback 
  } = useOAuthLogin();

  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProvider, setCurrentProvider] = useState<string>('');

  // Load OAuth providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const oAuthProviders = await getOAuthProviders();
        setProviders(oAuthProviders.filter(p => p.enabled));
        
        // Récupérer le fournisseur actuel depuis la config
        const config = getAppConfig();
        setCurrentProvider(config.auth.provider);
      } catch (error) {
        console.error('Failed to load OAuth providers:', error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, [getOAuthProviders]);

  // ✅ Fonction pour obtenir le libellé du fournisseur
  const getProviderLabel = (providerName: string): string => {
    return PROVIDER_LABELS[providerName as keyof typeof PROVIDER_LABELS] || providerName;
  };

  // ✅ Fonction pour obtenir l'icône du fournisseur
  const getProviderIcon = (providerName: string) => {
    const Icon = PROVIDER_ICONS[providerName as keyof typeof PROVIDER_ICONS];
    if (Icon) return <Icon className="h-5 w-5" />;
    
    // Icône par défaut
    return <Shield className="h-5 w-5" />;
  };

  const handleProviderLogin = async (provider: string) => {
    try {
      if (onProviderClick) {
        onProviderClick(provider);
      }
      await initiateOAuthLogin(provider);
    } catch (error) {
      console.error(`Failed to login with ${provider}:`, error);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (providers.length === 0) {
    return null; // No OAuth providers available
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {currentProvider && (
          <Badge variant="outline" className="mt-2">
            {t("auto.oauthlogin.provider_actif") || "Fournisseur actif"} : {currentProvider}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {providers.map((provider) => {
            const label = getProviderLabel(provider.providerName);
            const icon = getProviderIcon(provider.providerName);

            return (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full flex items-center justify-center space-x-3 h-12"
                onClick={() => handleProviderLogin(provider.providerName)}
                disabled={isHandlingCallback}
              >
                {icon}
                <span>{t("auto.oauthlogin.continuer_avec") || "Continuer avec"} {label}</span>
                <Badge variant="secondary" className="ml-auto">
                  <T k="auto.oauthlogin.oauth" fallback="OAuth" />
                </Badge>
              </Button>
            );
          })}
        </div>

        {providers.length > 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  ou
                </span>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <T k="auto.oauthlogin.utilisez_le_formulaire_ci_dessous_pour_une_conne" fallback="Utilisez le formulaire ci-dessous pour une connexion classique" />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OAuthLogin;