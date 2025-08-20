import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { detectExpiringInsurance } from '@/services/insuranceCertificateService';
import { detectOverdueInspections } from '@/services/inspectionMonitoringService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Eye, 
  FileText, 
  Bell, 
  BarChart3, 
  Package, 
  Shield, 
  Users 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ProjectAlert {
  id: string;
  title: string;
  delay: number;
  status: 'crisis' | 'warning' | 'normal';
  action?: string;
}

interface Milestone {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

interface Document {
  id: string;
  title: string;
  sharedBy: string;
  date: string;
  type: 'plan' | 'report' | 'certificate';
}

interface Alert {
  id: string;
  message: string;
  type: 'insurance_expiry' | 'bank_guarantee' | 'inspection_overdue' | 'payment_blocked' | 'compliance_violation' | 'delivery' | 'deadline' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: 'insurance' | 'bank_guarantee' | 'inspection' | 'payment' | 'notification';
  data?: any;
}

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [projectAlerts, setProjectAlerts] = useState<ProjectAlert[]>([
    {
      id: '1',
      title: 'Axe Idini',
      delay: 15,
      status: 'crisis',
      action: 'Garantie déclenchée → Banque notifiée'
    }
  ]);

  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      title: 'Fouilles Tani',
      date: '15/08',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Inspection structure R+2',
      date: '18/08',
      status: 'pending'
    }
  ]);

  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Plan R+2.pdf',
      sharedBy: 'Chef Projet',
      date: '15/08',
      type: 'plan'
    }
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activeChantiers] = useState(3);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  // Load real alerts from all monitoring systems
  useEffect(() => {
    const loadAllAlerts = async () => {
      try {
        setIsLoadingAlerts(true);
        const allAlerts: Alert[] = [];

        // 1. Load Insurance Expiry Alerts
        try {
          const insuranceAlerts = await detectExpiringInsurance();
          insuranceAlerts.forEach(alert => {
            allAlerts.push({
              id: `insurance-${alert.projectId}-${alert.contractorId}`,
              message: `Assurance ${alert.insuranceType} de ${alert.contractorName} expire dans ${alert.daysRemaining} jour(s) (Police: ${alert.policyNumber})`,
              type: 'insurance_expiry',
              severity: alert.alertLevel === 'critical' ? 'critical' : alert.alertLevel === 'warning' ? 'medium' : 'high',
              source: 'insurance',
              data: alert
            });
          });
        } catch (error) {
          console.error('Error loading insurance alerts:', error);
        }

        // 2. Load Overdue Inspection Alerts
        try {
          const overdueInspections = await detectOverdueInspections();
          overdueInspections.forEach(inspection => {
            const daysPastDue = Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24));
            allAlerts.push({
              id: `inspection-${inspection.id}`,
              message: `Inspection en retard de ${daysPastDue} jour(s) sur le projet "${inspection.projects?.title || 'Projet inconnu'}"`,
              type: 'inspection_overdue',
              severity: daysPastDue > 7 ? 'critical' : daysPastDue > 3 ? 'high' : 'medium',
              source: 'inspection',
              data: inspection
            });
          });
        } catch (error) {
          console.error('Error loading inspection alerts:', error);
        }

        // 3. Load Bank Guarantee Alerts (delayed projects that may trigger guarantees)
        try {
          const { data: delayedProjects, error } = await supabase
            .from('projects')
            .select(`
              id,
              title,
              start_date,
              end_date,
              status,
              bank_guarantees!inner(*)
            `)
            .in('status', ['in_progress', 'delayed']);

          if (!error && delayedProjects) {
            delayedProjects.forEach(project => {
              if (project.end_date && new Date(project.end_date) < new Date()) {
                const delayDays = Math.ceil((new Date().getTime() - new Date(project.end_date).getTime()) / (1000 * 60 * 60 * 24));
                if (delayDays > 10) { // Significant delay threshold
                  allAlerts.push({
                    id: `bank-guarantee-${project.id}`,
                    message: `Projet "${project.title}" en retard de ${delayDays} jours - Risque de déclenchement de garantie bancaire`,
                    type: 'bank_guarantee',
                    severity: delayDays > 30 ? 'critical' : 'high',
                    source: 'bank_guarantee',
                    data: { project, delayDays }
                  });
                }
              }
            });
          }
        } catch (error) {
          console.error('Error loading bank guarantee alerts:', error);
        }

        // 4. Load Payment Block Alerts
        try {
          const { data: paymentBlocks, error } = await supabase
            .from('payment_blocks')
            .select('*')
            .is('resolved_at', null); // Only unresolved blocks

          if (!error && paymentBlocks) {
            // Get project titles separately to avoid relation issues
            for (const block of paymentBlocks) {
              try {
                const { data: project } = await supabase
                  .from('projects')
                  .select('title')
                  .eq('id', block.project_id)
                  .single();

                allAlerts.push({
                  id: `payment-block-${block.id}`,
                  message: `Paiement bloqué pour le projet "${project?.title || 'Projet inconnu'}" - Montant: ${block.amount?.toLocaleString()} MRU`,
                  type: 'payment_blocked',
                  severity: 'high',
                  source: 'payment',
                  data: block
                });
              } catch (projectError) {
                console.error('Error loading project for payment block:', projectError);
                allAlerts.push({
                  id: `payment-block-${block.id}`,
                  message: `Paiement bloqué - Montant: ${block.amount?.toLocaleString()} MRU`,
                  type: 'payment_blocked',
                  severity: 'high',
                  source: 'payment',
                  data: block
                });
              }
            }
          }
        } catch (error) {
          console.error('Error loading payment block alerts:', error);
        }

        // 5. Load High Priority Notifications
        if (user?.id) {
          try {
            const { data: notifications, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('recipient_id', user.id)
              .eq('read', false)
              .contains('metadata', { priority: 'urgent' })
              .order('created_at', { ascending: false })
              .limit(10);

            if (!error && notifications) {
              notifications.forEach(notif => {
                allAlerts.push({
                  id: `notification-${notif.id}`,
                  message: notif.message,
                  type: notif.type === 'compliance_alert' ? 'compliance_violation' : 'deadline',
                  severity: 'high',
                  source: 'notification',
                  data: notif
                });
              });
            }
          } catch (error) {
            console.error('Error loading notification alerts:', error);
          }
        }

        // Sort alerts by severity (critical first)
        allAlerts.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        });

        setAlerts(allAlerts);
      } catch (error) {
        console.error('Error loading alerts:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les alertes",
          variant: "destructive"
        });
      } finally {
        setIsLoadingAlerts(false);
      }
    };

    if (user) {
      loadAllAlerts();
    }
  }, [user, toast]);

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        {/* Portal Header */}
        <div className="bg-primary text-primary-foreground p-4 border-b">
          <div className="flex items-center gap-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span className="font-semibold">📊 Tableau de bord</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span className="font-semibold">📦 Portail Fournisseur</span>
            </div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Crisis Projects Alert */}
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                📌 Projets en crise
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="text-red-700">
                    <strong>{alert.title}:</strong> Retard {alert.delay}j 
                    {alert.action && <span className="ml-2">({alert.action})</span>}
                  </div>
                  <Badge variant="destructive">Critique</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* This Week Milestones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                📅 Jalons cette semaine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-3">
                    {milestone.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className={`${
                      milestone.status === 'completed' ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      {milestone.status === 'completed' ? '[✔️]' : '[🟡]'} {milestone.title} ({milestone.date})
                    </span>
                    {milestone.status === 'completed' && (
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Terminé
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Interactive Map Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                🗺️ Carte des Chantiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-100 p-6 rounded-lg text-center">
                <div className="mb-4">
                  <div className="text-2xl font-bold text-primary">{activeChantiers}</div>
                  <div className="text-sm text-muted-foreground">chantiers actifs</div>
                </div>
                <Button variant="outline" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Voir {activeChantiers} chantiers actifs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Portal Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📂 Derniers documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-900">{doc.title}</div>
                      <div className="text-sm text-blue-700 mt-1">
                        Partagé par {doc.sharedBy} le {doc.date}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="font-medium text-orange-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      ❗ Action requise:
                    </div>
                    <div className="text-sm text-orange-700 mt-1">
                      Confirmer livraison acier avant 20/08
                    </div>
                    <Button size="sm" className="mt-2" variant="outline">
                      Confirmer maintenant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  📬 Alertes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <div className="text-center py-4">
                    <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-primary rounded-full"></div>
                    <p className="text-sm text-muted-foreground mt-2">Chargement des alertes...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune alerte active</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border ${
                        alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.severity === 'high' ? 'bg-yellow-50 border-yellow-200' :
                        alert.severity === 'medium' ? 'bg-blue-50 border-blue-200' :
                        'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className={`flex-1 ${
                            alert.severity === 'critical' ? 'text-red-800' :
                            alert.severity === 'high' ? 'text-yellow-800' :
                            alert.severity === 'medium' ? 'text-blue-800' :
                            'text-gray-800'
                          }`}>
                            <div className="font-medium mb-1">
                              {alert.type === 'insurance_expiry' && '🛡️ Assurance'} 
                              {alert.type === 'bank_guarantee' && '🏦 Garantie'} 
                              {alert.type === 'inspection_overdue' && '🔍 Inspection'} 
                              {alert.type === 'payment_blocked' && '💰 Paiement'} 
                              {alert.type === 'compliance_violation' && '⚠️ Conformité'}
                              {!['insurance_expiry', 'bank_guarantee', 'inspection_overdue', 'payment_blocked', 'compliance_violation'].includes(alert.type) && '📋 Alerte'}
                            </div>
                            <div className="text-sm">
                              {alert.message}
                            </div>
                          </div>
                          <Badge variant={
                            alert.severity === 'critical' ? 'destructive' :
                            alert.severity === 'high' ? 'default' :
                            'secondary'
                          }>
                            {alert.severity === 'critical' ? 'Critique' :
                             alert.severity === 'high' ? 'Élevé' :
                             alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {alerts.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm">
                          Voir toutes les alertes ({alerts.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Monitoring Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enhanced Monitoring & Inspection by Engineering Consultant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                🔹 Objective: Strengthen oversight with digital tools, real-time reporting, and accountability.
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Implementation Steps:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <strong className="text-green-800">✅ Digital Inspection Checklists</strong>
                    </div>
                    <p className="text-sm text-green-700">
                      Mobile-friendly forms for engineers to log daily inspections (photos, notes, defects).
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Mandatory fields to ensure critical checks aren't skipped.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <strong className="text-blue-800">✅ Real-Time Progress Dashboards</strong>
                    </div>
                    <p className="text-sm text-blue-700">
                      GPS-tagged reports showing inspection locations (linked to geolocation module).
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      AI-driven anomaly detection (e.g., deviations from blueprints, material mismatches).
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <strong className="text-purple-800">✅ Delegation & Accountability</strong>
                    </div>
                    <p className="text-sm text-purple-700">
                      Role-based access: Consultants submit reports, but only the Company/Director can approve critical changes.
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Audit trails tracking who inspected, approved, or modified plans.
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <strong className="text-orange-800">✅ Automated Compliance Alerts</strong>
                    </div>
                    <p className="text-sm text-orange-700">
                      If inspections are missed, notify the consultant's supervisor.
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Flag recurring issues (e.g., safety violations) for priority resolution.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default EnhancedDashboard;