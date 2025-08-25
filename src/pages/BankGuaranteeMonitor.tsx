import React from 'react';
import BankGuaranteeMonitor from '@/components/alerts/BankGuaranteeMonitor';
import EnhancedBankGuaranteeCrud from '@/components/alerts/EnhancedBankGuaranteeCrud';
import BankGuaranteeActions from '@/components/alerts/BankGuaranteeActions';

const BankGuaranteeMonitorPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🏦 Surveillance Garanties Bancaires</h1>
            <p className="text-gray-600 mt-2">
              Système automatisé de détection des retards et déclenchement des garanties bancaires
            </p>
          </div>
          
          <BankGuaranteeMonitor />
          <div className="mt-8">
            <EnhancedBankGuaranteeCrud />
          </div>
          <div className="mt-8">
            <BankGuaranteeActions 
              bankGuaranteeId="demo-bg-001"
              projectId="demo-project-001"
              contractorId="demo-contractor-001"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankGuaranteeMonitorPage;