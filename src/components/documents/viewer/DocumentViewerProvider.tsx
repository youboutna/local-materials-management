/**
 * DocumentViewerProvider
 * Fournit une visionneuse de document globale accessible depuis n'importe quel module.
 *
 * Usage :
 *   const { openDocument } = useDocumentViewer();
 *   openDocument(doc);                       // DTO, ligne DB, DocumentItem…
 *   openDocument(file, { proxy: false });    // fichier local avant upload
 */

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UniversalDocumentViewer } from './UniversalDocumentViewer';
import { DocumentViewerOptions, ViewableDocument, normalizeViewable } from './types';
import { emitDocumentChanged } from './documentEvents';


interface DocumentViewerContextValue {
  openDocument: (input: unknown, options?: DocumentViewerOptions & Partial<ViewableDocument>) => void;
  closeDocument: () => void;
}

const DocumentViewerContext = createContext<DocumentViewerContextValue | null>(null);

export function DocumentViewerProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [doc, setDoc] = useState<ViewableDocument | null>(null);
  const [options, setOptions] = useState<DocumentViewerOptions>({});
  const [open, setOpen] = useState(false);

  const openDocument = useCallback(
    (input: unknown, opts?: DocumentViewerOptions & Partial<ViewableDocument>) => {
      const {
        proxy, allowStatusChange, onStatusChange, onStatusChanged, onDelete, resolveBlobUrl,
        ...overrides
      } = (opts ?? {}) as DocumentViewerOptions & Partial<ViewableDocument>;
      setDoc(normalizeViewable(input, overrides));
      setOptions({ proxy, allowStatusChange, onStatusChange, onStatusChanged, onDelete, resolveBlobUrl });
      setOpen(true);
    },
    []
  );

  const closeDocument = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openDocument, closeDocument }), [openDocument, closeDocument]);

  return (
    <DocumentViewerContext.Provider value={value}>
      {children}
      <UniversalDocumentViewer
        document={doc}
        open={open}
        onClose={closeDocument}
        {...options}
        onStatusChanged={(id, status) => {
          setDoc((d) => (d ? { ...d, status } : d));
          queryClient.invalidateQueries({ queryKey: ['documents'] });
          emitDocumentChanged({ kind: 'status', id, status });
          options.onStatusChanged?.(id, status);
        }}
        onDelete={
          options.onDelete
            ? (d) => {
                emitDocumentChanged({ kind: 'deleted', id: d.id });
                queryClient.invalidateQueries({ queryKey: ['documents'] });
                options.onDelete?.(d);
              }
            : undefined
        }
      />


export function useDocumentViewer(): DocumentViewerContextValue {
  const ctx = useContext(DocumentViewerContext);
  if (!ctx) {
    // Fallback non bloquant : évite de casser un module monté hors provider
    return {
      openDocument: (input: any) => {
        const d = normalizeViewable(input);
        if (d.fileUrl) window.open(d.fileUrl, '_blank', 'noopener');
      },
      closeDocument: () => undefined,
    };
  }
  return ctx;
}
