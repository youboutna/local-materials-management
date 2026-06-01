/**
 * SupplierSecureAccessPortal
 * Thin wrapper around <SecretCodeAccessGate /> for supplier document access.
 * No direct supabase.from() — all data goes through TenderService /
 * TenderSharingService.
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { TenderSharingService } from '@/application/services/TenderSharingService';
import { TenderService } from '@/application/services/TenderService';
import { TenderTransformer } from '@/dtos/transforms/TenderTransformer';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Download, FileText, Lock } from 'lucide-react';
import {
  SecretCodeAccessGate,
  type GateValidationResult,
} from '@/components/access/SecretCodeAccessGate';

interface UnlockedPayload {
  tenderId: string;
  secretCode: string;
  allowedDocuments?: string[];
}

const UnlockedView: React.FC<{ payload: UnlockedPayload; onReset: () => void }> = ({
  payload,
  onReset,
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const { data: tenderDTO, isLoading: tenderLoading } = useQuery({
    queryKey: ['tender-by-secret', payload.tenderId],
    queryFn: async () => {
      const service = new TenderService();
      const tender = await service.getTenderById({ id: payload.tenderId });
      return tender ? TenderTransformer.toDTO(tender) : null;
    },
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['shared-documents', payload.tenderId, payload.allowedDocuments],
    queryFn: () =>
      TenderSharingService.getSharedDocuments(payload.tenderId, payload.allowedDocuments),
  });

  const handleDownload = async (doc: { id: string; title: string; file_url?: string | null }) => {
    if (!doc.file_url) return;
    try {
      await TenderSharingService.logAccess({
        sharingSecretId: payload.secretCode,
        actionType: 'download',
        accessedAt: new Date().toISOString(),
        accessedBy: null,
        sharedBy: null,
        accessedDocuments: [doc.id],
        metadata: { document_title: doc.title },
      });
    } catch {
      /* tracking is best-effort */
    }
    window.open(doc.file_url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h2 className="text-xl font-semibold">{t('tenders.supplierSecure.access_granted')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('tenders.supplierSecure.access_granted_desc')}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onReset}>
          <Lock className="h-4 w-4 mr-2" />
          {t('common.close') ?? 'Quitter'}
        </Button>
      </div>

      {tenderLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </CardContent>
        </Card>
      ) : tenderDTO ? (
        <Card>
          <CardHeader>
            <CardTitle>{tenderDTO.title}</CardTitle>
            <CardDescription>{tenderDTO.description ?? ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge>{tenderDTO.status}</Badge>
              {tenderDTO.marketType && <Badge variant="outline">{tenderDTO.marketType}</Badge>}
              {tenderDTO.selectionMode && (
                <Badge variant="outline">{tenderDTO.selectionMode}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('tenders.supplierSecure.documents')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : documents.length > 0 ? (
            <div className="grid gap-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                        )}
                        {doc.document_type && (
                          <Badge variant="outline" className="mt-2">
                            {doc.document_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {doc.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload({ id: doc.id, title: doc.title, file_url: doc.file_url })
                        }
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('common.download')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('tenders.supplierSecure.no_documents')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">
              {t('tenders.supplierSecure.security_notice')}
            </h4>
            <p className="text-sm text-amber-600 mt-1">
              {t('tenders.supplierSecure.security_notice_desc')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const SupplierSecureAccessPortal: React.FC = () => {
  const { t } = useLanguage();

  const handleValidate = async (code: string): Promise<GateValidationResult> => {
    const result = await TenderSharingService.validateSecret(code, '');
    if (result.isValid && result.tenderId) {
      try {
        await TenderSharingService.logAccess({
          sharingSecretId: code,
          actionType: 'view',
          accessedAt: new Date().toISOString(),
          accessedBy: null,
          sharedBy: null,
          metadata: { source: 'supplier_portal' },
        });
      } catch {
        /* noop */
      }
      return {
        isValid: true,
        message: result.message,
        payload: {
          tenderId: result.tenderId,
          secretCode: code,
          allowedDocuments: result.allowedDocuments,
        },
      };
    }
    return { isValid: false, message: result.message ?? 'Code invalide.' };
  };

  return (
    <SecretCodeAccessGate
      title={t('tenders.supplierSecure.title')}
      subtitle={t('tenders.supplierSecure.subtitle')}
      formTitle={t('tenders.supplierSecure.enter_code')}
      formDescription={t('tenders.supplierSecure.enter_code_desc')}
      placeholder={t('tenders.supplierSecure.code_placeholder')}
      submitLabel={t('tenders.supplierSecure.validate')}
      onValidate={handleValidate}
      renderUnlocked={(result, reset) => (
        <UnlockedView payload={result.payload as unknown as UnlockedPayload} onReset={reset} />
      )}
    />
  );
};

export default SupplierSecureAccessPortal;
