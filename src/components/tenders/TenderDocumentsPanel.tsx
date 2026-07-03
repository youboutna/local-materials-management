import { DocumentHub } from '@/components/documents/hub';
import { useTenderDocumentAdapter } from '@/components/documents/adapters/tenderDocumentAdapter';

interface Props {
  tenderId: string;
  projectId?: string;
}

export function TenderDocumentsPanel({ tenderId, projectId }: Props) {
  const contract = useTenderDocumentAdapter(tenderId, projectId);
  return <DocumentHub contract={contract} className="min-h-[600px]" />;
}

export default TenderDocumentsPanel;
