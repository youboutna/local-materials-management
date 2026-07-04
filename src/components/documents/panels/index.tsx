import { DocumentHub } from '@/components/documents/hub';
import { useProjectDocumentAdapter } from '@/components/documents/adapters/projectDocumentAdapter';
import { useSupplierDocumentAdapter } from '@/components/documents/adapters/supplierDocumentAdapter';
import { useInspectionDocumentAdapter } from '@/components/documents/adapters/inspectionDocumentAdapter';
import { useMaterialDocumentAdapter } from '@/components/documents/adapters/materialDocumentAdapter';

export function ProjectDocumentsPanel({ projectId }: { projectId: string }) {
  const contract = useProjectDocumentAdapter(projectId);
  return <DocumentHub contract={contract} className="min-h-[600px]" />;
}

export function SupplierDocumentsPanel({ supplierId }: { supplierId: string }) {
  const contract = useSupplierDocumentAdapter(supplierId);
  return <DocumentHub contract={contract} className="min-h-[600px]" />;
}

export function InspectionDocumentsPanel({ inspectionId }: { inspectionId: string }) {
  const contract = useInspectionDocumentAdapter(inspectionId);
  return <DocumentHub contract={contract} className="min-h-[600px]" />;
}

export function MaterialDocumentsPanel({ materialId }: { materialId: string }) {
  const contract = useMaterialDocumentAdapter(materialId);
  return <DocumentHub contract={contract} className="min-h-[600px]" />;
}
