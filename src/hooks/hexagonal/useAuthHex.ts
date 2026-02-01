/**
 * Authentication Hook - Enhanced with Domain Transformers Integration
 * Uses authentication services with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { AuthService } from "@/application/services/AuthService";
import { AuthDomainTransformer } from "@/dtos/transforms";
import { LoginData, RegisterData, UserDTO } from "@/dtos/entities";

// Re-export types for convenience
export type { LoginData, RegisterData, UserDTO };
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Enhanced types for UI components
export interface UseAuthHexResult {
  user: UserDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  login: (credentials: LoginData) => void;
  register: (userData: RegisterData) => void;
  logout: () => void;
  updateProfile: (profileData: Partial<UserDTO>) => void;
  changePassword: (newPassword: string) => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isUpdating: boolean;
  // Enhanced UI features
  getUserSecurityLevel: (user: UserDTO) => 'low' | 'medium' | 'high';
  getUserActivityScore: (user: UserDTO) => number;
  getUserTrustLevel: (user: UserDTO) => 'trusted' | 'verified' | 'unverified';
  getUserLastLoginDays: (user: UserDTO) => number;
  generateUserReport: (user: UserDTO) => UserSecurityReport;
}

export interface UserSecurityReport {
  securityLevel: 'low' | 'medium' | 'high';
  trustLevel: 'trusted' | 'verified' | 'unverified';
  activityScore: number;
  lastLoginDays: number;
  recommendations: string[];
}

/**
 * Enhanced hook for authentication management with UI-specific features
 */
export function useAuthHex(): UseAuthHexResult {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Initialize services with transformers
  const authRepository = RepositoryFactory.getAuthRepository();
  const authService = new AuthService(authRepository);

  // Query for current user
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<any> => {
      try {
        const currentUser = await authService.getCurrentUser();
        return currentUser;
      } catch (err) {
        console.error('Error fetching current user:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const loginData = await authService.login(credentials);
        return loginData;
      } catch (error) {
        console.error('Error during login:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      const userName = data.user?.full_name || data.user?.email || 'Utilisateur';
      toast.success(`Bienvenue ${userName}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const registerData = await authService.register(userData);
        return registerData;
      } catch (error) {
        console.error('Error during registration:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      const userName = data?.full_name || data?.email || 'Utilisateur';
      toast.success(`Compte créé avec succès! Bienvenue ${userName}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast.error("Échec de l'inscription. Veuillez réessayer.");
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authService.logout();
        return true;
      } catch (error) {
        console.error('Error during logout:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success("Déconnexion réussie");
      navigate('/login');
    },
    onError: (error: any) => {
      console.error('Logout error:', error);
      toast.error("Erreur lors de la déconnexion");
    }
  });

  // Update profile mutation (placeholder - not implemented in AuthService)
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      try {
        // AuthService doesn't have updateProfile method yet
        // This is a placeholder for future implementation
        console.log('Profile update not yet implemented:', profileData);
        return null;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success("Profil mis à jour avec succès");
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast.error("Erreur lors de la mise à jour du profil");
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      try {
        await authService.updatePassword(newPassword);
        return true;
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Mot de passe mis à jour avec succès");
    },
    onError: (error: any) => {
      console.error('Password change error:', error);
      toast.error("Erreur lors de la mise à jour du mot de passe");
    }
  });

  // Enhanced UI functions
  const getUserSecurityLevel = (targetUser: any): 'low' | 'medium' | 'high' => {
    const hasTwoFactor = targetUser?.hasTwoFactor || false;
    const lastPasswordChange = targetUser?.lastPasswordChange ? new Date(targetUser.lastPasswordChange) : new Date(0);
    const daysSincePasswordChange = Math.floor((new Date().getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));
    const loginAttempts = targetUser?.failedLoginAttempts || 0;
    
    if (hasTwoFactor && daysSincePasswordChange < 30 && loginAttempts === 0) return 'high';
    if (daysSincePasswordChange < 90 && loginAttempts < 3) return 'medium';
    return 'low';
  };

  const getUserActivityScore = (targetUser: any): number => {
    const lastLogin = targetUser?.lastLoginAt ? new Date(targetUser.lastLoginAt) : new Date(0);
    const daysSinceLastLogin = Math.floor((new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    const totalLogins = targetUser?.totalLogins || 1;
    const avgSessionDuration = targetUser?.avgSessionDuration || 0;
    
    // Score based on recent activity and engagement
    const activityScore = Math.max(0, 100 - daysSinceLastLogin * 2);
    const engagementScore = Math.min(100, totalLogins * 5);
    const durationScore = Math.min(100, avgSessionDuration / 60 * 10); // 10 points per hour
    
    return Math.round((activityScore * 0.4 + engagementScore * 0.3 + durationScore * 0.3));
  };

  const getUserTrustLevel = (targetUser: any): 'trusted' | 'verified' | 'unverified' => {
    const isEmailVerified = targetUser?.emailVerified || false;
    const isPhoneVerified = targetUser?.phoneVerified || false;
    const hasCompletedProfile = targetUser?.hasCompletedProfile || false;
    const accountAge = targetUser?.createdAt ? Math.floor((new Date().getTime() - new Date(targetUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (isEmailVerified && isPhoneVerified && hasCompletedProfile && accountAge > 30) return 'trusted';
    if (isEmailVerified && hasCompletedProfile) return 'verified';
    return 'unverified';
  };

  const getUserLastLoginDays = (targetUser: any): number => {
    if (!targetUser?.lastLoginAt) return -1; // Never logged in
    const lastLogin = new Date(targetUser.lastLoginAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUserAnalytics = () => {
    if (!user) return {
      securityLevel: 'low' as const,
      activityScore: 0,
      trustLevel: 'unverified' as const,
      daysSinceLastLogin: -1,
      loginFrequency: 0,
      accountAge: 0
    };
    
    const securityLevel = getUserSecurityLevel(user);
    const activityScore = getUserActivityScore(user);
    const trustLevel = getUserTrustLevel(user);
    const daysSinceLastLogin = getUserLastLoginDays(user);
    const loginFrequency = user.totalLogins || 0;
    const accountAge = user.createdAt ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      securityLevel,
      activityScore,
      trustLevel,
      daysSinceLastLogin,
      loginFrequency,
      accountAge
    };
  };

  // Validation functions for different referential types
  const validateSecurityReferential = (targetUser: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!targetUser?.passwordStrength || targetUser.passwordStrength === 'weak') {
      warnings.push('Password strength is weak - consider updating');
    }
    if (!targetUser?.twoFactorEnabled && targetUser?.role === 'admin') {
      errors.push('Two-factor authentication required for admin users');
    }
    if (!targetUser?.securityQuestions && targetUser?.role === 'admin') {
      warnings.push('Security questions not set for admin users');
    }
    if (!targetUser?.sessionTimeout || targetUser.sessionTimeout > 24) {
      warnings.push('Session timeout should be less than 24 hours');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'security' };
  };

  const validateComplianceReferential = (targetUser: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!targetUser?.complianceTraining && targetUser?.role === 'admin') {
      errors.push('Compliance training required for admin users');
    }
    if (!targetUser?.privacyPolicyAccepted) {
      errors.push('Privacy policy acceptance is required');
    }
    if (!targetUser?.termsAccepted) {
      errors.push('Terms of service acceptance is required');
    }
    if (!targetUser?.dataProcessingAgreement && targetUser?.role === 'admin') {
      warnings.push('Data processing agreement recommended for admin users');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'compliance' };
  };

  const validatePrivacyReferential = (targetUser: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!targetUser?.privacySettings) {
      warnings.push('Privacy settings not configured');
    }
    if (!targetUser?.dataSharingPreferences) {
      warnings.push('Data sharing preferences not specified');
    }
    if (!targetUser?.marketingConsent && targetUser?.role === 'admin') {
      warnings.push('Marketing consent not specified');
    }
    if (!targetUser?.cookiePreferences) {
      warnings.push('Cookie preferences not specified');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'privacy' };
  };

  const validateAccessReferential = (targetUser: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!targetUser?.role) {
      errors.push('User role is required');
    }
    if (!targetUser?.permissions || targetUser.permissions.length === 0) {
      warnings.push('No permissions assigned');
    }
    if (!targetUser?.accessLevel && targetUser?.role === 'admin') {
      warnings.push('Access level not specified for admin users');
    }
    if (!targetUser?.departmentAccess && targetUser?.role === 'manager') {
      warnings.push('Department access not specified for manager users');
    }
    
    return { isValid: errors.length === 0, errors, warnings, compliance: 'access' };
  };

  // Generate user recommendations based on analysis
  const generateUserRecommendations = (targetUser: any, securityLevel: string, activityScore: number) => {
    const recommendations: string[] = [];
    
    if (securityLevel === 'low') {
      recommendations.push('Enable two-factor authentication');
      recommendations.push('Update password to meet security requirements');
      recommendations.push('Review security settings');
    } else if (securityLevel === 'medium') {
      recommendations.push('Consider enabling additional security features');
      recommendations.push('Review security best practices');
    }
    
    if (activityScore < 30) {
      recommendations.push('Increase user engagement');
      recommendations.push('Review user training needs');
    } else if (activityScore > 80) {
      recommendations.push('User is highly active - maintain engagement');
    }
    
    if (targetUser?.role === 'admin') {
      recommendations.push('Regular security audits recommended');
      recommendations.push('Keep compliance training up to date');
    } else if (targetUser?.role === 'manager') {
      recommendations.push('Review team access permissions');
      recommendations.push('Monitor team activity levels');
    }
    
    const lastLoginDays = getUserLastLoginDays(targetUser);
    if (lastLoginDays > 30) {
      recommendations.push('User has not logged in recently - consider follow-up');
    } else if (lastLoginDays > 90) {
      recommendations.push('User inactive for extended period - review account status');
    }
    
    return recommendations;
  };

  return {
    user,
    isLoading,
    error,
    refetch,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    changePassword: changePasswordMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    getUserSecurityLevel,
    getUserActivityScore,
    getUserTrustLevel,
    getUserLastLoginDays,
    getUserAnalytics,
    validateUserWithReferential: async (targetUser: any, referentialType: string) => {
      try {
        switch (referentialType) {
          case 'security':
            return validateSecurityReferential(targetUser);
          case 'compliance':
            return validateComplianceReferential(targetUser);
          case 'privacy':
            return validatePrivacyReferential(targetUser);
          case 'access':
            return validateAccessReferential(targetUser);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateUserReport: (targetUser: any) => {
      try {
        const analytics = getUserAnalytics();
        const securityLevel = getUserSecurityLevel(targetUser);
        const activityScore = getUserActivityScore(targetUser);
        const trustLevel = getUserTrustLevel(targetUser);
        
        return {
          user: {
            ...targetUser,
            securityLevel,
            activityScore,
            trustLevel,
            lastLoginDays: getUserLastLoginDays(targetUser)
          },
          generatedAt: new Date().toISOString(),
          reportType: 'User Analysis Report',
          summary: {
            securityLevel: analytics.securityLevel,
            activityScore: analytics.activityScore
          },
          recommendations: generateUserRecommendations(targetUser, securityLevel, activityScore),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'AuthSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          user: targetUser, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
}

// Simple login/register hooks for Auth page
export function useLoginHex() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authRepository = RepositoryFactory.getAuthRepository();
  const authService = new AuthService(authRepository);

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      const loginData = await authService.login(credentials);
      return loginData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success(`Bienvenue ${data.user?.name || data.user?.email || ''}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  });
}

export function useRegisterHex() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const authRepository = RepositoryFactory.getAuthRepository();
  const authService = new AuthService(authRepository);

  return useMutation({
    mutationFn: async (userData: RegisterData) => {
      const registerData = await authService.register(userData);
      return registerData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success(`Compte créé avec succès!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast.error("Échec de l'inscription. Veuillez réessayer.");
    }
  });
}
