
export interface IPasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

export interface IPasswordUpdateRequest {
  newPassword: string;
  confirmPassword: string;
}

export interface IPasswordService {
  requestPasswordReset(request: IPasswordResetRequest): Promise<{ success: boolean; error?: string }>;
  updatePassword(request: IPasswordUpdateRequest): Promise<{ success: boolean; error?: string }>;
  validateResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }>;
}
