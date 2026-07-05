/**
 * ImportDropzone — thin file input wired to useBoqImport.
 */
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function ImportDropzone({ onFile, accept = '.pdf,.xlsx,.xls,.csv', disabled }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onDragOver={(e) => e.preventDefault()}
      className="rounded-md border-2 border-dashed p-6 text-center bg-muted/30"
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <p className="text-sm text-muted-foreground mb-3">Déposez PDF / Excel / CSV ou</p>
      <Button type="button" variant="outline" disabled={disabled} onClick={() => ref.current?.click()}>
        <Upload className="h-4 w-4 mr-2" /> Sélectionner un fichier
      </Button>
    </div>
  );
}
