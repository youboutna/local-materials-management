import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingUp, AlertTriangle, DollarSign, Activity, BarChart3 } from 'lucide-react';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import SystemHealthOverview from '@/components/monitoring/SystemHealthOverview';
import PerformanceMetrics from '@/components/monitoring/PerformanceMetrics';

const ComprehensiveMonitoringPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">📊 Centre de Surveillance Intégré</h1>
            <p className="text-muted-foreground mt-2">
              Système de surveillance automatisée avec actions de contrôle intégrées
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="inspections" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Inspections</span>
              </TabsTrigger>
              <TabsTrigger value="insurance" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Assurances</span>
              </TabsTrigger>
              <TabsTrigger value="guarantees" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Garanties</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Paiements</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <SystemHealthOverview />
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <PerformanceMetrics />
            </TabsContent>

            <TabsContent value="inspections" className="mt-6">
              <RoleBasedInspectionMonitoring />
            </TabsContent>

            <TabsContent value="insurance" className="mt-6">
              <UnifiedInsuranceManager />
            </TabsContent>

            <TabsContent value="guarantees" className="mt-6">
              <BankGuaranteeMonitor />
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <EnhancedPaymentBlockingInterface />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveMonitoringPage;