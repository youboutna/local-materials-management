import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, Search } from 'lucide-react';
import React, { useState } from 'react';

interface Document {
  id: string;
  title: string;
  description?: string | null;
  document_type: string;
  file_name?: string | null;
  file_size?: number | null;
  status?: string | null;
  created_at?: string | null;
  uploaded_by?: string | null;
}

interface DocumentSelectorProps {
  value?: string;
  onChange: (documentId: string | undefined, document?: Document) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  documentType?: 'inspection_report' | 'location_photo' | 'project_report' | 'contract' | 'supplier_info' | 'task_assignment' | 'employee_record' | 'tender';
  disabled?: boolean;
}

const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  value,
  onChange,
  placeholder = "Sélectionner un document",
  label = "Document",
  required = false,
  documentType,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', searchTerm, documentType],
    queryFn: async (): Promise<Document[]> => {
      // Use dynamic import to avoid top-level supabase import
      const { supabase } = await import('@/integrations/supabase/client');
      let query = supabase
        .from('documents')
        .select('id, title, description, document_type, file_name, file_size, status, created_at, uploaded_by')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,file_name.ilike.%${searchTerm}%`);
      }

      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).filter(d => d.id) as any[];
    },
  });

  const selectedDocument = documents?.find(d => d.id === value);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-2">
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un document..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : (
        <Select 
          value={value || ''} 
          onValueChange={(documentId) => {
            const document = documents?.find(d => d.id === documentId);
            onChange(documentId || undefined, document);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {documents?.map((document) => (
              <SelectItem key={document.id} value={document.id}>
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{document.title}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {document.document_type} • {document.file_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {document.status && (
                      <Badge variant="outline" className={`text-xs ${getStatusColor(document.status)}`}>
                        {document.status}
                      </Badge>
                    )}
                    {document.file_size && (
                      <span className="text-xs text-gray-500">
                        {formatFileSize(document.file_size)}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedDocument && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">Document sélectionné:</span>
            {selectedDocument.status && (
              <Badge variant="outline" className={getStatusColor(selectedDocument.status)}>
                {selectedDocument.status}
              </Badge>
            )}
          </div>
          <div>{selectedDocument.title}</div>
          <div className="text-gray-600">Type: {selectedDocument.document_type}</div>
          {selectedDocument.file_name && (
            <div className="text-gray-600">📎 {selectedDocument.file_name}</div>
          )}
          {selectedDocument.file_size && (
            <div className="text-gray-600">Taille: {formatFileSize(selectedDocument.file_size)}</div>
          )}
          {selectedDocument.created_at && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="h-3 w-3" />
              Créé le {formatDate(selectedDocument.created_at)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSelector;