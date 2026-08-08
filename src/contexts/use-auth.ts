import { useContext } from 'react';
import { AuthContext, AuthContextType } from './auth-context';

export function useAuthHex(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
