import { DocumentService, getDocumentService} from '@/application/services/DocumentService';
import { useDocumentViewer } from "@/components/documents/viewer";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { DocumentDTO } from '@/dtos/entities/DocumentDTO';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { format } from 'date-fns';
import { Calendar, Download, FileText, Plus, Tag, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface MaterialDocumentMetadata {
  materialId: string;
  documentNumber?: string;
  documentDate?: string;
  expiryDate?: string;
  supplierName?: string;
}

interface MaterialDocument {
  id: string;
  materialId: string;
  documentType: 'invoice' | 'delivery_note' | 'warranty' | 'certificate' | 'manual' | 'other';
  title: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  documentNumber?: string;
  documentDate?: string;
  expiryDate?: string;
  supplierName?: string;
  
  // Legacy snake_case for backward compatibility
  material_id?: string;
  document_type?: 'invoice' | 'delivery_note' | 'warranty' | 'certificate' | 'manual' | 'other';
  file_name?: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  document_number?: string;
  document_date?: string;
  expiry_date?: string;
  supplier_name?: string;
  
  metadata?: MaterialDocumentMetadata;
  tags?: string[];
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

interface MaterialDocumentsProps {
  materialId: string;
  readonly?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Facture', icon: FileText },
  { value: 'delivery_note', label: 'Bon de livraison', icon: FileText },
  { value: 'warranty', label: 'Garantie', icon: FileText },
  { value: 'certificate', label: 'Certificat', icon: FileText },
  { value: 'manual', label: 'Manuel', icon: FileText },
  { value: 'other', label: 'Autre', icon: FileText },
];

const MaterialDocuments: React.FC<MaterialDocumentsProps> = ({ materialId, readonly = false }) => {
  const { openDocument } = useDocumentViewer();
  const [documents, setDocuments] = useState<MaterialDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, uploading } = useDocumentStorage();

  const documentService = useMemo(() => 
    DocumentService.getDocumentService(), []);

  const [formData, setFormData] = useState({
    documentType: 'invoice' as MaterialDocument['documentType'],
    title: '',
    description: '',
    documentNumber: '',
    documentDate: '',
    expiryDate: '',
    supplierName: '',
    tags: '',
    
    // Legacy snake_case for backward compatibility
    document_type: 'invoice' as MaterialDocument['document_type'],
    document_number: '',
    document_date: '',
    expiry_date: '',
    supplier_name: '',
  });

  useEffect(() => {
    if (materialId) {
      fetchDocuments();
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]); // fetchDocuments is not included in the dependency array to avoid the temporal dead zone issue

  const fetchDocuments = useCallback(async () => {
    try {
      // Get all documents and filter those associated with this material
      const allDocs = await documentService.getAllDocuments();
      const materialDocs = allDocs.filter(doc => 
        doc.metadata && (doc.metadata as unknown as MaterialDocumentMetadata).materialId === materialId
      );
      
      // Map to MaterialDocument interface for backward compatibility
      const mappedDocs = materialDocs.map((doc: DocumentDTO) => {
        const metadata = (doc.metadata as unknown) as MaterialDocumentMetadata | undefined;
        return {
          id: doc.id,
          materialId: metadata?.materialId || materialId,
          documentType: doc.documentType as MaterialDocument['documentType'],
          title: doc.title,
          description: doc.description || undefined,
          fileName: doc.fileName || undefined,
          fileUrl: doc.fileUrl || undefined,
          fileSize: doc.fileSize || undefined,
          mimeType: doc.mimeType || undefined,
          documentNumber: metadata?.documentNumber,
          documentDate: metadata?.documentDate,
          expiryDate: metadata?.expiryDate,
          supplierName: metadata?.supplierName,
          
          // Legacy snake_case
          material_id: metadata?.materialId || materialId,
          document_type: doc.documentType as MaterialDocument['document_type'],
          file_name: doc.fileName || undefined,
          file_url: doc.fileUrl || undefined,
          file_size: doc.fileSize || undefined,
          mime_type: doc.mimeType || undefined,
          document_number: metadata?.documentNumber,
          document_date: metadata?.documentDate,
          expiry_date: metadata?.expiryDate,
          supplier_name: metadata?.supplierName,
          
          metadata: (doc.metadata as unknown) as MaterialDocumentMetadata | undefined,
          tags: doc.tags || [],
          uploaded_by: doc.uploadedBy,
          created_at: doc.createdAt || '',
          updated_at: doc.updatedAt || '',
        };
      });
      
      setDocuments(mappedDocs as any);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, [materialId, documentService]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-fill title from filename if empty
      if (!formData.title) {
        setFormData(prev => ({
          ...prev,
          title: file.name.split('.')[0]
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }

    try {
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = '';

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadFile(
          selectedFile, 
          `material-documents/${materialId}/${Date.now()}_${selectedFile.name}`
        );
        
        if (!uploadResult.success || !uploadResult.url) {
          toast.error('Erreur lors du téléchargement du fichier');
          return;
        }

        fileUrl = uploadResult.url;
        fileName = selectedFile.name;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      }

      // Parse tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Create material document using service - store material association in metadata
      const createDocumentDTO = {
        title: formData.title,
        description: formData.description || null,
        documentType: formData.documentType || formData.document_type,
        fileName: fileName || null,
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        tags: [...(tags.length > 0 ? tags : []), `material:${materialId}`],
        metadata: {
          materialId,
          documentNumber: formData.documentNumber || formData.document_number,
          documentDate: formData.documentDate || formData.document_date,
          expiryDate: formData.expiryDate || formData.expiry_date,
          supplierName: formData.supplierName || formData.supplier_name,
        },
      };

      const createdDocument = await documentService.createDocument({
        ...createDocumentDTO,
        category: createDocumentDTO.documentType || 'other',
        subcategory: '',
      } as any);
      if (!createdDocument) throw new Error('Failed to create document');

      toast.success('Document ajouté avec succès');
      setIsAddDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Erreur lors de l\'ajout du document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);

      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      documentType: 'invoice' as MaterialDocument['documentType'],
      title: '',
      description: '',
      documentNumber: '',
      documentDate: '',
      expiryDate: '',
      supplierName: '',
      tags: '',
      
      // Legacy snake_case for backward compatibility
      document_type: 'invoice' as MaterialDocument['document_type'],
      document_number: '',
      document_date: '',
      expiry_date: '',
      supplier_name: '',
    });
    setSelectedFile(null);
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Chargement des documents...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents du matériau ({documents.length})
          </CardTitle>
          {!readonly && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Ajouter un document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Ajouter un document</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_type">Type de document</Label>
                      <Select
                        value={formData.document_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value as MaterialDocument['document_type'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Titre du document"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du document"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_number">Numéro de document</Label>
                      <Input
                        id="document_number"
                        value={formData.document_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value }))}
                        placeholder="ex: FAC-2024-001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="supplier_name">Fournisseur</Label>
                      <Input
                        id="supplier_name"
                        value={formData.supplier_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document_date">Date du document</Label>
                      <Input
                        id="document_date"
                        type="date"
                        value={formData.document_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, document_date: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expiry_date">Date d'expiration</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="ex: garantie, important, certificat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Fichier</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Fichier sélectionné: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? 'Téléchargement...' : 'Ajouter'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun document associé à ce matériau</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{doc.title}</div>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                        )}
                        {doc.file_name && (
                          <p className="text-xs text-muted-foreground">
                            {doc.file_name} {doc.file_size && `(${formatFileSize(doc.file_size)})`}
                          </p>
                        )}
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {doc.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getDocumentTypeLabel(doc.document_type || 'other')}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.supplier_name || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {doc.document_date && (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(doc.document_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                        {doc.expiry_date && (
                          <div className="text-xs text-muted-foreground">
                            Expire: {format(new Date(doc.expiry_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {doc.file_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDocument(doc, { proxyMode: true, context: { materiau: materialId } })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {!readonly && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MaterialDocuments;