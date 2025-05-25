
import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Camera, FileBarChart, FileCheck, Building2, ClipboardList, Users } from 'lucide-react';
import DocumentsList from '@/components/documents/DocumentsList';
import DocumentUpload from '@/components/documents/DocumentUpload';
import SuppliersManagement from '@/components/documents/SuppliersManagement';
import TaskAssignments from '@/components/documents/TaskAssignments';
import EmployeeManagement from '@/components/documents/EmployeeManagement';

const Documents = () => {
  const [activeTab, setActiveTab] = useState('all');

  const documentTypes = [
    { id: 'inspection_report', label: 'Rapports d\'inspection', icon: FileText, color: 'text-blue-600' },
    { id: 'location_photo', label: 'Photos de localisation', icon: Camera, color: 'text-green-600' },
    { id: 'project_report', label: 'Rapports de projet', icon: FileBarChart, color: 'text-purple-600' },
    { id: 'contract', label: 'Contrats', icon: FileCheck, color: 'text-red-600' },
    { id: 'supplier_info', label: 'Informations fournisseurs', icon: Building2, color: 'text-orange-600' },
    { id: 'task_assignment', label: 'Affectations de tâches', icon: ClipboardList, color: 'text-indigo-600' },
    { id: 'employee_record', label: 'Dossiers employés', icon: Users, color: 'text-teal-600' }
  ];

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
                <TabsTrigger value="suppliers">Fournisseurs</TabsTrigger>
                <TabsTrigger value="tasks">Tâches</TabsTrigger>
                <TabsTrigger value="employees">Employés</TabsTrigger>
                <TabsTrigger value="upload">Télécharger</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documentTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <Card key={type.id} className="hover:shadow-md transition-shadow cursor-pointer">
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
                <DocumentsList />
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
            </Tabs>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Documents;
