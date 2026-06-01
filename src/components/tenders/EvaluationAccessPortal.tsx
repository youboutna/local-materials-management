/**
 * EvaluationAccessPortal
 * Thin wrapper around <SecretCodeAccessGate /> that delegates validation to
 * SubmissionSecretService, then renders the SubmissionEvaluationPanel.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { SubmissionSecretService } from '@/application/services/SubmissionSecretService';
import { SubmissionEvaluationPanel } from '@/components/tenders/SubmissionEvaluationPanel';
import { SecretCodeAccessGate, type GateValidationResult } from '@/components/access/SecretCodeAccessGate';

export const EvaluationAccessPortal: React.FC = () => {
  const handleValidate = async (code: string): Promise<GateValidationResult> => {
    const result = await SubmissionSecretService.validateSecret(code);
    if (result.is_valid && result.submission_id && result.tender_id) {
      // Track the access — best-effort only, never block the gate.
      try {
        await SubmissionSecretService.logAccess({
          submission_id: result.submission_id,
          action_type: 'view',
          accessed_sections: ['portal'],
          user_agent: navigator.userAgent,
        });
      } catch {
        /* noop */
      }
      return {
        isValid: true,
        message: result.message,
        payload: {
          submissionId: result.submission_id,
          tenderId: result.tender_id,
          supplierName: result.supplier_name,
        },
      };
    }
    return { isValid: false, message: result.message ?? 'Code invalide.' };
  };

  return (
    <SecretCodeAccessGate
      title="Accès Évaluation"
      subtitle="Portail sécurisé d'évaluation des soumissions"
      formTitle="Code Secret d'Accès"
      formDescription="Entrez le code secret fourni par le soumissionnaire"
      submitLabel="Valider le Code"
      onValidate={handleValidate}
      regulatoryNotice={
        <>
          <p className="font-medium text-amber-900">Accès Réglementé</p>
          <p>
            Cet accès est réservé aux membres autorisés de la commission d'évaluation.
            Toutes les actions sont tracées et auditées conformément aux réglementations
            mauritaniennes.
          </p>
        </>
      }
      renderUnlocked={(result, reset) => {
        const submissionId = result.payload?.submissionId as string;
        const tenderId = result.payload?.tenderId as string;
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-2xl font-bold">Commission d'Évaluation</h1>
                    <p className="text-sm text-muted-foreground">Accès sécurisé autorisé</p>
                  </div>
                </div>
                <Button variant="outline" onClick={reset}>
                  <Lock className="h-4 w-4 mr-2" />
                  Quitter
                </Button>
              </div>
              <SubmissionEvaluationPanel submissionId={submissionId} tenderId={tenderId} />
            </div>
          </div>
        );
      }}
    />
  );
};

export default EvaluationAccessPortal;
