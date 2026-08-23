/**
 * Auth Status Component
 * Displays current authentication status and provider information
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Shield, User, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { AUTH_PROVIDERS } from '@/config/auth';
import { T } from '@/components/i18n/T';

interface AuthStatusProps {
  className?: string;
  showProvider?: boolean;
  showRoles?: boolean;
  showSession?: boolean;
  compact?: boolean;
}

export function AuthStatus({ 
  className, 
  showProvider = true, 
  showRoles = true, 
  showSession = true,
  compact = false 
}: AuthStatusProps) {
  const { 
    user, 
    session, 
    isAuthenticated, 
    loading, 
    currentProvider 
  } = useAuth();
  
  const { userRoles, hasAnyRole } = useCurrentUserRoles();

  const getStatusIcon = () => {
    if (loading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-primary" />;
    }
    if (isAuthenticated) {
      return <CheckCircle className="h-4 w-4 text-success" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><T k="auto.authstatus.loading" fallback="Loading..." /></Badge>;
    }
    if (isAuthenticated) {
      return <Badge variant="outline" className="bg-success-soft text-success border-success/30"><T k="auto.authstatus.authenticated" fallback="Authenticated" /></Badge>;
    }
    return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><T k="auto.authstatus.not_authenticated" fallback="Not Authenticated" /></Badge>;
  };

  const getProviderInfo = () => {
    return AUTH_PROVIDERS.find(p => p.value === currentProvider) || AUTH_PROVIDERS[0];
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        {getStatusBadge()}
        {showProvider && (
          <Badge variant="outline" className="bg-muted text-foreground border-border">
            {getProviderInfo().label}
          </Badge>
        )}
        {showRoles && userRoles.length > 0 && (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {userRoles.join(', ')}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <T k="auto.authstatus.authentication_status" fallback="Authentication Status" />
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </CardTitle>
        <CardDescription>
          <T k="auto.authstatus.current_authentication_state_and_user_informatio" fallback="Current authentication state and user information" />
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium"><T k="auto.authstatus.user" fallback="User:" /></span>
            {user ? (
              <div className="flex items-center gap-2">
                <span>{user.email}</span>
                {user.full_name && (
                  <Badge variant="outline" className="text-xs">
                    {user.full_name}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground"><T k="auto.authstatus.no_user" fallback="No user" /></span>
            )}
          </div>
          
          {showProvider && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium"><T k="auto.authstatus.provider" fallback="Provider:" /></span>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                {getProviderInfo().label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {getProviderInfo().description}
              </span>
            </div>
          )}
        </div>

        {/* Roles */}
        {showRoles && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium"><T k="auto.authstatus.roles" fallback="Roles:" /></span>
            </div>
            {userRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <Badge 
                    key={role} 
                    variant={hasAnyRole(['admin', 'director']) ? "default" : "outline"}
                    className={hasAnyRole(['admin', 'director']) 
                      ? "bg-purple-500 text-white" 
                      : "bg-purple-50 text-purple-700 border-purple-200"
                    }
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground"><T k="auto.authstatus.no_roles_assigned" fallback="No roles assigned" /></span>
            )}
          </div>
        )}

        {/* Session Information */}
        {showSession && session && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium"><T k="auto.authstatus.session" fallback="Session:" /></span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                <span className="font-medium"><T k="auto.authstatus.provider" fallback="Provider:" /></span> {session.provider}
              </div>
              {session.expires_at && (
                <div>
                  <span className="font-medium"><T k="auto.authstatus.expires" fallback="Expires:" /></span>{' '}
                  {new Date(session.expires_at).toLocaleString()}
                </div>
              )}
              <div>
                <span className="font-medium"><T k="auto.authstatus.user_id" fallback="User ID:" /></span> {user?.id}
              </div>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {!isAuthenticated && !loading && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <T k="auto.authstatus.you_are_not_authenticated_please_sign_in_to_acce" fallback="You are not authenticated. Please sign in to access protected features." />
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && userRoles.length === 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are authenticated but no roles are assigned. Please contact an administrator to get appropriate permissions.
            </AlertDescription>
          </Alert>
        )}

        {isAuthenticated && !hasAnyRole(['admin', 'director', 'project_manager']) && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <T k="auto.authstatus.you_have_limited_access_some_features_may_requir" fallback="You have limited access. Some features may require additional permissions." />
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthStatus;
