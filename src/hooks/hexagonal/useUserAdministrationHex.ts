import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUserAdministrationService,
  type ManagedUserInput,
  type ManagedUserUpdateInput,
} from '@/application/services/UserAdministrationService';
import type { ConfirmationChannel } from '@/domain/repositories/IUserAdministrationGateway';

const confirmationUrl = () => `${window.location.origin}/reset-password`;

/** Actions d'administration des comptes (admin uniquement, autorisé côté serveur). */
export function useUserAdministrationHex(currentUserId?: string) {
  const queryClient = useQueryClient();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    queryClient.invalidateQueries({ queryKey: ['user-roles'] });
  };

  const create = useMutation({
    mutationFn: async (input: ManagedUserInput) => (await getUserAdministrationService()).create(input, confirmationUrl()),
  });
  const update = useMutation({
    mutationFn: async (input: ManagedUserUpdateInput) => (await getUserAdministrationService()).update(input),
  });
  const setActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      (await getUserAdministrationService()).setActive(userId, isActive, currentUserId),
  });
  const remove = useMutation({
    mutationFn: async (userId: string) => (await getUserAdministrationService()).remove(userId, currentUserId),
  });
  const resend = useMutation({
    mutationFn: async ({ userId, channel }: { userId: string; channel: ConfirmationChannel }) =>
      (await getUserAdministrationService()).resendConfirmation(userId, channel, confirmationUrl()),
  });

  const run = <A, R>(fn: (a: A) => Promise<R>) => async (a: A) => {
    const result = await fn(a);
    refresh();
    return result;
  };

  return {
    createUser: run(create.mutateAsync),
    updateUser: run(update.mutateAsync),
    setUserActive: run(setActive.mutateAsync),
    deleteUser: run(remove.mutateAsync),
    resendConfirmation: resend.mutateAsync,
    isPending: create.isPending || update.isPending || setActive.isPending || remove.isPending || resend.isPending,
    error: create.error || update.error || setActive.error || remove.error || resend.error,
  };
}
