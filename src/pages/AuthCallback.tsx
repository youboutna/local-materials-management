/**
 * src/pages/AuthCallback.tsx
 * Point de retour unique des fournisseurs externes (GitHub, Google…).
 *
 * Le client Supabase termine l'échange du code (detectSessionInUrl / PKCE) ;
 * cette page attend la session puis redirige vers l'accueil adapté au rôle.
 * Le flux e-mail / mot de passe n'emprunte jamais cette route.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DEFAULT_MANAGEMENT_HOME, resolveHomeRouteForRoles } from '@/config/referentials/auth/role-home-routes.referential';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import { useLanguage } from '@/contexts/LanguageContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoading } = useHexagonalAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const roles = user.roles?.length ? user.roles : user.role ? [user.role] : [];
      navigate(resolveHomeRouteForRoles(roles) || DEFAULT_MANAGEMENT_HOME, { replace: true });
      return;
    }
    if (!isLoading && timedOut) {
      navigate('/auth', { replace: true });
    }
  }, [user, isLoading, timedOut, navigate]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">
        {t('auth.callback.finalizing') || 'Finalisation de la connexion…'}
      </p>
    </div>
  );
};

export default AuthCallback;
