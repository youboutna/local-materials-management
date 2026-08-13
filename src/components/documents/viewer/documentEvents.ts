/**
 * Bus d'événements documents (léger, sans dépendance)
 * Permet à toutes les listes (projet, conformité, appel d'offres, matériaux, portail…)
 * de se resynchroniser immédiatement après une action de la visionneuse
 * (changement de statut, suppression, mise à jour).
 */

import { useEffect } from 'react';

export type DocumentChangeKind = 'status' | 'deleted' | 'created' | 'updated';

export interface DocumentChangeEvent {
  kind: DocumentChangeKind;
  id: string | null;
  status?: string | null;
}

const EVENT_NAME = 'lovable:document-changed';

export function emitDocumentChanged(event: DocumentChangeEvent): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DocumentChangeEvent>(EVENT_NAME, { detail: event }));
}

/** Abonne un callback aux changements de documents (auto-nettoyé). */
export function useDocumentChanges(handler: (event: DocumentChangeEvent) => void): void {
  useEffect(() => {
    const listener = (e: Event) => {
      const detail = (e as CustomEvent<DocumentChangeEvent>).detail;
      if (detail) handler(detail);
    };
    window.addEventListener(EVENT_NAME, listener);
    return () => window.removeEventListener(EVENT_NAME, listener);
  }, [handler]);
}
