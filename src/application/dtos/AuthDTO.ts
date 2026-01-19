/**
 * Authentication DTOs - Hexagonal Architecture
 * Data Transfer Objects for authentication operations
 */

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  user: any;
  token: string;
  refreshToken: string;
}

export interface CreateUserRequestDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  role?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  email_confirmed_at?: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
}

export interface RegisterResponseDto {
  id: string;
  email: string;
  fullName: string;
  email_confirmed_at?: string;
}

export interface AuthSessionDto {
  user: any;
  session: any;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  role?: string;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthErrorDto {
  message: string;
  code?: string;
  details?: any;
}

export interface AuthValidationDto {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Type aliases for backward compatibility
export type LoginData = LoginRequestDto;
export type RegisterData = RegisterRequestDto;
