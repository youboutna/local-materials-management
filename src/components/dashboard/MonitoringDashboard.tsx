import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import HttpMonitor from '@/components/monitoring/HttpMonitor';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import InspectionCrud from '@/components/inspections/InspectionCrud';

const MonitoringDashboard: React.FC = () => {
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
            <div className="text-2xl font-bold text-blue-600">Surveillées</div>
            <p className="text-xs text-muted-foreground">Détection automatique des retards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrôle Paiements</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Actif</div>
            <p className="text-xs text-muted-foreground">Validation automatique</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inspections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">Suivi</div>
            <p className="text-xs text-muted-foreground">Monitoring des inspections</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Monitoring des Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <InspectionCrud />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;