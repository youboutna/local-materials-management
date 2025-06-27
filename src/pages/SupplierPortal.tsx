
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, FileText, User, Mail, Phone, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const SupplierPortal = () => {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Fetch supplier profile
  const { data: supplierProfile } = useQuery({
    queryKey: ['supplier-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch assigned tasks
  const { data: assignedTasks = [] } = useQuery({
    queryKey: ['supplier-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_assignments')
        .select(`
          *,
          projects (title, location)
        `)
        .eq('assigned_to', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['supplier-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });

  const handleCompleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('task_assignments')
      .update({ 
        status: 'completed',
        completion_date: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error) {
      // Refresh tasks
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-adrar-50 to-terracotta-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-adrar-800 mb-2">
              Portail Fournisseur
            </h1>
            <p className="text-gray-600">
              Gérez vos tâches et consultez vos notifications
            </p>
          </div>

          {/* Supplier Profile Card */}
          {supplierProfile && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil Fournisseur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{supplierProfile.name}</h3>
                    <div className="space-y-2 mt-2">
                      {supplierProfile.contact_person && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4" />
                          {supplierProfile.contact_person}
                        </div>
                      )}
                      {supplierProfile.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          {supplierProfile.email}
                        </div>
                      )}
                      {supplierProfile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4" />
                          {supplierProfile.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {supplierProfile.category && (
                      <Badge variant="outline" className="mb-2">
                        {supplierProfile.category}
                      </Badge>
                    )}
                    {supplierProfile.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 mt-1" />
                        <span>{supplierProfile.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">Tâches Assignées</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Mes Tâches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedTasks.length > 0 ? (
                      assignedTasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-lg border bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900">{task.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                              {task.projects && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Projet: {task.projects.title} - {task.projects.location}
                                </p>
                              )}
                              {task.due_date && (
                                <p className="text-xs text-gray-500">
                                  Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={task.status === 'completed' ? 'default' : 'secondary'}
                                className={
                                  task.status === 'completed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : task.status === 'in_progress'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-orange-100 text-orange-800'
                                }
                              >
                                {task.status === 'completed' ? 'Terminé' : 
                                 task.status === 'in_progress' ? 'En cours' : 'En attente'}
                              </Badge>
                              {task.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteTask(task.id)}
                                >
                                  Marquer terminé
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Aucune tâche assignée
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
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
                            notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            {!notification.read && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Aucune notification
                      </p>
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

export default SupplierPortal;
