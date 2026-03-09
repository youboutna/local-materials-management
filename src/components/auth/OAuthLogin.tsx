/**
 * OAuth Login Component
 * Social login buttons for OAuth providers following hexagonal architecture
 * Following PROMPTS.md rules: UI Component → Service → Domain ← Adapter → DB
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useOAuthLogin } from '@/hooks/hexagonal/useOAuthLogin';
import { Github, Chrome, Briefcase } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const PROVIDER_ICONS = {
  google: Chrome,
  github: Github,
  microsoft: Briefcase
} as const;

const PROVIDER_LABELS = {
  google: 'Google',
  github: 'GitHub',
  microsoft: 'Microsoft'
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
    availableProviders,
    getOAuthProviders,
    isHandlingCallback 
  } = useOAuthLogin();

  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load OAuth providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setIsLoading(true);
        const oAuthProviders = await getOAuthProviders();
        setProviders(oAuthProviders.filter(p => p.enabled));
      } catch (error) {
        console.error('Failed to load OAuth providers:', error);
        setProviders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviders();
  }, [getOAuthProviders]);

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
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {providers.map((provider) => {
            const IconComponent = PROVIDER_ICONS[provider.providerName as keyof typeof PROVIDER_ICONS];
            const label = PROVIDER_LABELS[provider.providerName as keyof typeof PROVIDER_LABELS] || provider.providerName;

            return (
              <Button
                key={provider.id}
                variant="outline"
                className="w-full flex items-center justify-center space-x-3 h-12"
                onClick={() => handleProviderLogin(provider.providerName)}
                disabled={isHandlingCallback}
              >
                {IconComponent && <IconComponent className="h-5 w-5" />}
                <span>Continuer avec {label}</span>
                <Badge variant="secondary" className="ml-auto">
                  OAuth
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
              Utilisez le formulaire ci-dessous pour une connexion classique
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OAuthLogin;