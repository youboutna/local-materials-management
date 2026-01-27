
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectService } from '@/application/services/ProjectService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect } from 'react';
import * as XLSX from 'xlsx';

const ProjectExporter = () => {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'excel' | 'csv'>('json');
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useLanguage();
  const projectService = new ProjectService(RepositoryFactory.getProjectRepository());

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await projectService.getAllProjects();
        setProjects(data);
        // Select all projects by default
        setSelectedProjects(data.map(p => p.id));
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Filter projects based on search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      project.title?.toLowerCase().includes(search) ||
      project.description?.toLowerCase().includes(search) ||
      project.location?.toLowerCase().includes(search) ||
      project.status?.toLowerCase().includes(search)
    );
  });

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProjects.length === filteredProjects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(filteredProjects.map(p => p.id));
    }
  };

  const prepareProjectData = async () => {
    // Only export selected projects
    const projectsToExport = projects.filter(p => selectedProjects.includes(p.id));
    
    // Fetch detailed data for each selected project
    const detailedProjects = await Promise.all(
      projectsToExport.map(async (project) => {
        try {
          const detail = await projectService.getProjectWithDetails(project.id);
          return {
            // Basic info
            id: detail?.id || project.id,
            title: detail?.title || project.title,
            description: detail?.description || project.description,
            location: detail?.location || project.location,
            status: detail?.status || project.status,
            progress: detail?.progress || project.progress,
            budget: detail?.budget || project.budget,
            startDate: detail?.startDate || project.startDate,
            endDate: detail?.endDate || project.endDate || '',
            teamSize: detail?.teamSize || project.teamSize,
            thumbnail: detail?.thumbnail || '',
            
            // Location details
            latitude: detail?.coordinates?.latitude || project.coordinates?.latitude || '',
            longitude: detail?.coordinates?.longitude || project.coordinates?.longitude || '',
            
            // Classification
            category: detail?.category || project.category || '',
            subCategory: detail?.subCategory || project.subCategory || '',
            priorityLevel: detail?.priorityLevel || project.priorityLevel || '',
            riskLevel: detail?.riskLevel || project.riskLevel || '',
            environmentalImpact: detail?.environmentalImpact || project.environmentalImpact || '',
            sustainabilityScore: detail?.sustainabilityScore || project.sustainabilityScore || 0,
            
            // Project details
            financingSource: detail?.financingSource || project.financingSource || '',
            marketType: detail?.marketType || project.marketType || '',
            selectionMode: detail?.selectionMode || project.selectionMode || '',
            launchDate: detail?.launchDate || project.launchDate || '',
            attributionDate: detail?.attributionDate || project.attributionDate || '',
            projectReference: detail?.projectReference || '',
            mainContractor: detail?.mainContractor || '',
            allowsInitialPayment: detail?.allowsInitialPayment || false,
            initialPaymentPercentage: detail?.initialPaymentPercentage || 0,
            projectResponsableId: detail?.projectResponsableId || '',
            
            // Financial details
            totalCost: detail?.budget || project.budget || 0,
            spentAmount: detail?.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0,
            remainingBudget: (detail?.budget || 0) - (detail?.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0),
            
            // Statistics
            tasksCount: detail?.tasks?.length || 0,
            completedTasksCount: detail?.tasks?.filter((t: any) => t.status === 'completed').length || 0,
            phasesCount: detail?.plannedPhases?.length || 0,
            inspectionsCount: detail?.inspections?.length || 0,
            risksCount: detail?.risks?.length || 0,
            resourcesCount: detail?.resources?.length || 0,
            expensesCount: detail?.expenses?.length || 0,
            alertsCount: detail?.alerts?.length || 0,
            
            // Related data arrays
            phases: detail?.plannedPhases || [],
            tasks: detail?.tasks || [],
            inspections: detail?.inspections || [],
            risks: detail?.risks || [],
            resources: detail?.resources || [],
            expenses: detail?.expenses || [],
            alerts: detail?.alerts || [],
            insurancePolicies: detail?.insurancePolicies || [],
            contacts: detail?.contacts || [],
            milestones: detail?.milestones || detail?.constructionMilestones || [],
            documents: detail?.documents || [],
            stakeholders: detail?.stakeholders || []
          };
        } catch (error) {
          console.error(`Error fetching details for project ${project.id}:`, error);
          // Return basic project data if detail fetch fails
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            location: project.location,
            status: project.status,
            progress: project.progress,
            budget: project.budget,
            startDate: project.startDate,
            endDate: project.endDate || '',
            teamSize: project.teamSize,
            latitude: project.coordinates?.latitude || '',
            longitude: project.coordinates?.longitude || '',
            phases: [],
            tasks: [],
            inspections: [],
            risks: [],
            resources: [],
            expenses: [],
            alerts: [],
            contacts: []
          };
        }
      })
    );
    
    return detailedProjects;
  };

  const exportToJson = async () => {
    const data = await prepareProjectData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projets_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = async () => {
    const data = await prepareProjectData();
    
    // Create separate sheets for each data type
    const workbook = XLSX.utils.book_new();
    
    // Main projects sheet with extended info
    const projectsFlat = data.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      location: p.location,
      status: p.status,
      progress: p.progress,
      budget: p.budget,
      spentAmount: p.spentAmount,
      remainingBudget: p.remainingBudget,
      startDate: p.startDate,
      endDate: p.endDate,
      teamSize: p.teamSize,
      
      // Location details
      latitude: p.latitude,
      longitude: p.longitude,
      
      // Classification
      category: p.category,
      subCategory: p.subCategory,
      priorityLevel: p.priorityLevel,
      riskLevel: p.riskLevel,
      environmentalImpact: p.environmentalImpact,
      sustainabilityScore: p.sustainabilityScore,
      
      // Project details
      financingSource: p.financingSource,
      marketType: p.marketType,
      selectionMode: p.selectionMode,
      launchDate: p.launchDate,
      attributionDate: p.attributionDate,
      projectReference: p.projectReference,
      mainContractor: p.mainContractor,
      allowsInitialPayment: p.allowsInitialPayment,
      initialPaymentPercentage: p.initialPaymentPercentage,
      
      // Statistics
      tasksCount: p.tasksCount,
      completedTasksCount: p.completedTasksCount,
      phasesCount: p.phasesCount,
      inspectionsCount: p.inspectionsCount,
      risksCount: p.risksCount,
      resourcesCount: p.resourcesCount,
      expensesCount: p.expensesCount,
      alertsCount: p.alertsCount
    }));
    
    const projectsSheet = XLSX.utils.json_to_sheet(projectsFlat);
    XLSX.utils.book_append_sheet(workbook, projectsSheet, 'Projets');
    
    // Tasks sheet
    const allTasks: any[] = [];
    data.forEach(project => {
      project.tasks?.forEach((task: any) => {
        allTasks.push({
          projectId: project.id,
          project: project.title,
          taskName: task.name || task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          progress: task.progress,
          startDate: task.startDate,
          endDate: task.endDate,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo,
          assignedBy: task.assignedBy,
          cost: task.cost,
          notes: task.notes,
          completedAt: task.completedAt
        });
      });
    });
    if (allTasks.length > 0) {
      const tasksSheet = XLSX.utils.json_to_sheet(allTasks);
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tâches');
    }
    
    // Phases sheet
    const allPhases: any[] = [];
    data.forEach(project => {
      project.phases?.forEach((phase: any) => {
        allPhases.push({
          projectId: project.id,
          project: project.title,
          phaseName: phase.phase_name || phase.name,
          status: phase.status,
          startDate: phase.start_date || phase.startDate,
          endDate: phase.end_date || phase.endDate,
          progress: phase.progress,
          budget: phase.budget,
          description: phase.description,
          dependencies: phase.dependencies,
          milestones: phase.milestones
        });
      });
    });
    if (allPhases.length > 0) {
      const phasesSheet = XLSX.utils.json_to_sheet(allPhases);
      XLSX.utils.book_append_sheet(workbook, phasesSheet, 'Phases');
    }
    
    // Inspections sheet
    const allInspections: any[] = [];
    data.forEach(project => {
      project.inspections?.forEach((inspection: any) => {
        allInspections.push({
          projectId: project.id,
          project: project.title,
          inspector: inspection.inspector,
          date: inspection.date,
          status: inspection.status,
          progressAtInspection: inspection.progressAtInspection,
          comments: inspection.comments,
          phaseId: inspection.phaseId,
          issues: inspection.issues?.length || 0,
          documents: inspection.documents?.length || 0
        });
      });
    });
    if (allInspections.length > 0) {
      const inspectionsSheet = XLSX.utils.json_to_sheet(allInspections);
      XLSX.utils.book_append_sheet(workbook, inspectionsSheet, 'Inspections');
    }
    
    // Risks sheet
    const allRisks: any[] = [];
    data.forEach(project => {
      project.risks?.forEach((risk: any) => {
        allRisks.push({
          projectId: project.id,
          project: project.title,
          riskName: risk.name || risk.title,
          description: risk.description,
          category: risk.category,
          probability: risk.probability,
          impact: risk.impact,
          severity: risk.severity,
          status: risk.status,
          mitigationPlan: risk.mitigationPlan,
          owner: risk.owner,
          identifiedDate: risk.identifiedDate,
          reviewDate: risk.reviewDate
        });
      });
    });
    if (allRisks.length > 0) {
      const risksSheet = XLSX.utils.json_to_sheet(allRisks);
      XLSX.utils.book_append_sheet(workbook, risksSheet, 'Risques');
    }
    
    // Expenses sheet
    const allExpenses: any[] = [];
    data.forEach(project => {
      project.expenses?.forEach((expense: any) => {
        allExpenses.push({
          projectId: project.id,
          project: project.title,
          amount: expense.amount || 0,
          date: expense.date || expense.payment_date || '',
          description: expense.description || '',
          category: expense.category || '',
          paymentMethod: expense.payment_method || expense.paymentMethod,
          transactionId: expense.transaction_id || expense.transactionId,
          contractorName: expense.contractor_name || expense.contractorName,
          approvedBy: expense.approved_by || expense.approvedBy,
          status: expense.status
        });
      });
    });
    if (allExpenses.length > 0) {
      const expensesSheet = XLSX.utils.json_to_sheet(allExpenses);
      XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Dépenses');
    }
    
    // Resources sheet
    const allResources: any[] = [];
    data.forEach(project => {
      project.resources?.forEach((resource: any) => {
        allResources.push({
          projectId: project.id,
          project: project.title,
          resourceType: resource.type,
          name: resource.name,
          quantity: resource.quantity,
          unit: resource.unit,
          costPerUnit: resource.costPerUnit,
          totalCost: resource.totalCost,
          supplier: resource.supplier,
          availability: resource.availability
        });
      });
    });
    if (allResources.length > 0) {
      const resourcesSheet = XLSX.utils.json_to_sheet(allResources);
      XLSX.utils.book_append_sheet(workbook, resourcesSheet, 'Ressources');
    }
    
    // Contacts/Stakeholders sheet
    const allContacts: any[] = [];
    data.forEach(project => {
      // Merge contacts and stakeholders
      const projectContacts = [
        ...(project.contacts || []),
        ...(project.stakeholders || [])
      ];
      
      projectContacts.forEach((contact: any) => {
        allContacts.push({
          projectId: project.id,
          project: project.title,
          name: contact.name,
          role: contact.role,
          organization: contact.organization,
          email: contact.email,
          phone: contact.phone,
          isPrimary: contact.isPrimary
        });
      });
    });
    if (allContacts.length > 0) {
      const contactsSheet = XLSX.utils.json_to_sheet(allContacts);
      XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');
    }
    
    // Milestones sheet
    const allMilestones: any[] = [];
    data.forEach(project => {
      project.milestones?.forEach((milestone: any) => {
        allMilestones.push({
          projectId: project.id,
          project: project.title,
          name: milestone.name || milestone.title,
          plannedDate: milestone.plannedDate || milestone.targetDate,
          actualDate: milestone.actualDate || milestone.completedDate,
          status: milestone.status
        });
      });
    });
    if (allMilestones.length > 0) {
      const milestonesSheet = XLSX.utils.json_to_sheet(allMilestones);
      XLSX.utils.book_append_sheet(workbook, milestonesSheet, 'Jalons');
    }
    
    // Documents sheet
    const allDocuments: any[] = [];
    data.forEach(project => {
      project.documents?.forEach((doc: any) => {
        allDocuments.push({
          projectId: project.id,
          project: project.title,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          uploadDate: doc.uploadDate
        });
      });
    });
    if (allDocuments.length > 0) {
      const documentsSheet = XLSX.utils.json_to_sheet(allDocuments);
      XLSX.utils.book_append_sheet(workbook, documentsSheet, 'Documents');
    }
    
    XLSX.writeFile(workbook, `projets_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCsv = async () => {
    const data = await prepareProjectData();
    
    // Flatten nested data for CSV
    const flatData = data.map(project => ({
      title: project.title,
      description: project.description,
      location: project.location,
      status: project.status,
      progress: project.progress,
      budget: project.budget,
      startDate: project.startDate,
      endDate: project.endDate,
      teamSize: project.teamSize,
      latitude: project.latitude,
      longitude: project.longitude,
      financingSource: project.financingSource,
      marketType: project.marketType,
      selectionMode: project.selectionMode,
      launchDate: project.launchDate,
      attributionDate: project.attributionDate,
      projectReference: project.projectReference,
      mainContractor: project.mainContractor,
      tasksCount: project.tasks?.length || 0,
      phasesCount: project.phases?.length || 0,
      inspectionsCount: project.inspections?.length || 0,
      risksCount: project.risks?.length || 0,
      resourcesCount: project.resources?.length || 0,
      expensesCount: project.expenses?.length || 0
    }));
    
    const headers = Object.keys(flatData[0] || {});
    const csvContent = [
      headers.join(','),
      ...flatData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projets_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!projects || projects.length === 0) {
      toast({
        title: t('projects.export.noProjects'),
        description: t('projects.export.noProjectsDescription'),
        variant: "destructive",
      });
      return;
    }

    if (selectedProjects.length === 0) {
      toast({
        title: t('projects.export.noSelection'),
        description: t('projects.export.noSelectionDescription'),
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    
    try {
      switch (exportFormat) {
        case 'json':
          await exportToJson();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'csv':
          await exportToCsv();
          break;
      }
      
      toast({
        title: t('projects.export.success'),
        description: `${selectedProjects.length} ${t('projects.export.projectsExported')} ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('projects.export.error'),
        description: t('projects.export.errorDescription'),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">{t('common.loading')}...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          {t('projects.export.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {t('projects.export.description')}
            {projects && (
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">
                  {projects.length} {t('projects.export.total')}
                </Badge>
                <Badge variant="default">
                  {selectedProjects.length} {t('projects.export.selected')}
                </Badge>
              </div>
            )}
          </AlertDescription>
        </Alert>

        {/* Search and filter section */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('projects.export.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedProjects.length === filteredProjects.length && filteredProjects.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                {t('projects.export.selectAll')} ({filteredProjects.length})
              </label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProjects([])}
              disabled={selectedProjects.length === 0}
            >
              {t('projects.export.clearSelection')}
            </Button>
          </div>

          {/* Project list */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchQuery ? t('projects.export.noResults') : t('projects.export.noProjects')}
              </div>
            ) : (
              <div className="divide-y">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProjectSelection(project.id)}
                    />
                    <label 
                      htmlFor={`project-${project.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {project.location} • {project.status}
                      </div>
                    </label>
                    <Badge variant="outline">{project.progress}%</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">{t('projects.export.selectFormat')}:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant={exportFormat === 'json' ? 'default' : 'outline'}
              onClick={() => setExportFormat('json')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">JSON</div>
                <div className="text-xs opacity-70">{t('projects.export.jsonDesc')}</div>
              </div>
            </Button>
            
            <Button
              variant={exportFormat === 'excel' ? 'default' : 'outline'}
              onClick={() => setExportFormat('excel')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs opacity-70">{t('projects.export.excelDesc')}</div>
              </div>
            </Button>
            
            <Button
              variant={exportFormat === 'csv' ? 'default' : 'outline'}
              onClick={() => setExportFormat('csv')}
              className="flex items-center gap-2 h-auto p-4"
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs opacity-70">{t('projects.export.csvDesc')}</div>
              </div>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={exporting || !projects || projects.length === 0 || selectedProjects.length === 0}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? t('projects.export.exporting') : `${t('projects.export.exportAs')} ${exportFormat.toUpperCase()} (${selectedProjects.length})`}
          </Button>
        </div>

        {projects && projects.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('projects.export.createFirst')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectExporter;
