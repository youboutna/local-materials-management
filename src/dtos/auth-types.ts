// Auth credentials DTO
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Auth result DTO  
export interface AuthResult {
  user: UserDTO;
  token: string;
  expiresAt: string;
}

// Auth error DTO
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
