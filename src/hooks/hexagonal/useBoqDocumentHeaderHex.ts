/**
 * src/hooks/hexagonal/useBoqDocumentHeaderHex.ts
 * Hook hexagonal pour la gestion des en-têtes documentaires BOQ
 *
 * ✅ Utilise useCurrentUserRoles() pour l'utilisateur courant
 * ✅ Le hook ne connaît PAS Supabase
 */
import { useState, useEffect, useCallback } from 'react';
import { DocumentHeaderService, DocumentHeaderServiceInstance } from '@/application/services/boq/DocumentHeaderService';
import { DocumentPartiesValue } from '@/components/boq/DocumentPartiesDialog';
import { DocumentHeaderTransformer } from '@/dtos/transforms/DocumentHeaderTransformer';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

/**
 * ✅ Mapper — Convertit `ctx.routeContext` en `BoqSource` valide
 * SANS modifier BoqSource
 */
function routeContextToBoqSource(routeContext: string): string {
  const mapping: Record<string, string> = {
    'project-dqe': 'dqe',
    'tender-estimate': 'tender_estimate',
    'supplier-bid': 'supplier_bid',
    'supplier-invoice': 'invoice',
    'quantity-takeoff': 'quantity_takeoff',
    // Déjà correctes
    'dqe': 'dqe',
    'tender_estimate': 'tender_estimate',
    'supplier_bid': 'supplier_bid',
    'invoice': 'invoice',
    'quantity_takeoff': 'quantity_takeoff',
  };

  const result = mapping[routeContext];
  if (!result) {
    console.warn(`[useBoqDocumentHeaderHex] Unknown routeContext: ${routeContext}, falling back to 'dqe'`);
    return 'dqe';
  }
  return result;
}

let _service: DocumentHeaderServiceInstance | null = null;

function getDocumentHeaderService(): DocumentHeaderServiceInstance {
  if (!_service) {
    const repository = RepositoryFactory.getBoqDocumentHeaderRepository();
    _service = DocumentHeaderService.createInstance(repository);
  }
  return _service;
}

export function useBoqDocumentHeaderHex(
  documentId: string,
  /** routeContext (ex: 'project-dqe') ou BoqSource (ex: 'dqe') */
  routeContextOrSource: string
) {
  const [header, setHeader] = useState<DocumentPartiesValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Utilisation de useCurrentUserRoles() comme dans BoqActionsBar
  const { currentUser } = useCurrentUserRoles();

  // ✅ Service avec repository injecté
  const service = getDocumentHeaderService();

  // ✅ Normalisation — toujours un BoqSource valide
  const source = routeContextToBoqSource(routeContextOrSource);

  const loadHeader = useCallback(async () => {
    if (!documentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await service.findByDocumentId(documentId);
      setHeader(result ? DocumentHeaderTransformer.toUIValue(result) : null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de chargement de l\'en-tête';
      setError(message);
      console.error('[useBoqDocumentHeaderHex] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId, service]);

  const saveHeader = useCallback(async (value: DocumentPartiesValue) => {
    if (!documentId) {
      throw new Error('Document ID required to save header');
    }
    try {
      const headerDTO = DocumentHeaderTransformer.fromUIValue(value);
      // ✅ Récupération du userId comme dans BoqActionsBar
      const userId = (currentUser as { userId?: string; id?: string } | null)?.userId
        ?? (currentUser as { id?: string } | null)?.id;
      await service.save(documentId, headerDTO, source as any, userId);
      await loadHeader();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de sauvegarde de l\'en-tête';
      setError(message);
      throw err;
    }
  }, [documentId, source, currentUser, loadHeader, service]);

  const getDocumentHeaderDTO = useCallback(async (defaultValue?: DocumentPartiesValue) => {
    try {
      const dto = defaultValue ? DocumentHeaderTransformer.fromUIValue(defaultValue) : undefined;
      return service.getForDocument(documentId, dto);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de récupération de l\'en-tête';
      setError(message);
      throw err;
    }
  }, [documentId, service]);

  const updateWorkflowStage = useCallback(async (stage: string) => {
    try {
      await service.updateWorkflowStage(documentId, stage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour du workflow';
      setError(message);
      throw err;
    }
  }, [documentId, service]);

  const updateSignature = useCallback(async (signedBy: string, role: string) => {
    try {
      await service.updateSignature(documentId, signedBy, role);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de mise à jour de la signature';
      setError(message);
      throw err;
    }
  }, [documentId, service]);

  const reload = useCallback(async () => {
    await loadHeader();
  }, [loadHeader]);

  const reset = useCallback(() => {
    setHeader(null);
    setError(null);
    setLoading(false);
  }, []);

  // Chargement initial
  useEffect(() => {
    loadHeader();
  }, [loadHeader]);

  return {
    /** Les parties prenantes chargées depuis la base */
    header,
    /** Chargement en cours */
    loading,
    /** Erreur éventuelle */
    error,
    /** Sauvegarde les parties prenantes */
    saveHeader,
    /** Récupère le DocumentHeaderDTO pour PDF/Factur-X */
    getDocumentHeaderDTO,
    /** Met à jour le workflow stage */
    updateWorkflowStage,
    /** Met à jour la signature */
    updateSignature,
    /** Recharge les données */
    reload,
    /** Reset l'état */
    reset,
  };
}