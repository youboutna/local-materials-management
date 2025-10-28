import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import HttpMonitor from '@/components/monitoring/HttpMonitor';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import { useLanguage } from '@/contexts/LanguageContext';


const MonitoringDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    guarantees: { count: 0, status: `0 ${t('dashboard.monitoring.alerts_count')}` },
    payments: { count: 0, status: `0 ${t('dashboard.monitoring.overdue')}` },
    inspections: { count: 0, status: `0 ${t('dashboard.monitoring.overdue')}` }
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Load guarantees about to expire (next 30 days)
        const { data: guarantees, error: guaranteesError } = await supabase
          .from('bank_guarantees')
          .select('*')
          .eq('status', 'active')
          .lte('expiry_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (guaranteesError) {
          console.error('Error loading guarantees:', guaranteesError);
        }

        // Load blocked payments
        const { data: blockedPayments, error: paymentsError } = await supabase
          .from('payment_blocks')
          .select('*')
          .is('resolved_at', null);

        if (paymentsError) {
          console.error('Error loading blocked payments:', paymentsError);
        }

        // Load delayed inspections
        const { data: inspections, error: inspectionsError } = await supabase
          .from('inspections')
          .select('*')
          .eq('status', 'scheduled')
          .lt('date', new Date().toISOString());

        if (inspectionsError) {
          console.error('Error loading inspections:', inspectionsError);
        }

        setStats({
          guarantees: { 
            count: guarantees?.length || 0,
            status: guarantees?.length ? `${guarantees.length} ${t('dashboard.monitoring.alerts_count')}` : t('dashboard.monitoring.active')
          },
          payments: { 
            count: blockedPayments?.length || 0,
            status: blockedPayments?.length ? `${blockedPayments.length} ${t('dashboard.monitoring.overdue')}` : t('dashboard.monitoring.active')
          },
          inspections: { 
            count: inspections?.length || 0,
            status: inspections?.length ? `${inspections.length} ${t('dashboard.monitoring.overdue')}` : t('dashboard.monitoring.active')
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
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.http_status')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{t('dashboard.monitoring.active')}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.monitoring.real_time_monitoring')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.guarantees')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.guarantees.count > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {stats.guarantees.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.guarantees.count > 0 ? t('dashboard.monitoring.expiring_soon') : t('bank_guarantee.subtitle')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.payment_control')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.payments.count > 0 ? 'text-red-600' : 'text-orange-600'}`}>
              {stats.payments.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.payments.count > 0 ? t('payment_control.no_pending') : t('dashboard.monitoring.automatic_validation')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.monitoring.inspections')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.inspections.count > 0 ? 'text-red-600' : 'text-purple-600'}`}>
              {stats.inspections.status}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.inspections.count > 0 ? t('dashboard.monitoring.overdue_inspections') : t('dashboard.monitoring.real_time_monitoring')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="http" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="http">{t('dashboard.monitoring.http_status')}</TabsTrigger>
          <TabsTrigger value="guarantees">{t('dashboard.monitoring.guarantees')}</TabsTrigger>
          <TabsTrigger value="payments">{t('dashboard.monitoring.payment_control')}</TabsTrigger>
          <TabsTrigger value="inspections">{t('dashboard.monitoring.inspections')}</TabsTrigger>
        </TabsList>

        <TabsContent value="http" className="mt-6">
          <HttpMonitor />
        </TabsContent>

        <TabsContent value="guarantees" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('bank_guarantee.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <BankGuaranteeMonitor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('payment_control.title')}</CardTitle>
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