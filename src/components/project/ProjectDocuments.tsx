import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Search,
  Filter,
  File,
  Image,
  FileBarChart,
} from "lucide-react";
import { useDocumentsHex } from "@/hooks/hexagonal";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { DocumentService } from "@/application/services/DocumentService";

import { ProjectDocument } from '@/dtos/entities/DocumentDTO';
interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const { t } = useLanguage();

  const { documents: rawDocuments, isLoading: loading, refetch: fetchDocuments } = useDocumentsHex({ projectId });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    description: "",
    document_type: "project_report",
    file: null as File | null,
  });

  // Transform documents to expected format
  const documents: ProjectDocument[] = (rawDocuments || []).map((doc: any) => ({
    id: doc.id,
    description: doc.description || undefined,
    file_name: doc.file_name || undefined,
    file_url: doc.file_url || undefined,
    mime_type: doc.mime_type || undefined,
    file_size: doc.file_size || undefined,
    document_type: doc.document_type,
    status: doc.status || "draft",
    created_at: doc.created_at || new Date().toISOString(),
    tags: doc.tags || undefined,
  }));

  const documentTypes = [
    {
      value: "project_report",
      label: t("documents.type.project_report"),
      icon: FileBarChart,
    },
    { value: "contract", label: t("documents.type.contract"), icon: FileText },
    {
      value: "inspection_report",
      label: t("documents.type.inspection_report"),
      icon: FileText,
    },
    {
      value: "location_photo",
      label: t("documents.type.location_photo"),
      icon: Image,
    },
    {
      value: "supplier_info",
      label: t("documents.type.supplier_info"),
      icon: FileText,
    },
    {
      value: "task_assignment",
      label: t("documents.type.task_assignment"),
      icon: FileText,
    },
    {
      value: "employee_record",
      label: t("documents.type.employee_record"),
      icon: File,
    },
  ];

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadData.file) {
      toast({
        title: t("error.title"),
        description: t("error.select_file"),
        variant: "destructive",
      });
      return;
    }

    try {
      const documentService = DocumentService.getDocumentService();
      const docPayload = {
        projectId: projectId,
        phaseId: undefined,
        inspectionId: undefined,
        paymentId: undefined,
        supplierId: undefined,
        title: uploadData.file.name,
        description: uploadData.description,
        documentType: uploadData.document_type as any,
        status: 'draft' as any,
        fileName: uploadData.file.name,
        fileUrl: undefined,
        fileSize: uploadData.file.size,
        mimeType: uploadData.file.type,
        tags: [],
      } as any;
      await documentService.createDocument(docPayload);

      toast({
        title: t("success.title"),
        description: t("success.add_document"),
      });

      setIsUploadDialogOpen(false);
      setUploadData({
        description: "",
        document_type: "project_report",
        file: null,
      });
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: t("error.title"),
        description: t("error.add_document"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(t("confirm.delete_document"))) return;

    try {
      const documentService = DocumentService.getDocumentService();
      await documentService.deleteDocument(documentId);
      toast({
        title: t("success.title"),
        description: t("success.delete_document"),
      });
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: t("error.title"),
        description: t("error.delete_document"),
        variant: "destructive",
      });
    }
  };

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType ? docType.icon : File;
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find((dt) => dt.value === type);
    return docType ? docType.label : t("documents.type.other") || "Autre";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return t("documents.size.unknown");
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;
    const matchesFilter =
      filterType === "all" || doc.document_type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-adrar-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("documents.title")}
            </CardTitle>
            <Dialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("documents.tabs.upload")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("documents.tender.add_title")}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      {t("tender.input.description")}
                    </label>
                    <Textarea
                      value={uploadData.description}
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          description: e.target.value,
                        })
                      }
                      placeholder={t("tender.input.description")}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t("documents.type.project_report")}
                    </label>
                    <Select
                      value={uploadData.document_type}
                      onValueChange={(value) =>
                        setUploadData({ ...uploadData, document_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {t("documents.type.contract")}
                    </label>
                    <Input
                      type="file"
                      onChange={(e) =>
                        setUploadData({
                          ...uploadData,
                          file: e.target.files?.[0] || null,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      {t("project_create.cancel")}
                    </Button>
                    <Button type="submit">{t("documents.tabs.upload")}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("projects.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t("documents.tabs.documents")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("documents.tabs.all")}</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0
                ? t("documents.tabs.documents")
                : t("documents.tabs.documents")}
            </h3>
            <p className="text-gray-600 mb-4">
              {documents.length === 0
                ? t("documents.tender.add_description")
                : t("projects.empty")}
            </p>
            {documents.length === 0 && (
              <Dialog
                open={isUploadDialogOpen}
                onOpenChange={setIsUploadDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("documents.tabs.upload")}
                  </Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const IconComponent = getDocumentIcon(doc.document_type);
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <IconComponent className="h-6 w-6 text-adrar-600 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {doc.file_name || t("documents.tabs.documents")}
                          </h3>
                          {doc.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {getDocumentTypeLabel(doc.document_type)}
                      </Badge>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-500">
                      {doc.file_name && (
                        <div className="flex justify-between">
                          <span>{t("documents.tabs.documents")}:</span>
                          <span className="truncate ml-2">{doc.file_name}</span>
                        </div>
                      )}
                      {doc.file_size && (
                        <div className="flex justify-between">
                          <span>{t("materials.price")}:</span>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{t("project_create.start_date")}:</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                       <Button variant="outline" size="sm" className="flex-1" asChild>
                         <Link to={`/documents?project=${projectId}&document=${doc.id}&view=true`}>
                           <Eye className="mr-1 h-3 w-3" />
                           {t("documents.tabs.viewer")}
                         </Link>
                       </Button>
                       <Button variant="outline" size="sm" className="flex-1" asChild>
                         <Link to={`/documents?project=${projectId}&action=upload`}>
                           <Download className="mr-1 h-3 w-3" />
                           {t("documents.tabs.upload")}
                         </Link>
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectDocuments;