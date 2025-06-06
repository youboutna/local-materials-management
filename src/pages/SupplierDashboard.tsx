import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, DollarSign, FileText, Package, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const SupplierDashboard = () => {
  const { t } = useLanguage();

  // Fetch notifications for supplier
  const { data: notifications = [] } = useQuery({
    queryKey: ['supplier-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'supplier')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch payment progress
  const { data: payments = [] } = useQuery({
    queryKey: ['supplier-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          projects (title, status)
        `)
        .order('payment_date', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch documents - using 'contract' type instead of 'supplier'
  const { data: documents = [] } = useQuery({
    queryKey: ['supplier-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('document_type', 'contract')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (error) throw error;
      return data || [];
    }
  });

  const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.payment_method === 'pending').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-adrar-50 to-terracotta-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-adrar-800 mb-2">{t("supplier_dashboard.title")}</h1>
            <p className="text-gray-600">{t("supplier_dashboard.subtitle")}</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("supplier_dashboard.stats.total_payments")}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalPayments.toLocaleString()} MRO
                </div>
                <p className="text-xs text-gray-600">
                  {payments.length} {t("supplier_dashboard.stats.transactions")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("supplier_dashboard.stats.pending_payments")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingPayments}</div>
                <p className="text-xs text-gray-600">
                  {t("supplier_dashboard.stats.processing")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("supplier_dashboard.stats.notifications")}</CardTitle>
                <Bell className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{unreadNotifications}</div>
                <p className="text-xs text-gray-600">
                  {t("supplier_dashboard.stats.unread")}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("supplier_dashboard.stats.documents")}</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{documents.length}</div>
                <p className="text-xs text-gray-600">
                  {t("supplier_dashboard.stats.available")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications">{t("supplier_dashboard.tabs.notifications")}</TabsTrigger>
              <TabsTrigger value="payments">{t("supplier_dashboard.tabs.payments")}</TabsTrigger>
              <TabsTrigger value="documents">{t("supplier_dashboard.tabs.documents")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {t("supplier_dashboard.notifications.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`p-4 rounded-lg border ${
                            notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.created_at ? new Date(notification.created_at).toLocaleDateString('fr-FR') : t("supplier_dashboard.notifications.unknown_date")}
                              </p>
                            </div>
                            {!notification.read && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {t("supplier_dashboard.notifications.new")}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">{t("supplier_dashboard.notifications.empty")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {t("supplier_dashboard.payments.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {payments.length > 0 ? (
                      payments.map((payment) => (
                        <div key={payment.id} className="p-4 rounded-lg border bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {t("supplier_dashboard.payments.payment")} #{payment.transaction_id}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {t("supplier_dashboard.payments.amount")}: {payment.amount?.toLocaleString()} MRO
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : t("supplier_dashboard.payments.unknown_date")}
                              </p>
                            </div>
                            <Badge 
                              variant={payment.payment_method === 'completed' ? 'default' : 'secondary'}
                              className={
                                payment.payment_method === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }
                            >
                              {payment.payment_method === 'completed' ? t("supplier_dashboard.payments.paid") : t("supplier_dashboard.payments.pending")}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">{t("supplier_dashboard.payments.empty")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t("supplier_dashboard.documents.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.length > 0 ? (
                      documents.map((document) => (
                        <div key={document.id} className="p-4 rounded-lg border bg-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-gray-400" />
                              <div>
                                <h3 className="font-medium text-gray-900">{document.title}</h3>
                                <p className="text-sm text-gray-600">{document.description}</p>
                                <p className="text-xs text-gray-500">
                                  {document.created_at ? new Date(document.created_at).toLocaleDateString('fr-FR') : t("supplier_dashboard.documents.unknown_date")}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {document.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">{t("supplier_dashboard.documents.empty")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SupplierDashboard;
