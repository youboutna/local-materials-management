import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProjectReportGenerator } from './ProjectReportGenerator';
import TenderReportGenerator from './TenderReportGenerator';
import InspectionReportGenerator from './InspectionReportGenerator';
import SupplierPaymentReportGenerator from './SupplierPaymentReportGenerator';
import { FileText, FileBarChart, CheckCircle, DollarSign } from 'lucide-react';
import { ProjectData } from '@/types/project';

interface ReportManagerProps {
  data: {
    project?: ProjectData;
    tender?: any;
    inspection?: any;
    supplier?: any;
    payments?: any[];
  };
  reportType: 'project' | 'tender' | 'inspection' | 'payment';
}

export function ReportManager({ data, reportType }: ReportManagerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getReportIcon = () => {
    switch (reportType) {
      case 'project':
        return <FileBarChart className="h-4 w-4" />;
      case 'tender':
        return <FileText className="h-4 w-4" />;
      case 'inspection':
        return <CheckCircle className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'project':
        return 'Générer Rapport de Projet';
      case 'tender':
        return 'Générer Rapport d\'Appel d\'Offres';
      case 'inspection':
        return 'Générer Rapport d\'Inspection';
      case 'payment':
        return 'Générer Rapport de Paiements';
      default:
        return 'Générer Rapport';
    }
  };

  const renderReportGenerator = () => {
    switch (reportType) {
      case 'project':
        return data.project ? (
          <ProjectReportGenerator 
            project={data.project} 
            onClose={() => setIsOpen(false)} 
          />
        ) : null;
      
      case 'tender':
        return data.tender ? (
          <TenderReportGenerator 
            tender={data.tender} 
            onClose={() => setIsOpen(false)} 
          />
        ) : null;
      
      case 'inspection':
        return data.inspection ? (
          <InspectionReportGenerator 
            inspection={data.inspection}
            project={data.project}
            onClose={() => setIsOpen(false)} 
          />
        ) : null;
      
      case 'payment':
        return data.supplier && data.payments ? (
          <SupplierPaymentReportGenerator 
            supplier={data.supplier}
            payments={data.payments}
            dateRange={{
              startDate: new Date(new Date().getFullYear(), 0, 1), // Start of year
              endDate: new Date()
            }}
            onClose={() => setIsOpen(false)} 
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          {getReportIcon()}
          {getReportTitle()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getReportTitle()}</DialogTitle>
        </DialogHeader>
        {renderReportGenerator()}
      </DialogContent>
    </Dialog>
  );
}