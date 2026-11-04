import { useQuery } from '@tanstack/react-query';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

export interface PaymentDocument {
  id: string;
  type: string;
  title: string;
  file_url?: string;
  created_at: string;
  status?: string;
}

export function usePaymentRequestDocumentsHex(projectId: string, phaseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-documents', projectId, phaseId],
    queryFn: async () => {
      const repo = RepositoryFactory.getProjectCheckpointSourceRepository();
      const inspections = await repo.findApprovedInspections(projectId, 5);

      const docs: PaymentDocument[] = [];

      for (const inspection of inspections || []) {
        if (inspection.documents) {
          const inspDocs = inspection.documents as any;
          if (inspDocs.files && Array.isArray(inspDocs.files)) {
            for (const file of inspDocs.files) {
              docs.push({
                id: `${inspection.id}-${file.type}`,
                type: file.type,
                title: file.file_name || file.type,
                file_url: file.file_url,
                created_at: file.uploaded_at || inspection.date,
                status: 'approved',
              });
            }
          }
        }
      }

      const projectDocs = await repo.findDocumentsByTypes(projectId, ['inspection_report', 'project_report']);

      if (projectDocs) {
        for (const doc of projectDocs) {
          docs.push({
            id: doc.id || '',
            type: doc.document_type || '',
            title: doc.title || '',
            file_url: doc.file_url || undefined,
            created_at: doc.created_at || '',
            status: doc.status || undefined,
          });
        }
      }

      return docs;
    },
    enabled,
  });
}

export async function submitPaymentRequestHex(params: {
  projectId: string;
  phaseId?: string;
  amount: number;
  progressAtPayment: number;
  contractorName: string;
  contractorContact: string;
}) {
  const { projectId, phaseId, amount, progressAtPayment, contractorName, contractorContact } = params;
  if (!contractorName || !contractorContact) throw new Error('Contractor name and contact are required');
  await RepositoryFactory.getProjectCheckpointSourceRepository().insertPaymentRequest({
      project_id: projectId,
      phase_id: phaseId,
      amount,
      progress_at_payment: progressAtPayment,
      payment_date: new Date().toISOString(),
      payment_method: null,
      transaction_id: `REQ-${Date.now()}`,
      contractor_name: contractorName,
      contractor_contact: contractorContact,
    });
}
