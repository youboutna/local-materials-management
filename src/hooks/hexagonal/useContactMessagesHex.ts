/**
 * Hexagonal hooks for contact_messages (messagerie réception)
 * UI -> ContactMessageService -> SupabaseContactMessageAdapter
 */
import { ContactMessageService } from '@/application/services/ContactMessageService';
import type {
    ContactMessageFilters,
    CreateContactMessageData,
} from '@/domain/repositories/IContactMessageRepository';
import { toast } from '@/hooks/use-toast';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const getService = () =>
  getContactMessageService();

const LIST_KEY = ['contact-messages'] as const;
const STATS_KEY = ['contact-messages', 'stats'] as const;

export function useContactMessagesHex(filters?: ContactMessageFilters) {
  return useQuery({
    queryKey: [...LIST_KEY, filters ?? {}],
    queryFn: () => getService().getMessages(filters),
  });
}

export function useContactMessageStatsHex() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: () => getService().getStats(),
  });
}

export function useSubmitContactMessageHex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactMessageData) => getService().submitMessage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
      toast({
        title: 'Message envoyé',
        description: 'Votre message a bien été transmis. Nous reviendrons vers vous rapidement.',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : "Échec de l'envoi du message.",
        variant: 'destructive',
      });
    },
  });
}

export function useContactMessageActionsHex() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: LIST_KEY });
    qc.invalidateQueries({ queryKey: STATS_KEY });
  };

  const markAsRead = useMutation({
    mutationFn: (id: string) => getService().markAsRead(id),
    onSuccess: invalidate,
  });
  const markAsSpam = useMutation({
    mutationFn: (id: string) => getService().markAsSpam(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Marqué comme spam' });
    },
  });
  const archive = useMutation({
    mutationFn: (id: string) => getService().archiveMessage(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Message archivé' });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => getService().deleteMessage(id),
    onSuccess: () => {
      invalidate();
      toast({ title: 'Message supprimé' });
    },
  });
  const bulkMarkRead = useMutation({
    mutationFn: (ids: string[]) => getService().markMultipleAsRead(ids),
    onSuccess: invalidate,
  });
  const bulkArchive = useMutation({
    mutationFn: (ids: string[]) => getService().archiveMultiple(ids),
    onSuccess: invalidate,
  });
  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => getService().deleteMultiple(ids),
    onSuccess: invalidate,
  });

  return { markAsRead, markAsSpam, archive, remove, bulkMarkRead, bulkArchive, bulkDelete };
}
