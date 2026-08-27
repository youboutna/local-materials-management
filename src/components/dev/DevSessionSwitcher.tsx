/**
 * DevSessionSwitcher — DEV MODE badge with live role switching + real-session escape hatch.
 *
 * Rules:
 *  - Rendered only when DEV_MODE is on AND the active auth adapter is the local one.
 *  - Switching a role re-authenticates against the matching DEV_USER (no Supabase call).
 *  - "Session réelle" signs out and sends the user to /auth to log in through the API.
 */

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, LogOut, ShieldCheck, Wrench } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DEV_MODE, getActiveDevRole, getDevUsersSnapshot, setActiveDevRole } from '@/config/constants';
import { AuthAdapterFactory } from '@/infrastructure/adapters/auth/AuthAdapterFactory';
import { useHexagonalAuth } from '@/hooks/hexagonal/useHexagonalAuth';
import { useToast } from '@/hooks/use-toast';

const DevSessionSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { login, signOut, isAuthenticated } = useHexagonalAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [activeRole, setActiveRoleState] = useState(() => getActiveDevRole().role);

  const isLocalSession = DEV_MODE && AuthAdapterFactory.getKind() === 'local';

  const devUsers = useMemo(() => Object.entries(getDevUsersSnapshot()), []);

  if (!isLocalSession) return null;

  const switchRole = async (roleKey: string, email: string, password?: string) => {
    if (!password) {
      toast({
        title: 'Profil DEV incomplet',
        description: `Aucun mot de passe local pour ${email}`,
        variant: 'destructive',
      });
      return;
    }
    try {
      setBusy(true);
      setActiveDevRole(roleKey);
      setActiveRoleState(roleKey as typeof activeRole);
      await login({ email, password });
      await queryClient.invalidateQueries();
      toast({ title: 'Rôle DEV activé', description: `${roleKey.toUpperCase()} — permissions rechargées` });
    } catch (error) {
      toast({
        title: 'Bascule impossible',
        description: error instanceof Error ? error.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const goRealSession = async () => {
    try {
      setBusy(true);
      await signOut();
      queryClient.clear();
    } finally {
      window.location.href = '/auth';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full bg-yellow-500 px-2 py-0.5 text-xs font-medium text-black hover:bg-yellow-400"
          aria-label="Mode développement — changer de rôle"
        >
          <Wrench className="h-3 w-3" />
          {compact ? 'DEV' : 'DEV MODE'}
          <span className="font-semibold uppercase">· {activeRole}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> Tester les permissions
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {devUsers.map(([roleKey, profile]) => (
          <DropdownMenuItem
            key={roleKey}
            disabled={busy}
            onClick={() => switchRole(roleKey, profile.email, profile.password)}
            className="cursor-pointer"
          >
            <span className="flex-1">
              <span className="font-medium uppercase">{roleKey}</span>
              <span className="block text-xs text-muted-foreground">{profile.email}</span>
            </span>
            {activeRole === roleKey && isAuthenticated && <Check className="h-4 w-4 text-success" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full gap-2" disabled={busy} onClick={goRealSession}>
            <LogOut className="h-4 w-4" /> Session réelle (API)
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DevSessionSwitcher;
