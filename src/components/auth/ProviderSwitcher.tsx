/**
 * Provider Switcher Component
 * Allows switching between authentication providers with fallback support
 */

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { toast } from '@/hooks/use-toast';
import { AUTH_PROVIDERS, AUTH_ERROR_MESSAGES, AUTH_SUCCESS_MESSAGES } from '@/config/auth';
import { AuthProvider } from '@/config/app';

interface ProviderSwitcherProps {
  className?: string;
  showCurrentProvider?: boolean;
  showStatus?: boolean;
  compact?: boolean;
}

export function ProviderSwitcher({ 
  className, 
  showCurrentProvider = true, 
  showStatus = true, 
  compact = false 
}: ProviderSwitcherProps) {
  const { 
    currentProvider, 
    supportedProviders, 
    switchProvider, 
    loading 
  } = useAuth();
  
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>(currentProvider || 'supabase');
  const [providerStatus, setProviderStatus] = useState<Record<string, 'available' | 'unavailable' | 'error' | 'testing'>>({
    supabase: 'testing',
    keycloak: 'testing',
    auth0: 'testing',
    custom: 'testing'
  });

  const handleSwitchProvider = async (provider: string) => {
    if (provider === currentProvider) return;
    
    setIsSwitching(true);
    setProviderStatus(prev => ({ ...prev, [provider]: 'testing' }));
    
    try {
      await switchProvider({ provider: provider as AuthProvider });
      
      setProviderStatus(prev => ({ ...prev, [provider]: 'available' }));
      setSelectedProvider(provider);
      
      toast({
        title: AUTH_SUCCESS_MESSAGES.PROVIDER_SWITCHED.replace('{provider}', provider),
        description: `Successfully switched to ${provider} authentication.`,
      });
    } catch (error) {
      console.error('❌ Provider switch failed:', error);
      setProviderStatus(prev => ({ ...prev, [provider]: 'error' }));
      
      toast({
        title: AUTH_ERROR_MESSAGES.PROVIDER_SWITCH_FAILED,
        description: `Failed to switch to ${provider}. Please try again.`,
        variant: "destructive"
      });
      
      // Reset to current provider
      setSelectedProvider(currentProvider);
    } finally {
      setIsSwitching(false);
    }
  };

  const testProvider = async (provider: string) => {
    setProviderStatus(prev => ({ ...prev, [provider]: 'testing' }));
    
    // Simulate provider test
    setTimeout(() => {
      const isAvailable = ['supabase', 'keycloak', 'auth0', 'custom'].includes(provider);
      setProviderStatus(prev => ({ ...prev, [provider]: isAvailable ? 'available' : 'unavailable' }));
    }, 1000);
  };

  // Test all providers on mount
  React.useEffect(() => {
    supportedProviders.forEach(({ value }) => {
      testProvider(value);
    });
  }, [supportedProviders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-success-soft text-success border-success/30">Available</Badge>;
      case 'unavailable':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Unavailable</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Error</Badge>;
      case 'testing':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Testing...</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-foreground border-border">Unknown</Badge>;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showCurrentProvider && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Provider:</span>
            <Select value={selectedProvider} onValueChange={handleSwitchProvider} disabled={isSwitching}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {supportedProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{provider.label}</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(providerStatus[provider.value])}
                        {getStatusBadge(providerStatus[provider.value])}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSwitching && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Authentication Provider</span>
          {showCurrentProvider && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Current: {currentProvider}
            </Badge>
          )}
        </CardTitle>
        {showStatus && (
          <CardDescription>
            Switch between authentication providers. Current provider: <strong>{currentProvider}</strong>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={selectedProvider} onValueChange={handleSwitchProvider} disabled={isSwitching}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select authentication provider" />
            </SelectTrigger>
            <SelectContent>
                {supportedProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{provider.label}</span>
                      <div className="flex items-center gap-3">
                        {getStatusIcon(providerStatus[provider.value])}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(providerStatus[provider.value])}
                        {provider.value === currentProvider && (
                          <Badge variant="default" className="bg-blue-500 text-white text-xs">Current</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {provider.description}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
          </Select>
          <Button
            onClick={() => handleSwitchProvider(selectedProvider)}
            disabled={isSwitching || selectedProvider === currentProvider}
            variant="outline"
            size="sm"
          >
            {isSwitching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Switching...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Switch
              </>
            )}
          </Button>
        </div>

        {/* Provider Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          {supportedProviders.map((provider) => (
            <div
              key={provider.value}
              className={`p-3 rounded-lg border ${
                provider.value === currentProvider
                  ? 'border-blue-500 bg-primary/10'
                  : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{provider.label}</span>
                {getStatusIcon(providerStatus[provider.value])}
              </div>
              <div className="flex items-center justify-between">
                {getStatusBadge(providerStatus[provider.value])}
                {provider.value === currentProvider && (
                  <Badge variant="default" className="bg-blue-500 text-white text-xs">Current</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {provider.description}
              </div>
            </div>
          ))}
        </div>

        {/* Status Alert */}
        {Object.values(providerStatus).some(status => status === 'error') && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some authentication providers are currently unavailable. Please check your configuration or try switching to an available provider.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default ProviderSwitcher;
