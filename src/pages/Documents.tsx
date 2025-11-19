import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Camera,
  FileBarChart,
  FileCheck,
  Building2,
  ClipboardList,
  Users,
  Gavel,
} from "lucide-react";
import DocumentsList from "@/components/documents/DocumentsList";
import DocumentUpload from "@/components/documents/DocumentUpload";
import DocumentViewer from "@/components/documents/DocumentViewer";
import TenderDocuments from "@/components/documents/TenderDocuments";
import TenderDocumentUploadForm from "@/components/documents/TenderDocumentUploadForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

const Documents = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get projects for tender documents
  const { data: projects } = useQuery({
    queryKey: ["projects-for-tender"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
        .order("title");

      if (error) throw error;
      return data || [];
    },
  });

  const documentTypes = [
    {
      id: "inspection_report",
      label: t("documents.type.inspection_report"),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      id: "location_photo",
      label: t("documents.type.location_photo"),
      icon: Camera,
      color: "text-green-600",
    },
    {
      id: "project_report",
      label: t("documents.type.project_report"),
      icon: FileBarChart,
      color: "text-purple-600",
    },
    {
      id: "contract",
      label: t("documents.type.contract"),
      icon: FileCheck,
      color: "text-red-600",
    },
    {
      id: "supplier_info",
      label: t("documents.type.supplier_info"),
      icon: Building2,
      color: "text-orange-600",
    },
    {
      id: "task_assignment",
      label: t("documents.type.task_assignment"),
      icon: ClipboardList,
      color: "text-indigo-600",
    },
    {
      id: "employee_record",
      label: t("documents.type.employee_record"),
      icon: Users,
      color: "text-teal-600",
    },
    {
      id: "tender_documents",
      label: t("documents.type.tender_documents"),
      icon: Gavel,
      color: "text-amber-600",
    },
  ];

  const handleDocumentTypeClick = (documentType: string) => {
    if (documentType === "tender_documents") {
      setActiveTab("tender");
      return;
    }

    // Navigate to documents tab with the specific type filter
    setActiveTab("documents");
    // Use URL search params to pass the filter
    const searchParams = new URLSearchParams();
    searchParams.set("type", documentType);
    navigate(`/documents?${searchParams.toString()}`, { replace: true });
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setActiveTab("viewer");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-adrar-900 font-serif mb-2">
              {t("documents.title")}
            </h1>
            <p className="text-gray-600">{t("documents.subtitle")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                <TabsTrigger value="all">{t("documents.tabs.all")}</TabsTrigger>
                <TabsTrigger value="documents">
                  {t("documents.tabs.documents")}
                </TabsTrigger>
                <TabsTrigger value="tender">
                  {t("documents.tabs.tender")}
                </TabsTrigger>
                <TabsTrigger value="upload">
                  {t("documents.tabs.upload")}
                </TabsTrigger>
                {selectedDocument && (
                  <TabsTrigger value="viewer">
                    {t("documents.tabs.viewer")}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <Card
                        key={type.id}
                        className="hover:shadow-md transition-all cursor-pointer hover:scale-105 transform transition-transform duration-200"
                        onClick={() => handleDocumentTypeClick(type.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <IconComponent
                              className={`h-6 w-6 ${type.color}`}
                            />
                            <CardTitle className="text-sm font-medium">
                              {type.label}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            {t("documents.card.click_to_view")}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="documents">
                <DocumentsList onDocumentSelect={handleDocumentSelect} />
              </TabsContent>

              <TabsContent value="tender" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("documents.tender.title")}</CardTitle>
                    <CardDescription>
                      {t("documents.tender.select_project")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={selectedProjectId}
                      onValueChange={setSelectedProjectId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t(
                            "documents.tender.select_project_placeholder"
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {selectedProjectId && (
                  <TenderDocuments
                    projectId={selectedProjectId}
                    onDocumentSelect={handleDocumentSelect}
                  />
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>{t("documents.tender.add_title")}</CardTitle>
                    <CardDescription>
                      {t("documents.tender.add_description")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TenderDocumentUploadForm projectId={selectedProjectId} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upload">
                <DocumentUpload />
              </TabsContent>

              {selectedDocument && (
                <TabsContent value="viewer">
                  <DocumentViewer document={selectedDocument} />
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
