/**
 * LocalFilePreviewButton
 * Permet de consulter le contenu d'un fichier AVANT son enregistrement / mise à jour.
 * Utilisable dans tous les formulaires d'upload (projet, organisation, matériau,
 * appel d'offres, DQE, facture, parseur/importateur).
 */

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentViewer } from './DocumentViewerProvider';

interface Props {
  file: File | null | undefined;
  title?: string;
  label?: string;
  documentType?: string | null;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export function LocalFilePreviewButton({
  file,
  title,
  label = 'Aperçu',
  documentType,
  className,
  size = 'sm',
  variant = 'outline',
}: Props) {
  const { openDocument } = useDocumentViewer();
  if (!file) return null;

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openDocument(file, { title: title || file.name, documentType, allowStatusChange: false });
      }}
    >
      <Eye className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
}

export default LocalFilePreviewButton;
