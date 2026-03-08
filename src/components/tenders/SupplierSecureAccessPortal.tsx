import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TenderSharingService } from '@/application/services/TenderSharingService';
import { ValidateSecretResponseDTO } from '@/dtos/entities/tender-sharing-dto';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Download, FileText, Lock, Shield } from 'lucide-react';
import { useState } from 'react';

interface ValidatedAccess {
  tenderId: string;
  secretCode: string;
  allowedDocuments?: string[];
}

export const SupplierSecureAccessPortal = () => {
  const [secretCode, setSecretCode] = useState('');
  const [validatedSecret, setValidatedSecret] = useState<ValidatedAccess | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Fetch tender and documents after validation
  const { data: tenderData, isLoading: tenderLoading } = useQuery({
    queryKey: ['tender-by-secret', validatedSecret?.tenderId],
    queryFn: async () => {
      if (!validatedSecret?.tenderId) return null;
      
      const { data, error } = await supabase
        .from('tenders')
        .select('*, project:projects(title, description)')
        .eq('id', validatedSecret.tenderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!validatedSecret?.tenderId
  });

  const { data: documents } = useQuery({
    queryKey: ['tender-documents', validatedSecret?.tenderId, validatedSecret?.allowedDocuments],
    queryFn: async () => {
      if (!validatedSecret?.tenderId) return [];
      
      let query = supabase
        .from('documents')
        .select('*')
        .or(`metadata->>'tender_id'.eq.${validatedSecret.tenderId},project_id.eq.${tenderData?.project_id}`)
        .eq('is_shared_with_suppliers', true);
      
      // Filter by allowed documents if specified
      if (validatedSecret.allowedDocuments && validatedSecret.allowedDocuments.length > 0) {
        query = query.in('id', validatedSecret.allowedDocuments);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!validatedSecret?.tenderId && !!tenderData
  });

  const handleValidateCode = async () => {
    if (!secretCode || secretCode.length < 8) {
      toast({
        title: t('common.error'),
        description: t('tenders.supplierSecure.invalid_code_desc'),
        variant: 'destructive'
      });
      return;
    }

    setIsValidating(true);
    try {
      const result: ValidateSecretResponseDTO = await TenderSharingService.validateSecret(secretCode.toUpperCase(), '');
      
      if (result.isValid && result.tenderId) {
        setValidatedSecret({
          tenderId: result.tenderId,
          secretCode: secretCode.toUpperCase(),
          allowedDocuments: result.allowedDocuments,
        });
        
        // Log access
        await TenderSharingService.logAccess({
          sharingSecretId: secretCode,
          actionType: 'view',
          accessedAt: new Date().toISOString(),
          accessedBy: null,
          sharedBy: null,
          metadata: { source: 'supplier_portal' }
        });

        toast({
          title: t('tenders.supplierSecure.validate_success'),
          description: result.message,
        });
      } else {
        toast({
          title: t('tenders.supplierSecure.validate_fail'),
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('tenders.supplierSecure.validate_error_desc'),
        variant: 'destructive'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownload = async (doc: { id: string; title: string; file_url: string }) => {
    if (!doc.file_url) return;
    
    // Log download action
    await TenderSharingService.logAccess({
      sharingSecretId: secretCode,
      actionType: 'download',
      accessedAt: new Date().toISOString(),
      accessedBy: null,
      sharedBy: null,
      accessedDocuments: [doc.id],
      metadata: { document_title: doc.title }
    });
    
    window.open(doc.file_url, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">{t('tenders.supplierSecure.title')}</h1>
        <p className="text-muted-foreground">{t('tenders.supplierSecure.subtitle')}</p>
      </div>

      {/* Code Input */}
      {!validatedSecret && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('tenders.supplierSecure.enter_code')}
            </CardTitle>
            <CardDescription>
              {t('tenders.supplierSecure.enter_code_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder={t('tenders.supplierSecure.code_placeholder')}
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-wider"
                maxLength={20}
              />
              <Button onClick={handleValidateCode} disabled={isValidating}>
                {isValidating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  t('tenders.supplierSecure.validate')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validated Content */}
      {validatedSecret && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">{t('tenders.supplierSecure.access_granted')}</h3>
                  <p className="text-sm text-green-600">{t('tenders.supplierSecure.access_granted_desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tender Info */}
          {tenderData && (
            <Card>
              <CardHeader>
                <CardTitle>{tenderData.title}</CardTitle>
                <CardDescription>{tenderData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge>{tenderData.status}</Badge>
                  <Badge variant="outline">{(tenderData as any).submission_type || tenderData.status}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('tenders.supplierSecure.documents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenderLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="grid gap-3">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{doc.title}</h3>
                              {doc.description && (
                                <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">{doc.document_type}</Badge>
                              </div>
                            </div>
                          </div>
                          {doc.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload({ id: doc.id, title: doc.title, file_url: doc.file_url! })}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              {t('common.download')}
                            </Button>
                          )}
                        </div>
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

          {/* Security Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">{t('tenders.supplierSecure.security_notice')}</h4>
                  <p className="text-sm text-amber-600 mt-1">
                    {t('tenders.supplierSecure.security_notice_desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SupplierSecureAccessPortal;
