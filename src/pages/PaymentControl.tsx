import React from 'react';
import EnhancedPaymentBlockingInterface from '@/components/payments/EnhancedPaymentBlockingInterface';
import PaymentCrud from '@/components/payments/PaymentCrud';

const PaymentControlPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-6xl mx-auto">
          <EnhancedPaymentBlockingInterface />
          <div className="mt-8">
            <PaymentCrud />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentControlPage;