import React from 'react';
import RoleBasedInspectionMonitoring from '@/components/inspections/RoleBasedInspectionMonitoring';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout';

const InspectionMonitoringPage = () => {
  const { t } = useLanguage();

  return (
    <AppLayout
      pageTitle={`🔍 ${t('inspection_monitoring.title')}`}
      pageDescription={t('inspection_monitoring.subtitle')}
    >
      <RoleBasedInspectionMonitoring />
    </AppLayout>
  );
};

export default InspectionMonitoringPage;