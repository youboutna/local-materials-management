import React from 'react';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import { useLanguage } from '@/contexts/LanguageContext';

const InspectionMonitoringPage = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">🔍 {t('inspection_monitoring.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('inspection_monitoring.subtitle')}</p>
          </div>

          <RoleBasedInspectionMonitoring />
        </div>
      </div>
    </div>
  );
};

export default InspectionMonitoringPage;