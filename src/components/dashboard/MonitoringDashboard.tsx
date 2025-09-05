import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import HttpMonitor from '@/components/monitoring/HttpMonitor';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import { supabase } from '@/integrations/supabase/client';

const MonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    guarantees: { count: 0, status: "0 Alertes" },
    payments: { count: 0, status: "0 Bloqués" },
    inspections: { count: 0, status: "0 En Retard" }
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load guarantees about to expire (next 30 days)
        const { data: guarantees } = await supabase
          .from('bank_guarantees')
          .select('*')
          .eq('status', 'active')
          .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        // Load blocked payments
        const { data: blockedPayments } = await supabase
          .from('payment_blocks')
          .select('*')
          .is('resolved_at', null);

        // Load delayed inspections
        const { data: inspections } = await supabase
          .from('inspections')
          .select('*')
          .eq('status', 'scheduled')
          .lt('date', new Date().toISOString());

        setStats({
          guarantees: { 
            count: guarantees?.length || 0,
            status: guarantees?.length ? `${guarantees.length} Alertes` : "Surveillées"
          },
          payments: { 
            count: blockedPayments?.length || 0,
            status: blockedPayments?.length ? `${blockedPayments.length} Bloqués` : "Actif"
          },
          inspections: { 
            count: inspections?.length || 0,
            status: inspections?.length ? `${inspections.length} En Retard` : "Suivi"
          }
        });
      } catch (error) {
        console.error('Error loading monitoring stats:', error);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut HTTP</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Actif</div>
            <p className="text-xs text-muted-foreground">Surveillance en temps réel</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Garanties Bancaires</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.guarantees.count > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {stats.guarantees.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.guarantees.count > 0 ? 'Garanties expirant bientôt' : 'Détection automatique des retards'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrôle Paiements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.payments.count > 0 ? 'text-red-600' : 'text-orange-600'}`}>
              {stats.payments.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.payments.count > 0 ? 'Paiements en attente' : 'Validation automatique'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.inspections.count > 0 ? 'text-red-600' : 'text-purple-600'}`}>
              {stats.inspections.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.inspections.count > 0 ? 'Inspections en retard' : 'Monitoring des inspections'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="http" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="http">HTTP Monitor</TabsTrigger>
          <TabsTrigger value="guarantees">Garanties Bancaires</TabsTrigger>
          <TabsTrigger value="payments">Contrôle Paiements</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="http" className="mt-6">
          <HttpMonitor />
        </TabsContent>

        <TabsContent value="guarantees" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Surveillance des Garanties Bancaires</CardTitle>
            </CardHeader>
            <CardContent>
              <BankGuaranteeMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contrôle et Validation des Paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedPaymentBlockingInterface />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="mt-6">
          <RoleBasedInspectionMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;