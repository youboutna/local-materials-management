import { useQuery } from '@tanstack/react-query';
import { getTenderDocumentService } from '@/application/services/TenderDocumentService';

export function useTenderLevelDocumentsHex(tenderId: string) {
  return useQuery({
    queryKey: ['tender-docs-adapter', tenderId],
    enabled: !!tenderId,
    queryFn: async () => {
      return getTenderDocumentService().getTenderDocumentsWithDocument(tenderId);
    },
  });
}

export async function createTenderLevelDocumentHex(params: {
  tenderId: string;
  projectId?: string;
  title: string;
  description?: string | null;
  publicUrl: string;
  file: File;
  category?: string;
}) {
  await getTenderDocumentService().createTenderLevelDocument({
    tenderId: params.tenderId,
    projectId: params.projectId,
    title: params.title,
    description: params.description ?? '',
    fileUrl: params.publicUrl,
    fileName: params.file.name,
    fileSize: params.file.size,
    mimeType: params.file.type,
    category: params.category ?? 'administrative',
    subcategory: 'other',
    isRequired: false,
    isSubmitted: true,
    status: 'pending',
  });
}

export async function deleteTenderLevelDocumentHex(id: string) {
  await getTenderDocumentService().deleteTenderDocument({ id });
}
