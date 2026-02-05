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
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
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
  } = useUnifiedAuth();
  
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
      await switchProvider({ provider });
      
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unavailable':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case 'unavailable':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Unavailable</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'testing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Testing...</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
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
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
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
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
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
                    <div className="text-xs text-gray-500 mt-1">
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
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
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
              <div className="text-xs text-gray-500">
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
