/**
 * Password Repository Interface - Hexagonal Architecture
 */

export interface IPasswordRepository {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;

  createPasswordReset(data: {
    userId: string;
    email: string;
    token: string;
    expiresAt: Date;
    redirectUrl: string;
  }): Promise<void>;

  sendPasswordResetEmail(data: {
    email: string;
    token: string;
    redirectUrl: string;
  }): Promise<void>;

  findPasswordResetByToken(token: string): Promise<{
    userId: string;
    email: string;
    expiresAt: string;
  } | null>;

  deletePasswordReset(token: string): Promise<void>;

  updateUserPassword(data: {
    userId: string;
    password: string;
  }): Promise<void>;

  invalidateUserSessions(userId: string): Promise<void>;

  verifyUserPassword(userId: string, password: string): Promise<boolean>;
}
