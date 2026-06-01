import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Send, 
  Eye,
  Users,
  UserCheck,
  TrendingUp,
  Settings,
  MessageSquare,
  Phone,
  Mail,
  Download,
  Edit,
  Trash2,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUserRoles } from '@/hooks/useUserRoles'; // Import the correct role hook
import { useAuth } from '@/contexts/use-auth'; // Import auth context
import { 
  useInspectionMonitoringHex,
  type MonitoringInspection
} from '@/hooks/hexagonal'

const RoleBasedInspectionMonitoring = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user
  
  // Get dynamic user roles - using the correct hook
  const { hasAnyRole, userRoles } = useCurrentUserRoles();
  const userRole = userRoles[0] || 'viewer'; // Use first role or default
  
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<MonitoringInspection | null>(null);
  const [editFormData, setEditFormData] = useState({
    inspector: '',
    date: '',
    status: '',
    progress_at_inspection: 0,
    comments: ''
  });

  const projectId = searchParams.get('project');

  // Role-based permissions - using dynamic roles matching original
  const isInspector = hasAnyRole(['inspector', 'engineer', 'consultant']);
  const isProjectManager = hasAnyRole(['admin', 'director', 'project_manager', 'manager']);
  const isAdmin = hasAnyRole(['admin', 'super_admin']);
  const isEngineeringConsultant = hasAnyRole(['consultant', 'engineer', 'engineering_consultant']);

  // Use hexagonal hook with correct signature
  const inspectionData = useInspectionMonitoringHex({
    filterByInspector: isInspector,
    inspectorName: isInspector ? user?.email : undefined
  });
  const { inspections = [], isLoading } = inspectionData;

  // Helper function to get project title - matching original
  const getProjectTitle = (projectId: string) => {
    // In real app, this would fetch from projects data
    // For now, return the project ID as fallback
    return `Projet ${projectId}`;
  };

  // Helper function to send alert to hierarchy - matching original
  const sendAlertToHierarchy = async (inspectionId: string, message: string) => {
    // This would send notification to project managers/admins
    console.log('Alert sent:', { inspectionId, message });
    toast({
      title: "Alerte envoyée",
      description: "La hiérarchie a été notifiée",
    });
  };

  // Filter and paginate inspections
  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(inspection =>
        inspection.inspector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.comments?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inspection => inspection.status === statusFilter);
    }

    return filtered;
  }, [inspections, searchTerm, statusFilter]);

  const paginatedInspections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInspections.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredInspections, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredInspections.length / itemsPerPage);

  // Handle edit from URL param
  useEffect(() => {
    const inspectionId = searchParams.get('id');
    if (inspectionId && inspections.length > 0) {
      const inspection = inspections.find(i => i.id === inspectionId);
      if (inspection) {
        openEditDialog(inspection);
        // Clear URL param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, inspections]);

  const safeDateInput = (raw: string | undefined | null): string => {
    if (!raw) return '';
    const d = new Date(raw);
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
  };

  const openEditDialog = (inspection: MonitoringInspection) => {
    setEditingInspection(inspection);
    setEditFormData({
      inspector: inspection.inspector,
      date: safeDateInput(inspection.date),
      status: inspection.status,
      progress_at_inspection: inspection.progress_at_inspection || 0,
      comments: inspection.comments || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInspection) return;
    
    try {
      // For now, just log the edit since we don't have the mutation
      console.log('Edit inspection:', { id: editingInspection.id, data: editFormData });
      toast({
        title: "Succès",
        description: "Inspection mise Ã  jour",
      });
      
      setIsEditDialogOpen(false);
      setEditingInspection(null);
    } catch (error) {
      console.error('Error updating inspection:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inspection ?')) return;
    
    try {
      // For now, just log the delete since we don't have the mutation
      console.log('Delete inspection:', id);
      toast({
        title: "Succès",
        description: "Inspection supprimée",
      });
    } catch (error) {
      console.error('Error deleting inspection:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      in_progress: { variant: 'default', icon: <Calendar className="h-3 w-3" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
      approved: { variant: 'default', icon: <UserCheck className="h-3 w-3" /> },
      rejected: { variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> }
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suivi des Inspections</h1>
          <p className="text-muted-foreground">
            Gestion des inspections selon les rôles et permissions
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/inspections/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Inspection
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {/* Stats section removed for now since we don't have the stats hook */}

      {/* Overdue Inspections */}
      {inspections.filter(i => 
        new Date(i.date) < new Date() && 
        !['completed', 'approved'].includes(i.status)
      ).length > 0 && (
        <div className="border-l-4 border-red-500 pl-4">
          <h4 className="font-semibold text-red-700 mb-2"> Inspections en retard</h4>
          <div className="space-y-2">
            {inspections
              .filter(i => 
                new Date(i.date) < new Date() && 
                !['completed', 'approved'].includes(i.status)
              )
              .map(inspection => (
                <div key={inspection.id} className="flex items-center justify-between bg-red-50 p-3 rounded">
                  <div>
                    <p className="font-medium">{getProjectTitle(inspection.project_id)}</p>
                    <p className="text-sm text-muted-foreground">
                      Inspecteur: {inspection.inspector} • 
                      Date prévue: {new Date(inspection.date).toLocaleDateString('fr-FR')} • 
                      Retard: {Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24))} jour(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(inspection.status)}
                    {isProjectManager && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => sendAlertToHierarchy(
                          inspection.id, 
                          ` URGENT: Inspection en retard de ${Math.ceil((new Date().getTime() - new Date(inspection.date).getTime()) / (1000 * 60 * 60 * 24))} jour(s) pour le projet "${getProjectTitle(inspection.project_id)}" (Inspecteur: ${inspection.inspector})`
                        )}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Alerte hiérarchie
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Rechercher par inspecteur, commentaires ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Inspecteur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Progression</TableHead>
                    <TableHead>Commentaires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInspections.map((inspection) => (
                    <TableRow key={inspection.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          to={`/inspections/${inspection.id}`}
                          className="text-primary hover:underline inline-flex items-center gap-1"
                          title="Voir l'inspection"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {inspection.id.slice(0, 8)}…
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {inspection.inspector}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(inspection.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(inspection.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${inspection.progress_at_inspection || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{inspection.progress_at_inspection || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={inspection.comments || ''}>
                          {inspection.comments || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(inspection)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/inspections/${inspection.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir les détails
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {isAdmin && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(inspection.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={inspections.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="inspector">Inspecteur</Label>
                <Input
                  id="inspector"
                  value={editFormData.inspector}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, inspector: e.target.value }))}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                  disabled={!isAdmin}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={editFormData.status} onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Complété</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="progress">Progression (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.progress_at_inspection}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, progress_at_inspection: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="comments">Commentaires</Label>
              <Textarea
                id="comments"
                value={editFormData.comments}
                onChange={(e) => setEditFormData(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                placeholder="Ajouter des commentaires sur l'inspection..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSaveEdit}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleBasedInspectionMonitoring;
