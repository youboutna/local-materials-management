
import { SupabasePasswordService } from '@/services/password/SupabasePasswordService';

// Factory-based approach for updating passwords
export const updateUserPassword = async (userId: string, newPassword: string) => {
  const passwordService = new SupabasePasswordService();
  
  return await passwordService.updatePassword({
    userId,
    newPassword,
    confirmPassword: newPassword
  });
};
