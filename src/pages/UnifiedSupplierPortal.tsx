import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, Upload, Download, Eye, LogIn, LogOut, User, Key, CheckCircle, 
  MessageCircle, Clock, Send, Share2, Plus, Bell, DollarSign, Package, 
  TrendingUp, Calendar, AlertTriangle, ClipboardCheck, Search, Filter,
  Receipt, FileX, FileCheck, Building, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentStorage } from '@/hooks/useDocumentStorage';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { Supplier, SupplierNotification, DocumentWithViewStatus } from '@/types/supplier';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import SupplierPaymentRequest from '@/components/suppliers/SupplierPaymentRequest';
import EnhancedSupplierTenderPortal from '@/components/suppliers/EnhancedSupplierTenderPortal';
import { SupplierInspectionsList } from '@/components/supplier/SupplierInspectionsList';
import { useSupplierInspections } from '@/hooks/useSupplierInspections';

const UnifiedSupplierPortal = () => {
  const { t } = useLanguage();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [supplierProfile, setSupplierProfile] = useState<Supplier | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [documentType, setDocumentType] = useState<string>('supplier_info');
  const [taskComment, setTaskComment] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();
  const { uploadFile: storageUpload, uploading } = useDocumentStorage();

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
    }
  }, [user]);

  const fetchSupplierProfile = async () => {
    if (!user) return;
    
    // First try to find by user_id
    let { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // If no profile found by user_id, try to find by email and link it
    if (!data && user.email) {
      const { data: emailData, error: emailError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      
      if (emailData) {
        // Link the existing supplier to this user
        const { data: updatedData, error: updateError } = await supabase
          .from('suppliers')
          .update({ user_id: user.id })
          .eq('id', emailData.id)
          .select()
          .single();
        
        if (!updateError) {
          setSupplierProfile(updatedData as Supplier);
          toast({
            title: 'Profil lié',
            description: 'Votre profil fournisseur a été lié à votre compte.',
          });
          return;
        }
      }
    }
    
    if (data) {
      setSupplierProfile(data as Supplier);
    } else {
      throw new Error('User must be authenticated and autorized to supplier portal');
      //await createSupplierProfile();
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

      if (!error) {
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

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['supplier-notifications', supplierProfile?.id],
    enabled: !!supplierProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_notifications')
        .select('*')
        .eq('supplier_id', supplierProfile!.id)
        .order('sent_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch payment requests
  const { data: paymentRequests = [], refetch: refetchPaymentRequests } = useQuery({
    queryKey: ['supplier-payment-requests', supplierProfile?.id],
    enabled: !!supplierProfile?.id,
    queryFn: async () => {
      if (!supplierProfile?.id) return [];
      
      console.log('Fetching payment requests for supplier:', supplierProfile.id);
      
      // First try to get from supplier_payment_requests table
      const { data: directRequests, error: directError } = await supabase
        .from('supplier_payment_requests')
        .select('*')
        .eq('supplier_id', supplierProfile.id)
        .order('requested_date', { ascending: false });

      if (directError) {
        console.error('Error fetching direct payment requests:', directError);
      } else {
        console.log('Direct payment requests:', directRequests);
      }

      // Also get from notifications table (for historical requests)
      const { data: notificationRequests, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', supplierProfile.id)
        .eq('type', 'supplier_payment_request')
        .order('created_at', { ascending: false });

      if (notificationError) {
        console.error('Error fetching notification payment requests:', notificationError);
      } else {
        console.log('Notification payment requests:', notificationRequests);
      }

      // Combine both sources and transform notification data
      const combined = [
        ...(directRequests || []),
        ...(notificationRequests || []).map(notif => ({
          id: notif.id,
          supplier_id: supplierProfile.id,
          amount: (notif.metadata as any)?.amount || 0,
          description: (notif.metadata as any)?.description || notif.message,
          payment_reason: (notif.metadata as any)?.payment_reason || 'Non spécifié',
          status: (notif.metadata as any)?.status || 'pending',
          requested_date: notif.created_at,
          supporting_documents: (notif.metadata as any)?.supporting_documents || [],
          notes: (notif.metadata as any)?.notes,
          project_id: (notif.metadata as any)?.project_id,
          created_at: notif.created_at,
          updated_at: notif.updated_at
        }))
      ];

      console.log('Combined payment requests:', combined);
      return combined;
    }
  });

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['supplier-documents', user?.id, supplierProfile?.id],
    enabled: !!user?.id && !!supplierProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          projects!documents_project_id_fkey (title, status)
        `)
        .or(`assigned_to.eq.${user!.id},tags.cs.{${supplierProfile!.name}}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch parsed invoices
  const { data: parsedInvoices = [] } = useQuery({
    queryKey: ['parsed-invoices', supplierProfile?.id],
    enabled: !!supplierProfile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parsed_invoices')
        .select('*')
        .eq('supplier_info->supplier_id', supplierProfile!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch inspections with service layer (stakeholder-based)
  const { inspections: supplierInspections = [], loading: inspectionsLoading, refetch: refetchInspections } = useSupplierInspections(supplierProfile?.id || null);

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
      const uploadResult = await storageUpload(uploadFile, `supplier-uploads/${user.id}`);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

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
    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTaskComment = async (taskId: string) => {
    if (!taskComment.trim() || !user) return;

    try {
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPayments = paymentRequests.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending').length;
  const unreadNotifications = notifications.filter(n => !n.used_at).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <User className="h-6 w-6" />
              {isLoginMode ? 'Connexion Fournisseur' : 'Inscription Fournisseur'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
              />
            </div>
            <div>
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
              onClick={isLoginMode ? handleLogin : handleSignUp}
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Chargement...' : (isLoginMode ? 'Se connecter' : "S'inscrire")}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="w-full"
            >
              {isLoginMode ? "Pas de compte ? S'inscrire" : 'Déjà inscrit ? Se connecter'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
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
            <Button onClick={handleLogout} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paiements Total</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalPayments.toLocaleString()} MRU
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentRequests.length} demandes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <Bell className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{unreadNotifications}</div>
                <p className="text-xs text-muted-foreground">Non lues</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{documents.length}</div>
                <p className="text-xs text-muted-foreground">Disponibles</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="documents" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="upload">Télécharger</TabsTrigger>
              <TabsTrigger value="payments">Paiements</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="tasks">Tâches</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
            </TabsList>
            
            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents Partagés
                  </CardTitle>
                  
                  {/* Filters */}
                  <div className="flex gap-4 mt-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher des documents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="pending_review">En révision</SelectItem>
                        <SelectItem value="approved">Approuvé</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="purchase_order">Bon de commande</SelectItem>
                        <SelectItem value="inquiry">Demande</SelectItem>
                        <SelectItem value="contract">Contrat</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                        <SelectItem value="certificate">Certificat</SelectItem>
                        <SelectItem value="specification">Spécification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((document) => (
                        <div key={document.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <h3 className="font-medium">{document.title}</h3>
                                <p className="text-sm text-muted-foreground">{document.description}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {document.document_type}
                                  </Badge>
                                  {document.projects && (
                                    <Badge variant="secondary" className="text-xs">
                                      {document.projects.title}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={document.status === 'approved' ? 'default' : 'secondary'}
                                className={
                                  document.status === 'approved' 
                                    ? 'bg-green-100 text-green-800' 
                                    : document.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-orange-100 text-orange-800'
                                }
                              >
                                {document.status}
                              </Badge>
                              {document.file_url && (
                                <Button size="sm" variant="outline" asChild>
                                  <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Aucun document trouvé</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Télécharger un Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="upload-title">Titre du document</Label>
                    <Input
                      id="upload-title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Entrez le titre..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="document-type">Type de document</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="plan">Plan</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="invoice">Facture</SelectItem>
                        <SelectItem value="purchase_order">Bon de commande</SelectItem>
                        <SelectItem value="inquiry">Demande</SelectItem>
                        <SelectItem value="contract">Contrat</SelectItem>
                        <SelectItem value="report">Rapport</SelectItem>
                        <SelectItem value="certificate">Certificat</SelectItem>
                        <SelectItem value="specification">Spécification</SelectItem>
                        <SelectItem value="supplier_info">Informations fournisseur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="upload-description">Description</Label>
                    <Textarea
                      id="upload-description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Description optionnelle..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="upload-file">Fichier</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  </div>

                  <Button 
                    onClick={handleFileUpload}
                    disabled={uploading || !uploadFile || !uploadTitle.trim()}
                    className="w-full"
                  >
                    {uploading ? 'Téléchargement...' : 'Télécharger le document'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Requests Tab */}
            <TabsContent value="payments">
              <div className="space-y-6">
                {supplierProfile && (
                  <SupplierPaymentRequest supplierId={supplierProfile.id} />
                )}
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.used_at ? 'bg-muted/50' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">
                                {notification.notification_type}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {typeof notification.metadata === 'object' && notification.metadata && 'comment' in notification.metadata
                                  ? String(notification.metadata.comment)
                                  : ''}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.sent_at ? new Date(notification.sent_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                            {!notification.used_at && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Aucune notification</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Tâches Assignées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.filter(n => n.notification_type.includes('task')).length > 0 ? (
                      notifications.filter(n => n.notification_type.includes('task')).map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-card">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium">{task.notification_type}</h3>
                              <Badge variant="outline">
                                {typeof task.metadata === 'object' && task.metadata && 'status' in task.metadata 
                                  ? String(task.metadata.status) 
                                  : 'En cours'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {typeof task.metadata === 'object' && task.metadata && 'comment' in task.metadata 
                                ? String(task.metadata.comment) 
                                : 'Aucune description'}
                            </p>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Commenter
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleTaskCompletion(task.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Marquer terminé
                              </Button>
                            </div>
                            
                            {selectedTaskId === task.id && (
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  value={taskComment}
                                  onChange={(e) => setTaskComment(e.target.value)}
                                  placeholder="Ajouter un commentaire..."
                                  rows={3}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleTaskComment(task.id)}
                                  disabled={!taskComment.trim()}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Envoyer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Aucune tâche assignée</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections">
              <SupplierInspectionsList 
                inspections={supplierInspections}
                loading={inspectionsLoading}
                supplierId={supplierProfile?.id}
                onInspectionUpdated={refetchInspections}
              />
            </TabsContent>

            {/* Parsed Invoices Tab */}
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Factures Analysées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {parsedInvoices.length > 0 ? (
                      parsedInvoices.map((invoice) => (
                        <div key={invoice.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium">
                                Facture #{invoice.invoice_number || 'N/A'}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Fichier: {invoice.file_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Montant total: {invoice.total_amount?.toLocaleString()} MRU
                              </p>
                              {invoice.tax_amount && (
                                <p className="text-sm text-muted-foreground">
                                  TVA: {invoice.tax_amount.toLocaleString()} MRU
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                              </p>
                            </div>
                            <Badge 
                              variant={invoice.parsing_status === 'completed' ? 'default' : 'secondary'}
                              className={
                                invoice.parsing_status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : invoice.parsing_status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {invoice.parsing_status}
                            </Badge>
                          </div>
                          
                          {invoice.items && (
                            <div className="mt-3">
                              <h4 className="font-medium mb-2">Articles:</h4>
                              <div className="space-y-1">
                                {Array.isArray(invoice.items) && invoice.items.map((item: any, index: number) => (
                                  <div key={index} className="text-sm bg-muted p-2 rounded">
                                    <span className="font-medium">{item.description || item.name}</span>
                                    {item.quantity && <span> - Qté: {item.quantity}</span>}
                                    {item.unit_price && <span> - Prix: {item.unit_price} MRU</span>}
                                    {item.total && <span> - Total: {item.total} MRU</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {invoice.parsing_errors && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm text-red-600">
                                Erreur d'analyse: {invoice.parsing_errors}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Aucune facture analysée</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

    </div>
  );
};

export default UnifiedSupplierPortal;


