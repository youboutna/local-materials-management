import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProjectSelector from '@/components/selectors/ProjectSelector';
import UserSelector from '@/components/selectors/UserSelector';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  related_id?: string | null;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface NotificationFormData {
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  related_id: string;
}

const NotificationCrud: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les notifications',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState<NotificationFormData>({
    recipient_id: '',
    title: '',
    message: '',
    type: 'info',
    related_id: ''
  });

  const notificationTypes = [
    { value: 'info', label: 'Information', color: 'bg-blue-100 text-blue-800', icon: Info },
    { value: 'warning', label: 'Avertissement', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    { value: 'error', label: 'Erreur', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    { value: 'success', label: 'Succès', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'project_update', label: 'Mise à jour projet', color: 'bg-purple-100 text-purple-800', icon: Bell },
    { value: 'compliance_alert', label: 'Alerte conformité', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    { value: 'payment_reminder', label: 'Rappel paiement', color: 'bg-indigo-100 text-indigo-800', icon: Bell }
  ];

  const resetForm = () => {
    setFormData({
      recipient_id: '',
      title: '',
      message: '',
      type: 'info',
      related_id: ''
    });
  };

  const openCreateForm = () => {
    resetForm();
    setIsEditing(false);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openEditForm = (notification: Notification) => {
    setFormData({
      recipient_id: notification.recipient_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      related_id: notification.related_id || ''
    });
    setSelectedNotification(notification);
    setIsEditing(true);
    setIsViewMode(false);
    setIsFormOpen(true);
  };

  const openViewForm = (notification: Notification) => {
    setFormData({
      recipient_id: notification.recipient_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      related_id: notification.related_id || ''
    });
    setSelectedNotification(notification);
    setIsViewMode(true);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipient_id || !formData.title || !formData.message) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && selectedNotification) {
        // Update in Supabase
        const { error } = await supabase
          .from('notifications')
          .update({
            recipient_id: formData.recipient_id,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            related_id: formData.related_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedNotification.id);

        if (error) throw error;

        await loadNotifications();
        toast({
          title: "Succès",
          description: "Notification mise à jour avec succès",
        });
      } else {
        // Insert in Supabase
        const { error } = await supabase
          .from('notifications')
          .insert({
            recipient_id: formData.recipient_id,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            related_id: formData.related_id || null,
            read: false
          });

        if (error) throw error;

        await loadNotifications();
        toast({
          title: "Succès",
          description: "Notification créée avec succès",
        });
      }
      
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette notification ?')) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);

        if (error) throw error;

        await loadNotifications();
        toast({
          title: "Succès",
          description: "Notification supprimée avec succès",
        });
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast({
          title: "Erreur",
          description: "Erreur lors de la suppression",
          variant: "destructive",
        });
      }
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTypeConfig = (type: string) => {
    return notificationTypes.find(option => option.value === type) || notificationTypes[0];
  };

  const handleProjectChange = (projectId: string | undefined) => {
    setFormData(prev => ({ ...prev, related_id: projectId || '' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📬 Gestion des Notifications</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isViewMode ? 'Détails de la Notification' : isEditing ? 'Modifier la Notification' : 'Nouvelle Notification'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <UserSelector
                    value={formData.recipient_id}
                    onChange={(userId) => setFormData(prev => ({ ...prev, recipient_id: userId }))}
                    label="Destinataire"
                    required={true}
                    disabled={isViewMode}
                    placeholder="Sélectionner le destinataire"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type de notification</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  disabled={isViewMode}
                  placeholder="Titre de la notification"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  required
                  disabled={isViewMode}
                  placeholder="Contenu détaillé de la notification..."
                />
              </div>

              <ProjectSelector
                value={formData.related_id}
                onChange={handleProjectChange}
                label="Projet associé (optionnel)"
                required={false}
                disabled={isViewMode}
              />

              {!isViewMode && (
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {notifications.map((notification) => {
                const typeConfig = getTypeConfig(notification.type);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <TableRow key={notification.id} className={notification.read ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        {notification.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeConfig.color}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{notification.recipient_id}</TableCell>
                    <TableCell>
                      <Badge variant={notification.read ? "outline" : "default"}>
                        {notification.read ? 'Lue' : 'Non lue'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.created_at && 
                        new Date(notification.created_at).toLocaleDateString('fr-FR')
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewForm(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditForm(notification)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Aucune notification trouvée
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCrud;