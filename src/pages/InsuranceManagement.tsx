import React from 'react';
import InsuranceCertificateManager from '@/components/insurance/InsuranceCertificateManager';

const InsuranceManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <InsuranceCertificateManager />
        </div>
      </div>
    </div>
  );
};

export default InsuranceManagementPage;