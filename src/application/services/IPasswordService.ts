import {
  PasswordResetRequestDTO,
  PasswordUpdateRequestDTO,
  PasswordValidationResultDTO
} from '@/dtos/entities/PasswordDTO';

export interface IPasswordService {
  requestPasswordReset(request: PasswordResetRequestDTO): Promise<{ success: boolean; error?: string }>;
  updatePassword(request: PasswordUpdateRequestDTO): Promise<{ success: boolean; error?: string }>;
  validateResetToken(token: string): Promise<PasswordValidationResultDTO>;
}
