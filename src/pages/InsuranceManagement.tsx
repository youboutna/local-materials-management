import React from 'react';
import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';

const InsuranceManagementPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <UnifiedInsuranceManager />
        </div>
      </div>
    </div>
  );
};

export default InsuranceManagementPage;