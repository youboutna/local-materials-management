// @ts-nocheck
import BusinessDocuments from '@/components/documents/BusinessDocuments';
import { SupplierInspectionsList } from '@/components/supplier/SupplierInspectionsList';
import SupplierPaymentRequest from '@/components/suppliers/SupplierPaymentRequest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { useSupplierInspections } from '@/hooks/useSupplierInspections';
import { DocumentWithViewStatus, Supplier, SupplierNotification } from '@/dtos/entities/SupplierDTO';
import { CheckCircle, Clock, Download, Eye, FileText, LogIn, LogOut, MessageCircle, Plus, Send, Share2, Upload, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  useSupplierAuthHex,
  useSupplierProfileHex,
  useSupplierDocumentsHex,
  useSupplierSharedDocumentsHex,
  useSupplierTasksHex,
  useSupplierNotificationsHex,
  useSupplierPaymentRequestsHex,
  useSupplierParsedInvoicesHex,
  useUploadSupplierDocumentHex,
  useAddTaskCommentHex,
  useMarkTaskCompletedHex,
  type SupplierDocument,
  type SupplierTask,
  type PaymentRequest
} from '@/hooks/hexagonal'

const SupplierPortal = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [taskComment, setTaskComment] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [shareTargetEmail, setShareTargetEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('supplier_info');
  const { toast } = useToast();
  const { t } = useLanguage();
  const { uploadFile: storageUpload, uploading } = useDocumentStorage();
  
  // Use hexagonal hooks for supplier portal
  const {
    loginMutation,
    signUpMutation,
    logoutMutation,
    isLoggingIn,
    isSigningUp,
    isLoggingOut
  } = useSupplierAuthHex();
  
  // Get current user for profile fetching - using auth hook
  useEffect(() => {
    // This will be handled by the auth hooks in the login/signup flow
    // The profile will be fetched automatically when user is available
  }, []);
  
  const { data: supplierProfile } = useSupplierProfileHex(null); // Will be updated with user ID
  const { data: uploadedDocuments = [] } = useSupplierDocumentsHex(null, supplierProfile?.id || null, supplierProfile?.name || null);
  const { data: sharedDocuments = [] } = useSupplierSharedDocumentsHex(supplierProfile?.id || null);
  const { data: assignedTasks = [] } = useSupplierTasksHex(null, supplierProfile?.id || null);
  const { data: notifications = [] } = useSupplierNotificationsHex(supplierProfile?.id || null);
  const { data: paymentRequests = [] } = useSupplierPaymentRequestsHex(supplierProfile?.id || null);
  const { data: parsedInvoices = [] } = useSupplierParsedInvoicesHex(supplierProfile?.name || null);
  
  // Mutations
  const uploadDocumentMutation = useUploadSupplierDocumentHex();
  const addTaskCommentMutation = useAddTaskCommentHex();
  const markTaskCompletedMutation = useMarkTaskCompletedHex();
  
  // Use inspections hook with proper service layer
  const { 
    inspections, 
    loading: inspectionsLoading, 
    refetch: refetchInspections 
  } = useSupplierInspections(supplierProfile?.id || null);

  // Auth handlers
  const handleLogin = async () => {
    loginMutation({ email, password });
  };

  const handleSignUp = async () => {
    signUpMutation({ email, password });
  };

  const handleLogout = async () => {
    logoutMutation();
  };

  // File upload handler
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle || !supplierProfile?.id) return;
    
    try {
      await uploadDocumentMutation.mutateAsync({
        file: uploadFile,
        title: uploadTitle,
        description: uploadDescription,
        documentType,
        userId: supplierProfile.user_id || '',
        supplierId: supplierProfile.id
      });
      
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Task handlers
  const handleTaskComment = async (taskId: string) => {
    if (!taskComment.trim()) return;
    
    try {
      await addTaskCommentMutation.mutateAsync({
        taskId,
        comment: taskComment
      });
      
      setTaskComment('');
      setSelectedTaskId(null);
    } catch (error) {
      console.error('Task comment error:', error);
    }
  };

  const handleTaskCompletion = async (taskId: string) => {
    try {
      await markTaskCompletedMutation.mutateAsync({
        taskId,
        projectManagerId: 'project-manager-id' // Would be dynamic in real app
      });
      
      setSelectedTaskId(null);
    } catch (error) {
      console.error('Task completion error:', error);
    }
  };

  // Document sharing handler
  const handleDocumentShare = async () => {
    if (!shareTargetEmail || !shareMessage || !selectedDocumentForShare) return;
    
    // TODO: Implement document sharing logic
    toast({
      title: "Partage de document",
      description: "FonctionnalitÃ© de partage Ã  implÃ©menter",
    });
  };

  if (!supplierProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connexion Fournisseur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex-1"
              >
                {isLoggingIn ? 'Connexion...' : 'Se connecter'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="flex-1"
              >
                {isLoginMode ? "S'inscrire" : "Se connecter"}
              </Button>
            </div>
            {isLoginMode && (
              <Button 
                onClick={handleSignUp}
                disabled={isSigningUp}
                className="w-full mt-2"
              >
                {isSigningUp ? 'Inscription...' : "CrÃ©er un compte"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Portal Fournisseur</h1>
              <Badge className="ml-3">
                {supplierProfile.name}
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                DÃ©connexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="tasks">TÃ¢ches</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payments">Paiements</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents UploadÃ©s</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadedDocuments.length}</div>
                  <p className="text-gray-600">Documents uploadÃ©s</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>TÃ¢ches AssignÃ©es</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assignedTasks.length}</div>
                  <p className="text-gray-600">TÃ¢ches assignÃ©es</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  <p className="text-gray-600">Notifications</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Uploader un document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="uploadTitle">Titre</Label>
                    <Input
                      id="uploadTitle"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Titre du document"
                    />
                  </div>
                  <div>
                    <Label htmlFor="uploadDescription">Description</Label>
                    <Textarea
                      id="uploadDescription"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Description du document"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="uploadFile">Fichier</Label>
                    <Input
                      id="uploadFile"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <Button 
                    onClick={handleFileUpload}
                    disabled={uploadDocumentMutation.isPending || !uploadFile}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadDocumentMutation.isPending ? 'Upload...' : 'Uploader'}
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Documents UploadÃ©s</CardTitle>
                </CardHeader>
                <CardContent>
                  <BusinessDocuments documents={uploadedDocuments} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>TÃ¢ches AssignÃ©es</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedTasks.length === 0 ? (
                    <p className="text-gray-500">Aucune tÃ¢che assignÃ©e</p>
                  ) : (
                    assignedTasks.map((task) => (
                      <div key={task.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge>{task.status}</Badge>
                        </div>
                        {task.description && (
                          <p className="text-gray-600">{task.description}</p>
                        )}
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTaskId(task.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Commenter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTaskCompletion(task.id)}
                            disabled={task.status === 'completed'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {task.status === 'completed' ? 'ComplÃ©tÃ©' : 'Marquer complÃ©tÃ©'}
                          </Button>
                        </div>
                        {selectedTaskId === task.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded">
                            <Label htmlFor="taskComment">Ajouter un commentaire</Label>
                            <Textarea
                              id="taskComment"
                              value={taskComment}
                              onChange={(e) => setTaskComment(e.target.value)}
                              placeholder="Votre commentaire..."
                              rows={3}
                            />
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={() => handleTaskComment(task.id)}
                                disabled={addTaskCommentMutation.isPending}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                {addTaskCommentMutation.isPending ? 'Envoi...' : 'Envoyer'}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setSelectedTaskId(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-6">
            <SupplierInspectionsList 
              inspections={inspections} 
              loading={inspectionsLoading}
              refetch={refetchInspections}
            />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <p className="text-gray-500">Aucune notification</p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{notification.title}</h3>
                            <p className="text-gray-600">{notification.message}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(notification.sent_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge>{notification.type}</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <SupplierPaymentRequest paymentRequests={paymentRequests} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SupplierPortal;
