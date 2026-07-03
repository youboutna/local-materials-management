import { FileText, FileImage, FileSpreadsheet, FileVideo, FileAudio, FileCode, File as FileIcon } from 'lucide-react';
import { PreviewKind, getPreviewKind } from './types';

export function MimeIcon({ mime, className }: { mime: string | null | undefined; className?: string }) {
  const kind: PreviewKind = getPreviewKind(mime);
  const cls = className ?? 'h-5 w-5';
  switch (kind) {
    case 'pdf':
      return <FileText className={cls} />;
    case 'image':
      return <FileImage className={cls} />;
    case 'video':
      return <FileVideo className={cls} />;
    case 'audio':
      return <FileAudio className={cls} />;
    case 'text':
      return <FileCode className={cls} />;
    case 'office':
      return <FileSpreadsheet className={cls} />;
    default:
      return <FileIcon className={cls} />;
  }
}
