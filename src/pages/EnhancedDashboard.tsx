import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  type: 'delivery' | 'deadline' | 'quality';
  severity: 'high' | 'medium' | 'low';
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

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      message: 'Votre livraison de clôtures est liée à un projet en retard (Pôle Halterique)',
      type: 'delivery',
      severity: 'high'
    }
  ]);

  const [activeChantiers] = useState(3);

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
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-yellow-50 border-yellow-200' :
                      alert.severity === 'medium' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className={`${
                        alert.severity === 'high' ? 'text-yellow-800' :
                        alert.severity === 'medium' ? 'text-blue-800' :
                        'text-gray-800'
                      }`}>
                        "{alert.message}"
                      </div>
                    </div>
                  ))}
                </div>
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