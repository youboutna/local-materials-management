interface AuthErrorDTO {
  code: 'invalid_credentials' | 'expired_token' | 'unauthorized' | 'server_error';
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export default AuthErrorDTO;
