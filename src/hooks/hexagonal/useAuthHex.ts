/**
 * Authentication Hook - Enhanced with Domain Transformers Integration
 * Uses authentication services with advanced calculations and analytics
 * Following hexagonal architecture principles with UI-specific enhancements
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { AuthService } from "@/application/services/AuthService";
import { AuthDomainTransformer, LoginRequestDto, RegisterRequestDto } from "@/dtos/transforms";
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Enhanced types for UI components
export interface UseAuthHexResult {
  user: any;
  isLoading: boolean;
  error: any;
  refetch: () => void;
  login: (credentials: LoginRequestDto) => void;
  register: (userData: RegisterRequestDto) => void;
  logout: () => void;
  updateProfile: (data: any) => void;
  changePassword: (data: any) => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isUpdating: boolean;
  // Enhanced UI features
  getUserSecurityLevel: (user: any) => 'low' | 'medium' | 'high';
  getUserActivityScore: (user: any) => number;
  getUserTrustLevel: (user: any) => 'trusted' | 'verified' | 'unverified';
  getUserLastLoginDays: (user: any) => number;
  getUserAnalytics: () => any;
  validateUserWithReferential: (user: any, referentialType: string) => Promise<any>;
  generateUserReport: (user: any) => any;
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
  const authService = new AuthService(authRepository, AuthDomainTransformer);

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
    mutationFn: async (credentials: LoginRequestDto) => {
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
      toast.success(`Bienvenue ${data.user.name || data.user.email}!`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequestDto) => {
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
      toast.success(`Compte créé avec succès! Bienvenue ${data.user.name || data.user.email}!`);
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

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      try {
        const updatedUser = await authService.updateProfile(profileData);
        return updatedUser;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
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
    mutationFn: async (passwordData: any) => {
      try {
        await authService.changePassword(passwordData);
        return true;
      } catch (error) {
        console.error('Error changing password:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Mot de passe changé avec succès");
    },
    onError: (error: any) => {
      console.error('Password change error:', error);
      toast.error("Erreur lors du changement de mot de passe");
    }
  });

  // Enhanced UI functions
  const getUserSecurityLevel = (user: any): 'low' | 'medium' | 'high' => {
    const hasTwoFactor = user.twoFactorEnabled || false;
    const lastLoginDays = getUserLastLoginDays(user);
    const passwordStrength = user.passwordStrength || 'weak';
    
    if (!hasTwoFactor || passwordStrength === 'weak' || lastLoginDays > 90) return 'low';
    if (hasTwoFactor && passwordStrength === 'medium' && lastLoginDays <= 30) return 'medium';
    return 'high';
  };

  const getUserActivityScore = (user: any): number => {
    const loginFrequency = user.loginFrequency || 0;
    const lastLoginDays = getUserLastLoginDays(user);
    const accountAge = user.accountAge || 0;
    
    // Score based on activity (0-100)
    const frequencyScore = Math.min(100, loginFrequency * 10);
    const recencyScore = lastLoginDays <= 7 ? 100 : Math.max(0, 100 - lastLoginDays);
    const ageScore = Math.min(100, accountAge / 30 * 10);
    
    return Math.round((frequencyScore * 0.4 + recencyScore * 0.4 + ageScore * 0.2));
  };

  const getUserTrustLevel = (user: any): 'low' | 'medium' | 'high' => {
    const securityLevel = getUserSecurityLevel(user);
    const activityScore = getUserActivityScore(user);
    const isVerified = user.verified || false;
    
    if (securityLevel === 'high' && activityScore >= 70 && isVerified) return 'high';
    if (securityLevel === 'medium' && activityScore >= 50) return 'medium';
    return 'low';
  };

  const getUserLastLoginDays = (user: any): number => {
    if (!user.lastLoginAt) return 0;
    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUserAnalytics = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => getUserLastLoginDays(u) <= 30).length;
    const averageSecurityLevel = users.length > 0 
      ? users.reduce((sum, u) => {
          const level = getUserSecurityLevel(u);
          return sum + (level === 'high' ? 3 : level === 'medium' ? 2 : 1);
        }, 0) / users.length 
      : 0;
    const averageActivityScore = users.length > 0 
      ? users.reduce((sum, u) => sum + getUserActivityScore(u), 0) / users.length 
      : 0;
    
    return {
      totalUsers,
      activeUsers,
      averageSecurityLevel,
      averageActivityScore
    };
  };

  // Validation functions for different referential types
  const validateSecurityReferential = (user: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate password requirements
    if (!user.passwordStrength || user.passwordStrength === 'weak') {
      warnings.push('Password strength is weak - consider updating');
    }
    
    // Validate two-factor authentication
    if (!user.twoFactorEnabled && user.role === 'admin') {
      errors.push('Two-factor authentication required for admin users');
    }
    
    // Validate security settings
    if (!user.securityQuestions && user.role === 'admin') {
      warnings.push('Security questions not set for admin users');
    }
    
    // Validate session management
    if (!user.sessionTimeout || user.sessionTimeout > 24) {
      warnings.push('Session timeout should be less than 24 hours');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'security'
    };
  };

  const validateComplianceReferential = (user: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate compliance training
    if (!user.complianceTraining && user.role === 'admin') {
      errors.push('Compliance training required for admin users');
    }
    
    // Validate privacy policy acceptance
    if (!user.privacyPolicyAccepted) {
      errors.push('Privacy policy acceptance is required');
    }
    
    // Validate terms of service
    if (!user.termsAccepted) {
      errors.push('Terms of service acceptance is required');
    }
    
    // Validate data processing agreement
    if (!user.dataProcessingAgreement && user.role === 'admin') {
      warnings.push('Data processing agreement recommended for admin users');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'compliance'
    };
  };

  const validatePrivacyReferential = (user: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate privacy settings
    if (!user.privacySettings) {
      warnings.push('Privacy settings not configured');
    }
    
    // Validate data sharing preferences
    if (!user.dataSharingPreferences) {
      warnings.push('Data sharing preferences not specified');
    }
    
    // Validate marketing consent
    if (!user.marketingConsent && user.role === 'admin') {
      warnings.push('Marketing consent not specified');
    }
    
    // Validate cookie preferences
    if (!user.cookiePreferences) {
      warnings.push('Cookie preferences not specified');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'privacy'
    };
  };

  const validateAccessReferential = (user: any) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Validate role-based access
    if (!user.role) {
      errors.push('User role is required');
    }
    
    // Validate permissions
    if (!user.permissions || user.permissions.length === 0) {
      warnings.push('No permissions assigned');
    }
    
    // Validate access level
    if (!user.accessLevel && user.role === 'admin') {
      warnings.push('Access level not specified for admin users');
    }
    
    // Validate department access
    if (!user.departmentAccess && user.role === 'manager') {
      warnings.push('Department access not specified for manager users');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      compliance: 'access'
    };
  };

  // Generate user recommendations based on analysis
  const generateUserRecommendations = (user: any, securityLevel: string, activityScore: number) => {
    const recommendations: string[] = [];
    
    // Security-based recommendations
    if (securityLevel === 'low') {
      recommendations.push('Enable two-factor authentication');
      recommendations.push('Update password to meet security requirements');
      recommendations.push('Review security settings');
    } else if (securityLevel === 'medium') {
      recommendations.push('Consider enabling additional security features');
      recommendations.push('Review security best practices');
    }
    
    // Activity-based recommendations
    if (activityScore < 30) {
      recommendations.push('Increase user engagement');
      recommendations.push('Review user training needs');
    } else if (activityScore > 80) {
      recommendations.push('User is highly active - maintain engagement');
    }
    
    // Role-based recommendations
    if (user.role === 'admin') {
      recommendations.push('Regular security audits recommended');
      recommendations.push('Keep compliance training up to date');
    } else if (user.role === 'manager') {
      recommendations.push('Review team access permissions');
      recommendations.push('Monitor team activity levels');
    }
    
    // Last login-based recommendations
    const lastLoginDays = getUserLastLoginDays(user);
    if (lastLoginDays > 30) {
      recommendations.push('User has not logged in recently - consider follow-up');
    } else if (lastLoginDays > 90) {
      recommendations.push('User inactive for extended period - review account status');
    }
    
    return recommendations;
  };
  const getUserSecurityLevel = (user: any): 'low' | 'medium' | 'high' => {
    const hasTwoFactor = user.hasTwoFactor || false;
    const lastPasswordChange = user.lastPasswordChange ? new Date(user.lastPasswordChange) : new Date(0);
    const daysSincePasswordChange = Math.floor((new Date().getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));
    const loginAttempts = user.failedLoginAttempts || 0;
    
    if (hasTwoFactor && daysSincePasswordChange < 30 && loginAttempts === 0) return 'high';
    if (daysSincePasswordChange < 90 && loginAttempts < 3) return 'medium';
    return 'low';
  };

  const getUserActivityScore = (user: any): number => {
    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(0);
    const daysSinceLastLogin = Math.floor((new Date().getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    const totalLogins = user.totalLogins || 1;
    const avgSessionDuration = user.avgSessionDuration || 0;
    
    // Score based on recent activity and engagement
    const activityScore = Math.max(0, 100 - daysSinceLastLogin * 2);
    const engagementScore = Math.min(100, totalLogins * 5);
    const durationScore = Math.min(100, avgSessionDuration / 60 * 10); // 10 points per hour
    
    return Math.round((activityScore * 0.4 + engagementScore * 0.3 + durationScore * 0.3));
  };

  const getUserTrustLevel = (user: any): 'trusted' | 'verified' | 'unverified' => {
    const isEmailVerified = user.emailVerified || false;
    const isPhoneVerified = user.phoneVerified || false;
    const hasCompletedProfile = user.hasCompletedProfile || false;
    const accountAge = user.createdAt ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    if (isEmailVerified && isPhoneVerified && hasCompletedProfile && accountAge > 30) return 'trusted';
    if (isEmailVerified && hasCompletedProfile) return 'verified';
    return 'unverified';
  };

  const getUserLastLoginDays = (user: any): number => {
    if (!user.lastLoginAt) return -1; // Never logged in
    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUserAnalytics = () => {
    if (!user) return {
      securityLevel: 'low',
      activityScore: 0,
      trustLevel: 'unverified',
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
    validateUserWithReferential: async (user: any, referentialType: string) => {
      try {
        // Validation selon le type de référentiel
        switch (referentialType) {
          case 'security':
            return validateSecurityReferential(user);
          case 'compliance':
            return validateComplianceReferential(user);
          case 'privacy':
            return validatePrivacyReferential(user);
          case 'access':
            return validateAccessReferential(user);
          default:
            return { isValid: true, errors: [], warnings: ['Unknown referential type'] };
        }
      } catch (error) {
        console.error('Referential validation error:', error);
        return { isValid: false, errors: ['Validation failed'], warnings: [] };
      }
    },
    generateUserReport: (user: any) => {
      try {
        const analytics = getUserAnalytics();
        const securityLevel = getUserSecurityLevel(user);
        const activityScore = getUserActivityScore(user);
        const trustLevel = getUserTrustLevel(user);
        
        return {
          user: {
            ...user,
            securityLevel,
            activityScore,
            trustLevel,
            lastLoginDays: getUserLastLoginDays(user)
          },
          generatedAt: new Date().toISOString(),
          reportType: 'User Analysis Report',
          summary: {
            totalUsers: analytics.totalUsers,
            activeUsers: analytics.activeUsers,
            averageSecurityLevel: analytics.averageSecurityLevel,
            averageActivityScore: analytics.averageActivityScore
          },
          recommendations: generateUserRecommendations(user, securityLevel, activityScore),
          compliance: {
            isValid: true,
            lastValidated: new Date().toISOString(),
            validatedBy: 'AuthSystem'
          }
        };
      } catch (error) {
        console.error('Report generation error:', error);
        return { 
          user, 
          generatedAt: new Date().toISOString(),
          error: 'Report generation failed',
          status: 'error'
        };
      }
    }
  };
}

// ... (rest of the code remains the same)
