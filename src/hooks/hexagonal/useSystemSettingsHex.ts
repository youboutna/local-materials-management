/**
 * Hexagonal hook for btp.system_settings
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSystemSettingsService } from '@/application/services/SystemSettingsService';

export function useAdminEmailsHex() {
  const service = getSystemSettingsService();
  const queryClient = useQueryClient();

  const query = useQuery<string[]>({
    queryKey: ['system-settings', 'admin_notification_emails'],
    queryFn: () => service.getAdminEmails(),
  });

  const saveMutation = useMutation({
    mutationFn: (emails: string[]) => service.setAdminEmails(emails),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['system-settings', 'admin_notification_emails'] }),
  });

  return {
    emails: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    saveEmails: saveMutation.mutate,
    saveEmailsAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

export function useSystemSettingsHex() {
  const service = getSystemSettingsService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => service.getAll(),
  });

  const setMutation = useMutation({
    mutationFn: ({
      key,
      configuration,
      category,
    }: {
      key: string;
      configuration: Record<string, unknown>;
      category?: string;
    }) => service.setConfiguration(key, configuration, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-settings'] }),
  });

  return {
    settings: query.data ?? [],
    isLoading: query.isLoading,
    setSetting: setMutation.mutateAsync,
    isSaving: setMutation.isPending,
  };
}
