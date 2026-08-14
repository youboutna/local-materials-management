/**
 * InsuranceDocumentCell
 * Cellule/bouton unique pour la pièce justificative d'un certificat d'assurance.
 *
 * - Document présent  → ouverture dans la visionneuse GED unifiée (proxy activé :
 *   l'URL de stockage réelle n'est jamais exposée).
 * - Document absent   → ouverture du formulaire d'ajout de document standard
 *   (ProjectDocumentUpload) puis rattachement de l'URL au certificat.
 */

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, FilePlus2 } from 'lucide-react';
import ProjectDocumentUpload from '@/components/project/ProjectDocumentUpload';
import { useDocumentViewer } from '@/components/documents/viewer';
import { getInsuranceCertificatesService } from '@/application/services/InsuranceCertificatesService';
import { useToast } from '@/hooks/use-toast';
import type { InsuranceCertificateDTO } from '@/dtos/entities/InsuranceDTO';

interface InsuranceDocumentCellProps {
  certificate: InsuranceCertificateDTO;
  /** Rafraîchit la liste après rattachement du document. */
  onChanged?: () => void;
}

export function InsuranceDocumentCell({ certificate, onChanged }: InsuranceDocumentCellProps) {
  const { openDocument } = useDocumentViewer();
  const { toast } = useToast();
  const certificatesService = useMemo(() => getInsuranceCertificatesService(), []);
  const [uploadOpen, setUploadOpen] = useState(false);

  const url = certificate.certificateUrl || (certificate as any).certificate_url || '';

  if (url) {
    return (
      <Button
        size="sm"
        variant="outline"
        title="Voir la pièce d'assurance"
        onClick={() =>
          openDocument(
            {
              id: certificate.id,
              name: `Police ${certificate.policyNumber || ''}`.trim(),
              file_url: url,
            },
            { proxy: true },
          )
        }
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" title="Joindre la police / attestation" onClick={() => setUploadOpen(true)}>
        <FilePlus2 className="h-4 w-4" />
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Joindre un document d'assurance</DialogTitle>
            <DialogDescription>
              Police {certificate.policyNumber || '—'} — le document sera rattaché au certificat et au projet.
            </DialogDescription>
          </DialogHeader>
          <ProjectDocumentUpload
            projectId={certificate.projectId || (certificate as any).project_id || null}
            context="compliance"
            contextLabel="Assurance"
            onDocumentUploaded={async () => {
              setUploadOpen(false);
              onChanged?.();
              toast({ title: 'Document joint', description: 'La pièce a été ajoutée à la GED du projet.' });
              try {
                if (certificate.id) {
                  await certificatesService.updateCertificate(certificate.id, {
                    lastVerified: new Date().toISOString(),
                  } as any);
                }
              } catch (error) {
                console.error('[InsuranceDocumentCell] link failed', error);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InsuranceDocumentCell;
