import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Camera, FileBarChart, FileCheck, Building2, ClipboardList, Users, Gavel } from 'lucide-react';
import DocumentsList from '@/components/documents/DocumentsList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import SuppliersManagement from '@/components/documents/SuppliersManagement';
import TaskAssignments from '@/components/documents/TaskAssignments';
import EmployeeManagement from '@/components/documents/EmployeeManagement';
import DocumentViewer from '@/components/documents/DocumentViewer';
import TenderDocuments from '@/components/documents/TenderDocuments';
import TenderDocumentUploadForm from '@/components/documents/TenderDocumentUploadForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Documents = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get projects for tender documents
  const { data: projects } = useQuery({
    queryKey: ['projects-for-tender'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .order('title');
      
      if (error) throw error;
      return data || [];
    },
  });

  const documentTypes = [
    { id: 'inspection_report', label: 'Rapports d\'inspection', icon: FileText, color: 'text-blue-600' },
    { id: 'location_photo', label: 'Photos de localisation', icon: Camera, color: 'text-green-600' },
    { id: 'project_report', label: 'Rapports de projet', icon: FileBarChart, color: 'text-purple-600' },
    { id: 'contract', label: 'Contrats', icon: FileCheck, color: 'text-red-600' },
    { id: 'supplier_info', label: 'Informations fournisseurs', icon: Building2, color: 'text-orange-600' },
    { id: 'task_assignment', label: 'Affectations de tâches', icon: ClipboardList, color: 'text-indigo-600' },
    { id: 'employee_record', label: 'Dossiers employés', icon: Users, color: 'text-teal-600' },
    { id: 'tender_documents', label: 'Documents d\'appel d\'offres', icon: Gavel, color: 'text-amber-600' }
  ];

  const handleDocumentTypeClick = (documentType: string) => {
    if (documentType === 'tender_documents') {
      setActiveTab('tender');
      return;
    }
    
    // Navigate to documents tab with the specific type filter
    setActiveTab('documents');
    // Use URL search params to pass the filter
    const searchParams = new URLSearchParams();
    searchParams.set('type', documentType);
    navigate(`/documents?${searchParams.toString()}`, { replace: true });
  };

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setActiveTab('viewer');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-adrar-900 font-serif mb-2">
              Gestion des Documents
            </h1>
            <p className="text-gray-600">
              Gérez tous vos documents de projet, contrats, rapports et informations
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="tender">Appels d'offres</TabsTrigger>
                <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
                <TabsTrigger value="tasks">Tâches</TabsTrigger>
                <TabsTrigger value="employees">Employés</TabsTrigger>
                <TabsTrigger value="upload">Télécharger</TabsTrigger>
                {selectedDocument && <TabsTrigger value="viewer">Visionneuse</TabsTrigger>}
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
                            <IconComponent className={`h-6 w-6 ${type.color}`} />
                            <CardTitle className="text-sm font-medium">{type.label}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-xs">
                            Cliquez pour voir les documents de ce type
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
                    <CardTitle>Documents d'Appel d'Offres</CardTitle>
                    <CardDescription>
                      Sélectionnez un projet pour voir ses documents d'appel d'offres
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionner un projet..." />
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
                    <CardTitle>Ajouter un document d'appel d'offres</CardTitle>
                    <CardDescription>
                      Remplissez le formulaire pour ajouter un document lié à ce projet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TenderDocumentUploadForm projectId={selectedProjectId} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suppliers">
                <SuppliersManagement />
              </TabsContent>

              <TabsContent value="tasks">
                <TaskAssignments />
              </TabsContent>

              <TabsContent value="employees">
                <EmployeeManagement />
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
      
      <Footer />
    </div>
  );
};

export default Documents;
