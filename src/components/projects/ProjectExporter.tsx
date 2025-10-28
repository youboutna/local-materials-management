
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  CheckCircle,
  AlertTriangle
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
  const { toast } = useToast();
  const { t } = useLanguage();
  const projectService = new ProjectService();

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await projectService.getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const prepareProjectData = () => {
    return projects.map(project => ({
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
        description: `${projects.length} ${t('projects.export.projectsExported')} ${exportFormat.toUpperCase()}`,
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
              <Badge variant="secondary" className="ml-2">
                {projects.length} {t('projects.export.available')}
              </Badge>
            )}
          </AlertDescription>
        </Alert>

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
            disabled={exporting || !projects || projects.length === 0}
            className="w-full"
            size="lg"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? t('projects.export.exporting') : `${t('projects.export.exportAs')} ${exportFormat.toUpperCase()}`}
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
