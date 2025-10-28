
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
import { ProjectService } from '@/services/ProjectService';
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
  const projectService = new ProjectService();

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

  const prepareProjectData = () => {
    // Only export selected projects
    const projectsToExport = projects.filter(p => selectedProjects.includes(p.id));
    return projectsToExport.map(project => ({
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
      financingSource: project.financingSource || '',
      marketType: project.marketType || '',
      selectionMode: project.selectionMode || '',
      launchDate: project.launchDate || '',
      attributionDate: project.attributionDate || ''
    }));
  };

  const exportToJson = () => {
    const data = prepareProjectData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projets_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const data = prepareProjectData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projets');
    
    // Auto-adjust column widths
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `projets_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCsv = () => {
    const data = prepareProjectData();
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
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
          exportToJson();
          break;
        case 'excel':
          exportToExcel();
          break;
        case 'csv':
          exportToCsv();
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
