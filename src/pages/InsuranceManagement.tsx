import React from 'react';
import UnifiedInsuranceManager from '@/components/insurance/UnifiedInsuranceManager';
import InsuranceActions from '@/components/insurance/InsuranceActions';

const InsuranceManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <UnifiedInsuranceManager />
          <div className="mt-8">
            <InsuranceActions 
              insuranceId="demo-insurance-001"
              projectId="demo-project-001"
              contractorId="demo-contractor-001"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceManagementPage;