import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  title?: string;
  description?: string;
  canUpload: boolean;
  onUploadClick: () => void;
}

export function DocumentHubEmpty({ title, description, canUpload, onUploadClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title ?? 'Aucun document'}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {description ?? 'Ajoutez votre premier document pour commencer.'}
        </p>
      </div>
      {canUpload && (
        <Button size="sm" onClick={onUploadClick} className="mt-2">
          Ajouter un document
        </Button>
      )}
    </div>
  );
}
