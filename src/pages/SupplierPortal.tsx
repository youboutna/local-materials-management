
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Download, Eye, LogIn, LogOut, User, Key, CheckCircle, MessageCircle, Clock, Send, Share2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Supplier, SupplierNotification, DocumentWithViewStatus } from '@/types/supplier';
import { DocumentType } from '@/types/document';
import BusinessDocuments from '@/components/documents/BusinessDocuments';
import SupplierPaymentRequest from '@/components/suppliers/SupplierPaymentRequest';

const SupplierPortal = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [supplierProfile, setSupplierProfile] = useState<Supplier | null>(null);
  const [sharedDocuments, setSharedDocuments] = useState<DocumentWithViewStatus[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<DocumentWithViewStatus[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [assignedTasks, setAssignedTasks] = useState<SupplierNotification[]>([]);
  const [taskComment, setTaskComment] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [shareTargetEmail, setShareTargetEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>('supplier_info');
  const { toast } = useToast();
  const { uploadFile: storageUpload, uploading } = useDocumentStorage();

  // Function to mark item as viewed (will be enabled when types are updated)
  const markAsViewed = async (itemId: string, itemType: 'document' | 'notification' | 'task') => {
    if (!user || !supplierProfile) return;

    try {
      // TODO: Implement once types are updated
      console.log(`Marking ${itemType} ${itemId} as viewed by supplier ${supplierProfile.id}`);
    } catch (error) {
      console.error('Error marking item as viewed:', error);
    }
  };

  // Authentication state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch supplier profile when user is authenticated
  useEffect(() => {
    if (user) {
      fetchSupplierProfile();
      fetchSharedDocuments();
      fetchUploadedDocuments();
      fetchAssignedTasks();
    }
  }, [user]);

  const fetchSupplierProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching supplier profile:', error);
    } else if (data) {
      setSupplierProfile(data as Supplier);
    } else {
      // No supplier profile found - create a default one
      await createSupplierProfile();
    }
  };

  const createSupplierProfile = async () => {
    if (!user) return;

    try {
      const defaultSupplierData = {
        user_id: user.id,
        name: user.email?.split('@')[0] || 'Fournisseur',
        email: user.email,
        contact_person: user.user_metadata?.full_name || 'Contact',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('suppliers')
        .insert(defaultSupplierData)
        .select()
        .single();

      if (error) {
        console.error('Error creating supplier profile:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de créer le profil fournisseur automatiquement. Contactez l\'administrateur.',
          variant: 'destructive',
        });
      } else {
        setSupplierProfile(data as Supplier);
        toast({
          title: 'Profil créé',
          description: 'Votre profil fournisseur a été créé automatiquement.',
        });
      }
    } catch (error) {
      console.error('Error creating supplier profile:', error);
    }
  };

  const fetchSharedDocuments = async () => {
    if (!user || !supplierProfile) return;

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        projects (title, status),
        payments (amount, payment_date)
      `)
      .or(`assigned_to.eq.${user.id},tags.cs.{${supplierProfile.name}}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shared documents:', error);
    } else {
      setSharedDocuments((data || []) as unknown as DocumentWithViewStatus[]);
    }
  };

  const fetchUploadedDocuments = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('uploaded_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching uploaded documents:', error);
    } else {
      setUploadedDocuments((data || []) as DocumentWithViewStatus[]);
    }
  };

  const fetchAssignedTasks = async () => {
    if (!user || !supplierProfile) return;

    const { data, error } = await supabase
      .from('supplier_notifications')
      .select('*')
      .eq('supplier_id', supplierProfile.id)
      .in('notification_type', ['task_assignment', 'task_notification'])
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned tasks:', error);
    } else {
      setAssignedTasks((data || []) as SupplierNotification[]);
    }
  };

  const handleTaskComment = async (taskId: string) => {
    if (!taskComment.trim() || !user) return;

    try {
      // Mark task as viewed when commenting
      await markAsViewed(taskId, 'task');
      
      const { error } = await supabase
        .from('supplier_notifications')
        .insert({
          supplier_id: supplierProfile?.id,
          task_id: taskId,
          notification_type: 'task_comment',
          email: user.email || '',
          metadata: { comment: taskComment, from_supplier: true }
        });

      if (error) throw error;

      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été envoyé",
      });

      setTaskComment('');
      setSelectedTaskId(null);
      fetchAssignedTasks();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTaskCompletion = async (taskId: string) => {
    if (!user) return;

    try {
      // Mark task as viewed when completing
      await markAsViewed(taskId, 'task');
      
      const { error } = await supabase
        .from('supplier_notifications')
        .insert({
          supplier_id: supplierProfile?.id,
          task_id: taskId,
          notification_type: 'task_completed',
          email: user.email || '',
          metadata: { status: 'completed', from_supplier: true }
        });

      if (error) throw error;

      toast({
        title: "Tâche marquée comme terminée",
        description: "Le chef de projet a été notifié",
      });

      fetchAssignedTasks();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        let errorMessage = 'Erreur de connexion';
        if (error.message === 'Invalid login credentials') {
          errorMessage = 'Email ou mot de passe incorrect';
        }
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur le portail fournisseur",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/supplier-portal`
        }
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Inscription réussie",
          description: "Vérifiez votre email pour confirmer votre compte",
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSupplierProfile(null);
      setSharedDocuments([]);
      setUploadedDocuments([]);
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté",
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !user) return;

    try {
      // Upload file to storage
      const uploadResult = await storageUpload(uploadFile, `supplier-uploads/${user.id}`);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save document record
      const { error } = await supabase
        .from('documents')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          file_url: uploadResult.url,
          file_name: uploadFile.name,
          mime_type: uploadFile.type,
          file_size: uploadFile.size,
          document_type: documentType as any,
          uploaded_by: user.id,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Document téléchargé",
        description: "Votre document a été téléchargé avec succès",
      });

      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      
      // Refresh documents
      fetchUploadedDocuments();
    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleInvoiceSubmission = async () => {
    if (!uploadFile || !uploadTitle.trim() || !user || !supplierProfile) return;

    try {
      // First, validate project status (inspection, insurance, banking guarantees)
      const statusCheck = await validateProjectStatus();
      if (!statusCheck.valid) {
        toast({
          title: "Vérification échouée",
          description: statusCheck.message,
          variant: "destructive"
        });
        return;
      }

      // Upload file to storage
      const uploadResult = await storageUpload(uploadFile, `supplier-invoices/${user.id}`);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Save document record as payment request
      const { error } = await supabase
        .from('documents')
        .insert({
          title: uploadTitle,
          description: uploadDescription,
          file_url: uploadResult.url,
          file_name: uploadFile.name,
          mime_type: uploadFile.type,
          file_size: uploadFile.size,
          document_type: 'supplier_info' as const,
          uploaded_by: user.id,
          status: 'pending_review',
          metadata: {
            supplier_id: supplierProfile.id,
            payment_request: true,
            submitted_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Create notification for project managers
      await supabase
        .from('notifications')
        .insert({
          title: "Nouvelle demande de paiement",
          message: `Demande de paiement soumise par ${supplierProfile.name}: ${uploadTitle}`,
          type: "payment_request",
          recipient_id: "00000000-0000-0000-0000-000000000000", // Admin notification
          metadata: {
            supplier_id: supplierProfile.id,
            supplier_name: supplierProfile.name,
            document_title: uploadTitle
          }
        });

      toast({
        title: "Demande soumise",
        description: "Votre demande de paiement a été soumise avec succès",
      });

      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');
      
      // Refresh documents
      fetchUploadedDocuments();
    } catch (error: any) {
      toast({
        title: "Erreur de soumission",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const validateProjectStatus = async () => {
    if (!supplierProfile) {
      return { valid: false, message: "Profil fournisseur introuvable" };
    }

    try {
      // Check active projects for this supplier
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, status')
        .contains('metadata', { supplier_id: supplierProfile.id })
        .eq('status', 'en_cours');

      if (!projects || projects.length === 0) {
        return { valid: false, message: "Aucun projet actif trouvé" };
      }

      // Check recent inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('*')
        .in('project_id', projects.map(p => p.id))
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .eq('status', 'approved');

      if (!inspections || inspections.length === 0) {
        return { valid: false, message: "Aucune inspection récente approuvée. Une inspection doit être effectuée avant le paiement." };
      }

      // Check insurance certificates
      const { data: insurance } = await supabase
        .from('insurance_certificates')
        .select('*')
        .in('project_id', projects.map(p => p.id))
        .eq('status', 'active')
        .gte('valid_until', new Date().toISOString());

      if (!insurance || insurance.length === 0) {
        return { valid: false, message: "Assurance expirée ou manquante. Renouvelez votre assurance avant de demander un paiement." };
      }

      // Check bank guarantees
      const { data: guarantees } = await supabase
        .from('bank_guarantees')
        .select('*')
        .in('project_id', projects.map(p => p.id))
        .eq('status', 'active')
        .gte('expiry_date', new Date().toISOString());

      if (!guarantees || guarantees.length === 0) {
        return { valid: false, message: "Garantie bancaire expirée ou manquante. Renouvelez vos garanties avant de demander un paiement." };
      }

      return { valid: true, message: "Tous les prérequis sont respectés" };

    } catch (error) {
      console.error('Status validation error:', error);
      return { valid: false, message: "Erreur lors de la vérification du statut" };
    }
  };

  const downloadDocument = async (document: any) => {
    if (document.file_url) {
      await markAsViewed(document.id, 'document');
      window.open(document.file_url, '_blank');
      // Refresh documents to update viewed status
      fetchSharedDocuments();
    }
  };

  const handleDocumentShare = async (documentId: string) => {
    if (!shareTargetEmail.trim() || !user || !supplierProfile) return;

    try {
      // Create notification for document sharing
      const { error } = await supabase
        .from('supplier_notifications')
        .insert({
          supplier_id: supplierProfile.id,
          notification_type: 'document_shared',
          email: shareTargetEmail,
          metadata: {
            document_id: documentId,
            shared_by: user.email,
            message: shareMessage,
            shared_at: new Date().toISOString()
          }
        });

      if (error) throw error;

      toast({
        title: "Document partagé",
        description: `Document partagé avec ${shareTargetEmail}`,
      });

      setShareTargetEmail('');
      setShareMessage('');
      setSelectedDocumentForShare(null);
    } catch (error: any) {
      toast({
        title: "Erreur de partage",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSendDocumentToManager = async (documentId: string, documentTitle: string) => {
    if (!user || !supplierProfile) return;

    try {
      // Create notification for project manager
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: "Nouveau document reçu du fournisseur",
          message: `Le fournisseur ${supplierProfile.name} a envoyé le document: ${documentTitle}`,
          type: "document_received",
          recipient_id: "00000000-0000-0000-0000-000000000000", // Admin notification
          metadata: {
            supplier_id: supplierProfile.id,
            supplier_name: supplierProfile.name,
            document_id: documentId,
            document_title: documentTitle
          }
        });

      if (error) throw error;

      toast({
        title: "Document envoyé",
        description: "Document envoyé au chef de projet",
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'envoi",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'inspection': 'Rapport d\'inspection',
      'payment': 'Document de paiement',
      'invoice': 'Facture',
      'delivery_note': 'Bon de livraison',
      'payment_receipt': 'Reçu de paiement',
      'technical': 'Document technique',
      'administrative': 'Document administratif',
      'supplier_upload': 'Document fournisseur'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Anonymous/Login view
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-primary">
              Portail Fournisseur
            </CardTitle>
            <p className="text-muted-foreground">
              Accédez à vos documents et gérez vos livraisons
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={isLoginMode ? "login" : "signup"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLoginMode(true)}
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsLoginMode(false)}
                >
                  Inscription
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  onClick={handleLogin} 
                  disabled={loading}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  onClick={handleSignUp} 
                  disabled={loading}
                  className="w-full"
                >
                  <User className="h-4 w-4 mr-2" />
                  S'inscrire
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Accès anonyme disponible pour consulter les documents publics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated supplier view
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Portail Fournisseur
            </h1>
            <p className="text-muted-foreground">
              Bienvenue {supplierProfile?.name || user.email}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="shared" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="shared">Documents Partagés</TabsTrigger>
            <TabsTrigger value="tasks">Mes Tâches</TabsTrigger>
            <TabsTrigger value="upload">Mes Documents</TabsTrigger>
            <TabsTrigger value="business">Documents Justificatifs</TabsTrigger>
            <TabsTrigger value="payments">Demandes de Paiement</TabsTrigger>
          </TabsList>

          <TabsContent value="shared">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents Partagés par le Chef de Projet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {sharedDocuments.length > 0 ? (
                    sharedDocuments.map((document) => (
                      <div key={document.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="font-medium">{document.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {document.description}
                              </p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline">
                                  {getDocumentTypeLabel(document.document_type)}
                                </Badge>
                                {document.projects && (
                                  <Badge variant="secondary">
                                    {document.projects.title}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                           <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(document)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadDocument(document)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDocumentForShare(
                                selectedDocumentForShare === document.id ? null : document.id
                              )}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Partager
                            </Button>
                           </div>
                        </div>
                        
                        {selectedDocumentForShare === document.id && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="share-email">Email du destinataire</Label>
                              <Input
                                id="share-email"
                                type="email"
                                value={shareTargetEmail}
                                onChange={(e) => setShareTargetEmail(e.target.value)}
                                placeholder="destinataire@email.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="share-message">Message (optionnel)</Label>
                              <Textarea
                                id="share-message"
                                value={shareMessage}
                                onChange={(e) => setShareMessage(e.target.value)}
                                placeholder="Ajouter un message..."
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleDocumentShare(document.id)}
                                disabled={!shareTargetEmail.trim()}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Partager
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedDocumentForShare(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun document partagé pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tâches Assignées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {assignedTasks.length > 0 ? (
                    assignedTasks.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Clock className="h-8 w-8 text-primary" />
                            <div>
                              <h3 className="font-medium">
                                {task.metadata?.title || `Tâche ${task.task_id || task.id}`}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {task.metadata?.description || 'Tâche assignée par le chef de projet'}
                              </p>
                               <p className="text-xs text-muted-foreground">
                                 {task.sent_at ? new Date(task.sent_at).toLocaleDateString('fr-FR') : 'Date non disponible'}
                               </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Commenter
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleTaskCompletion(task.task_id || task.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marquer terminé
                            </Button>
                          </div>
                        </div>
                        
                        {selectedTaskId === task.id && (
                          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                            <div className="space-y-3">
                              <div>
                                <Label htmlFor="task-comment">Votre commentaire</Label>
                                <Input
                                  id="task-comment"
                                  value={taskComment}
                                  onChange={(e) => setTaskComment(e.target.value)}
                                  placeholder="Ajouter un commentaire..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleTaskComment(task.task_id || task.id)}
                                  disabled={!taskComment.trim()}
                                >
                                  Envoyer commentaire
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTaskId(null)}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucune tâche assignée pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-6">
              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Télécharger un Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-title">Titre du document</Label>
                    <Input
                      id="upload-title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Titre du document"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-description">Description</Label>
                    <Input
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Description du document (optionnel)"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="document-type">Type de document</Label>
                    <Select value={documentType} onValueChange={(value) => setDocumentType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplier_info">Document fournisseur</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="delivery_note">Bon de livraison</SelectItem>
                        <SelectItem value="purchase_order">Bon de commande</SelectItem>
                        <SelectItem value="quote">Devis</SelectItem>
                        <SelectItem value="payment_receipt">Reçu de paiement</SelectItem>
                        <SelectItem value="technical">Document technique</SelectItem>
                        <SelectItem value="administrative">Document administratif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="upload-file">Fichier</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>
                  <Button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || !uploadTitle.trim() || uploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Téléchargement...' : 'Télécharger le Document'}
                  </Button>
                </CardContent>
              </Card>

              {/* Uploaded Documents */}
              <Card>
                <CardHeader>
                  <CardTitle>Mes Documents Téléchargés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {uploadedDocuments.length > 0 ? (
                      uploadedDocuments.map((document) => (
                        <div key={document.id} className="p-4 border rounded-lg bg-card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-primary" />
                              <div>
                                <h3 className="font-medium">{document.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {document.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : 'Date non disponible'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={document.status === 'approved' ? 'default' : 'secondary'}>
                                {document.status === 'approved' ? 'Approuvé' : 
                                 document.status === 'rejected' ? 'Rejeté' : 'En attente'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadDocument(document)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Télécharger
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSendDocumentToManager(document.id, document.title)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Envoyer au chef de projet
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun document téléchargé
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Documents Justificatifs et Factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessDocuments />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            {supplierProfile ? (
              <SupplierPaymentRequest supplierId={supplierProfile.id} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Création du profil fournisseur en cours...
                    </p>
                    <Button onClick={createSupplierProfile} variant="outline">
                      Créer un profil fournisseur
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplierPortal;
