
import { PasswordServiceFactory } from '@/application/services/password/PasswordServiceFactory';

// Factory-based approach for updating passwords
export const updateUserPassword = async (userId: string, newPassword: string) => {
  const passwordService = PasswordServiceFactory.getInstance();
  
  // This would typically be handled through a secure API endpoint
  // For now, we'll use the existing password service
  return await passwordService.updatePassword({
    newPassword,
    confirmPassword: newPassword
  });
};

// Legacy code for reference - this exposes Supabase internals
// Consider removing this in favor of the factory approach
// const { data: user, error } = await supabase.auth.admin.updateUserById(
//   'Uiid',
//   {  password: 'password!' }
// )
