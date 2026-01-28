/**
 * Auth Status Component
 * Displays current authentication status and provider information
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Shield, User, Clock, RefreshCw } from 'lucide-react';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { AUTH_PROVIDERS } from '@/config/auth';

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
  } = useUnifiedAuth();
  
  const { userRoles, hasAnyRole } = useCurrentUserRoles();

  const getStatusIcon = () => {
    if (loading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isAuthenticated) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (loading) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Loading...</Badge>;
    }
    if (isAuthenticated) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Authenticated</Badge>;
    }
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Not Authenticated</Badge>;
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
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
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
            Authentication Status
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </CardTitle>
        <CardDescription>
          Current authentication state and user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-medium">User:</span>
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
              <span className="text-gray-500">No user</span>
            )}
          </div>
          
          {showProvider && (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Provider:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {getProviderInfo().label}
              </Badge>
              <span className="text-xs text-gray-500">
                {getProviderInfo().description}
              </span>
            </div>
          )}
        </div>

        {/* Roles */}
        {showRoles && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Roles:</span>
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
              <span className="text-gray-500">No roles assigned</span>
            )}
          </div>
        )}

        {/* Session Information */}
        {showSession && session && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Session:</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Provider:</span> {session.provider}
              </div>
              {session.expires_at && (
                <div>
                  <span className="font-medium">Expires:</span>{' '}
                  {new Date(session.expires_at).toLocaleString()}
                </div>
              )}
              <div>
                <span className="font-medium">User ID:</span> {user?.id}
              </div>
            </div>
          </div>
        )}

        {/* Status Alerts */}
        {!isAuthenticated && !loading && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are not authenticated. Please sign in to access protected features.
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
              You have limited access. Some features may require additional permissions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default AuthStatus;
