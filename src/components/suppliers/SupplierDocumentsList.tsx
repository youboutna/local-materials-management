import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupplierDocumentsHex } from '@/hooks/hexagonal'
import type { Supplier } from '@/types/supplier';
import type { SupplierDocument } from '@/hooks/hexagonal';

interface SupplierDocumentsListProps {
  supplier: Supplier;
}

const SupplierDocumentsList = ({ supplier }: SupplierDocumentsListProps) => {
  const { toast } = useToast();
  const { data: documents, isLoading } = useSupplierDocumentsHex(supplier.id);

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'supplier_catalog': 'Catalogue',
      'supplier_info': 'Information fournisseur',
      'contract': 'Contrat',
      'other': 'Autre'
    };
    return types[type] || type;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (doc: SupplierDocument) => {
    if (!doc.file_url) {
      toast({
        title: "Erreur",
        description: "Aucun fichier disponible pour ce document.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = doc.file_name || 'document';
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      globalThis.document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de tÃ©lÃ©charger le fichier.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucun document tÃ©lÃ©versÃ©</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">{doc.title}</h4>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getDocumentTypeLabel(doc.document_type)}
                    </Badge>
                    {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                    <span>{new Date(doc.created_at || '').toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2">
                {doc.file_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {doc.file_url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(doc.file_url!, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {doc.description && (
              <p className="text-sm text-muted-foreground mt-2 ml-8">
                {doc.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SupplierDocumentsList;
