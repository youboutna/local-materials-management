import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useAuth } from '@/contexts/use-auth';
import type { SupplierDTO as Supplier } from '@/dtos/entities/SupplierDTO';
import { getDocumentService } from '@/application/services/DocumentService';

interface SupplierDocumentUploadProps {
  supplier: Supplier;
  onSuccess?: () => void;
}

const SupplierDocumentUpload = ({ supplier, onSuccess }: SupplierDocumentUploadProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'supplier_catalog' as const,
    status: 'approved' as const
  });
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { uploadFile, uploading } = useDocumentStorage();
  const { user } = useAuth();

  const uploadMutation = useMutation({
    mutationFn: async (uploadData: typeof formData & { file?: File }) => {
      if (!user) {
        throw new Error('User must be authenticated to upload documents');
      }

      let fileUrl: string | null = null;
      let uploadedFileName: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;

      if (uploadData.file) {
        const uploadResult = await uploadFile(uploadData.file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        
        fileUrl = uploadResult.url || null;
        uploadedFileName = uploadResult.fileName || uploadData.file.name;
        fileSize = uploadResult.size || uploadData.file.size;
        mimeType = uploadData.file.type;
      }

      // ✅ Hexagonal: UI → Service → Repository → Adapter → DB
      return await getDocumentService().createDocument({
        title: uploadData.title,
        description: uploadData.description || null,
        documentType: uploadData.document_type,
        supplierId: supplier.id,
        status: uploadData.status,
        fileUrl,
        fileName: uploadedFileName,
        fileSize,
        mimeType,
        uploadedBy: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-documents', supplier.id] });
      toast({
        title: "Succès",
        description: "Document téléversé avec succès.",
      });

      setFormData({
        title: '',
        description: '',
        document_type: 'supplier_catalog',
        status: 'approved'
      });
      setFile(null);
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !file) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le titre et sélectionner un fichier.",
        variant: "destructive"
      });
      return;
    }

    await uploadMutation.mutateAsync({ ...formData, file });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ex: Catalogue produits 2024"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document_type">Type de Document</Label>
          <Select value={formData.document_type} onValueChange={(value) => handleInputChange('document_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="supplier_catalog">Catalogue</SelectItem>
              <SelectItem value="supplier_info">Information fournisseur</SelectItem>
              <SelectItem value="contract">Contrat</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Description du document"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">Fichier *</Label>
        <div className="flex items-center space-x-4">
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="flex-1"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            required
          />
          {file && (
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              {file.name}
            </div>
          )}
        </div>
      </div>

      <Button type="submit" disabled={uploading || uploadMutation.isPending} className="w-full">
        {uploading || uploadMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Téléchargement en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Téléverser le Document
          </>
        )}
      </Button>
    </form>
  );
};

export default SupplierDocumentUpload;
