import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  Download,
  Bell,
  TrendingUp,
  Calendar,
  Package
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Submission {
  id: string;
  tender_id: string;
  supplier_name: string;
  supplier_email: string;
  submission_date: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  secret_code?: string;
  created_at: string;
  updated_at: string;
  tender?: {
    title: string;
    deadline_date?: string;
  };
}

interface SubmissionDocument {
  id: string;
  submission_id: string;
  document_id: string;
  category: string;
  subcategory: string;
  created_at: string;
  document?: {
    title: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    file_url: string;
    metadata?: any;
  };
}

interface ActivityLog {
  id: string;
  submission_id: string;
  action: string;
  details: string;
  created_at: string;
}

const SupplierSubmissionDashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [realtimeSubmissions, setRealtimeSubmissions] = useState<Submission[]>([]);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  // Fetch user's submissions
  const { data: submissions, refetch } = useQuery({
    queryKey: ['supplier-submissions', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('tender_submissions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch tender titles separately
      const enrichedData = await Promise.all((data || []).map(async (submission: any) => {
        const { data: tender } = await supabase
          .from('tenders')
          .select('title, deadline_date')
          .eq('id', submission.tender_id)
          .single();
        
        return {
          ...submission,
          tender: tender || undefined
        };
      }));

      return enrichedData as Submission[];
    },
    enabled: !!currentUser?.id
  });

  // Fetch documents for selected submission
  const { data: submissionDocuments } = useQuery({
    queryKey: ['submission-documents', selectedSubmission?.id],
    queryFn: async () => {
      if (!selectedSubmission?.id) return [];

      const { data, error } = await supabase
        .from('tender_submission_documents')
        .select(`
          *,
          document:documents(*)
        `)
        .eq('submission_id', selectedSubmission.id);

      if (error) throw error;
      return data as SubmissionDocument[];
    },
    enabled: !!selectedSubmission?.id
  });

  // Fetch activity logs for selected submission
  const { data: activityLogs } = useQuery({
    queryKey: ['submission-activity', selectedSubmission?.id],
    queryFn: async () => {
      if (!selectedSubmission?.id) return [];

      // Direct query with type suppression
      const { data, error } = await (supabase as any)
        .from('submission_activity_logs')
        .select('*')
        .eq('submission_id', selectedSubmission.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
      }
      return (data || []) as ActivityLog[];
    },
    enabled: !!selectedSubmission?.id
  });

  // Setup real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    console.log('Setting up realtime subscription for user:', currentUser.id);

    const channel = supabase
      .channel('submission-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tender_submissions',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nouvelle soumission",
              description: "Votre soumission a été enregistrée avec succès.",
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any).status;
            const oldStatus = (payload.old as any)?.status;
            
            if (newStatus !== oldStatus) {
              toast({
                title: "Mise à jour du statut",
                description: `Le statut de votre soumission a changé: ${getStatusLabel(newStatus)}`,
              });
            }
          }

          refetch();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refetch, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvée';
      case 'rejected':
        return 'Rejetée';
      case 'under_review':
        return 'En cours d\'évaluation';
      case 'submitted':
        return 'Soumise';
      default:
        return status;
    }
  };

  const filterSubmissions = (status?: string) => {
    if (!submissions) return [];
    if (status === 'all') return submissions;
    return submissions.filter(s => s.status === status);
  };

  const getValidationStatus = (document: any) => {
    const validationResult = document?.metadata?.validation_result;
    if (!validationResult) return null;

    if (!validationResult.is_valid) {
      return { icon: <XCircle className="h-4 w-4" />, color: 'text-red-600', label: 'Invalide' };
    }
    if (validationResult.warnings?.length > 0) {
      return { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-yellow-600', label: 'Avertissements' };
    }
    return { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600', label: 'Valide' };
  };

  const handleDownloadDocument = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive"
      });
    }
  };

  const stats = {
    total: submissions?.length || 0,
    submitted: submissions?.filter(s => s.status === 'submitted').length || 0,
    under_review: submissions?.filter(s => s.status === 'under_review').length || 0,
    approved: submissions?.filter(s => s.status === 'approved').length || 0,
    rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Tableau de Bord des Soumissions
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivez l'état de vos soumissions en temps réel
            </p>
          </div>
          <Badge variant="outline" className="px-3 py-1 gap-1">
            <Bell className="h-3 w-3" />
            Notifications actives
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Soumises</p>
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En évaluation</p>
                  <p className="text-2xl font-bold">{stats.under_review}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approuvées</p>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejetées</p>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submissions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mes Soumissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">Toutes</TabsTrigger>
                  <TabsTrigger value="submitted">Soumises</TabsTrigger>
                  <TabsTrigger value="under_review">En cours</TabsTrigger>
                  <TabsTrigger value="approved">Approuvées</TabsTrigger>
                  <TabsTrigger value="rejected">Rejetées</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-3">
                      {filterSubmissions(activeTab).map((submission) => (
                        <Card
                          key={submission.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedSubmission?.id === submission.id ? 'border-primary shadow-md' : ''
                          }`}
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium mb-1">
                                  {submission.tender?.title || 'Appel d\'offres'}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {submission.supplier_name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  Soumis {formatDistanceToNow(new Date(submission.submission_date), { addSuffix: true, locale: fr })}
                                </div>
                              </div>
                              <Badge className={getStatusColor(submission.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(submission.status)}
                                  {getStatusLabel(submission.status)}
                                </div>
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {filterSubmissions(activeTab).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucune soumission trouvée</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Details Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Détails
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSubmission ? (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {/* Submission Info */}
                    <div>
                      <h4 className="font-medium mb-3">Informations</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Appel d'offres:</span>
                          <span className="font-medium">{selectedSubmission.tender?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Statut:</span>
                          <Badge className={getStatusColor(selectedSubmission.status)}>
                            {getStatusLabel(selectedSubmission.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(selectedSubmission.submission_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {selectedSubmission.secret_code && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Code secret:</span>
                            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                              {selectedSubmission.secret_code}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h4 className="font-medium mb-3">Documents ({submissionDocuments?.length || 0})</h4>
                      <div className="space-y-2">
                        {submissionDocuments?.map((doc) => {
                          const validation = getValidationStatus(doc.document);
                          return (
                            <div key={doc.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{doc.document?.title || doc.document?.file_name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{doc.category} - {doc.subcategory}</p>
                                </div>
                                {validation && (
                                  <Badge variant="outline" className={`${validation.color} text-xs`}>
                                    <div className="flex items-center gap-1">
                                      {validation.icon}
                                      {validation.label}
                                    </div>
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => doc.document?.file_url && handleDownloadDocument(doc.document.file_url, doc.document.file_name)}
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Télécharger
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Activity Log */}
                    {activityLogs && activityLogs.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Historique d'activité</h4>
                        <div className="space-y-2">
                          {activityLogs.map((log) => (
                            <div key={log.id} className="border-l-2 border-primary/20 pl-3 py-2">
                              <p className="text-sm font-medium">{log.action}</p>
                              <p className="text-xs text-muted-foreground">{log.details}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une soumission pour voir les détails</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupplierSubmissionDashboard;
